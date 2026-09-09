/**
 * Offline cache store.
 *
 * A thin typed wrapper over IndexedDB holding the last successful response for
 * each resource, so the app renders something useful when the API is
 * unreachable. See docs/plans/offline-first-guest-mode.md.
 *
 * Keys are namespaced by scope. Anything personal lives under `user:<id>:` and
 * is wiped on logout; public content lives under `guest:` and survives.
 * That separation is the security boundary of this whole feature.
 */

export type CacheScope = 'guest' | `user:${number}`

export interface CacheEntry<T = unknown> {
  key: string
  scope: CacheScope
  data: T
  fetchedAt: number
  ttlMs: number
  schemaVersion: number
}

/** Bump when a cached payload shape changes. Mismatched entries are discarded. */
export const CACHE_SCHEMA_VERSION = 1

const DB_NAME = 'hostelhub-offline'
const DB_VERSION = 1
const STORE = 'resources'

/** Soft staleness thresholds. Expired data is still rendered, just marked stale. */
export const TTL = {
  guidebook: 24 * 60 * 60 * 1000,
  profile: 60 * 60 * 1000,
  events: 5 * 60 * 1000,
  listings: 5 * 60 * 1000,
  lostFound: 5 * 60 * 1000,
  community: 2 * 60 * 1000,
  tickets: 2 * 60 * 1000,
  safetyAlerts: 60 * 1000,
  notifications: 30 * 1000,
} as const

export function buildKey(scope: CacheScope, resource: string): string {
  return `${scope}:${resource}`
}

// ---------------------------------------------------------------------------
// Backing store
// ---------------------------------------------------------------------------

interface Backend {
  get(key: string): Promise<CacheEntry | undefined>
  set(entry: CacheEntry): Promise<void>
  remove(key: string): Promise<void>
  keys(): Promise<string[]>
  all(): Promise<CacheEntry[]>
}

/**
 * Fallback for private browsing, disabled storage, or anything that throws on
 * `indexedDB.open`. The app must never crash because caching is unavailable.
 */
class MemoryBackend implements Backend {
  private map = new Map<string, CacheEntry>()

  async get(key: string) {
    return this.map.get(key)
  }
  async set(entry: CacheEntry) {
    this.map.set(entry.key, entry)
  }
  async remove(key: string) {
    this.map.delete(key)
  }
  async keys() {
    return [...this.map.keys()]
  }
  async all() {
    return [...this.map.values()]
  }
}

class IndexedDbBackend implements Backend {
  constructor(private db: IDBDatabase) {}

  private tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest): Promise<T> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORE, mode)
      const request = run(transaction.objectStore(STORE))
      request.onsuccess = () => resolve(request.result as T)
      request.onerror = () => reject(request.error)
    })
  }

  get(key: string) {
    return this.tx<CacheEntry | undefined>('readonly', (s) => s.get(key))
  }
  set(entry: CacheEntry) {
    return this.tx<void>('readwrite', (s) => s.put(entry))
  }
  remove(key: string) {
    return this.tx<void>('readwrite', (s) => s.delete(key))
  }
  keys() {
    return this.tx<string[]>('readonly', (s) => s.getAllKeys() as IDBRequest).then((k) =>
      (k as unknown as IDBValidKey[]).map(String),
    )
  }
  all() {
    return this.tx<CacheEntry[]>('readonly', (s) => s.getAll())
  }
}

let backendPromise: Promise<Backend> | null = null

function openBackend(): Promise<Backend> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(new MemoryBackend())
  }

  return new Promise<Backend>((resolve) => {
    let settled = false
    const done = (b: Backend) => {
      if (!settled) {
        settled = true
        resolve(b)
      }
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'key' })
        }
      }
      request.onsuccess = () => done(new IndexedDbBackend(request.result))
      request.onerror = () => done(new MemoryBackend())
      request.onblocked = () => done(new MemoryBackend())

      // Safari in private mode can leave the request hanging indefinitely.
      setTimeout(() => done(new MemoryBackend()), 2000)
    } catch {
      done(new MemoryBackend())
    }
  })
}

function backend(): Promise<Backend> {
  if (!backendPromise) backendPromise = openBackend()
  return backendPromise
}

// ---------------------------------------------------------------------------
// Public surface
// ---------------------------------------------------------------------------

export interface ReadResult<T> {
  data: T
  fetchedAt: number
  isStale: boolean
}

/**
 * Read an entry. Returns null when absent or written by an older schema.
 * An expired entry is still returned, flagged `isStale`.
 */
export async function readCache<T>(key: string): Promise<ReadResult<T> | null> {
  try {
    const db = await backend()
    const entry = (await db.get(key)) as CacheEntry<T> | undefined
    if (!entry) return null

    if (entry.schemaVersion !== CACHE_SCHEMA_VERSION) {
      await db.remove(key)
      return null
    }

    return {
      data: entry.data,
      fetchedAt: entry.fetchedAt,
      // >= so an entry whose TTL has exactly elapsed counts as expired.
      isStale: Date.now() - entry.fetchedAt >= entry.ttlMs,
    }
  } catch {
    return null
  }
}

export async function writeCache<T>(
  key: string,
  scope: CacheScope,
  data: T,
  ttlMs: number,
): Promise<void> {
  const entry: CacheEntry<T> = {
    key,
    scope,
    data,
    fetchedAt: Date.now(),
    ttlMs,
    schemaVersion: CACHE_SCHEMA_VERSION,
  }

  try {
    const db = await backend()
    await db.set(entry)
  } catch (err) {
    if (isQuotaError(err)) {
      await evictOldest(4)
      try {
        const db = await backend()
        await db.set(entry)
      } catch {
        // Give up quietly. A cache miss is survivable; a crash is not.
      }
    }
  }
}

export async function removeCache(key: string): Promise<void> {
  try {
    const db = await backend()
    await db.remove(key)
  } catch {
    // ignore
  }
}

/**
 * Drop every entry belonging to a scope.
 *
 * Called on logout with the departing user's scope. If this does not run, the
 * next person to use the browser sees the previous user's orders, tickets and
 * notifications.
 */
export async function clearScope(scope: CacheScope): Promise<void> {
  try {
    const db = await backend()
    const prefix = `${scope}:`
    const keys = await db.keys()
    await Promise.all(keys.filter((k) => k.startsWith(prefix)).map((k) => db.remove(k)))
  } catch {
    // ignore
  }
}

/** Nuclear option: used when the token is present but its user cannot be resolved. */
export async function clearAllUserScopes(): Promise<void> {
  try {
    const db = await backend()
    const keys = await db.keys()
    await Promise.all(keys.filter((k) => k.startsWith('user:')).map((k) => db.remove(k)))
  } catch {
    // ignore
  }
}

function isQuotaError(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  )
}

async function evictOldest(count: number): Promise<void> {
  try {
    const db = await backend()
    const entries = await db.all()
    entries
      .sort((a, b) => a.fetchedAt - b.fetchedAt)
      .slice(0, count)
      .forEach((e) => void db.remove(e.key))
  } catch {
    // ignore
  }
}

/** Test seam: forces the next call to reopen the database. */
export function __resetStoreForTests(): void {
  backendPromise = null
}
