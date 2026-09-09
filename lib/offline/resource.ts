/**
 * Resource layer: cache-then-network reads.
 *
 * The rule that matters: a cache hit plus a network failure is NOT an error
 * state. The view keeps its data and gets `isStale`. Only a failure with
 * nothing cached is an error.
 */

import { readCache, writeCache, type CacheScope } from './store'

export type ResourceStatus = 'loading' | 'ready' | 'error'

export interface ResourceSnapshot<T> {
  data: T | null
  status: ResourceStatus
  error: string | null
  isStale: boolean
  fetchedAt: number | null
}

export interface ResourceOptions<T> {
  /** Stable identifier, without the scope prefix. e.g. `marketplace:listings` */
  resource: string
  scope: CacheScope
  ttlMs: number
  fetcher: () => Promise<T>
  /** Skip the network entirely (guest mode hitting a private resource). */
  enabled?: boolean
}

/** In-flight requests, so N views asking for notifications make one call. */
const inFlight = new Map<string, Promise<unknown>>()

export function dedupe<T>(key: string, run: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key)
  if (existing) return existing as Promise<T>

  const promise = run().finally(() => {
    inFlight.delete(key)
  })
  inFlight.set(key, promise)
  return promise
}

export function toMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    const axiosLike = err as {
      response?: { data?: { message?: string }; status?: number }
      message?: string
      code?: string
    }
    const fromBody = axiosLike.response?.data?.message
    if (fromBody) return fromBody
    if (axiosLike.code === 'ERR_NETWORK') return 'Cannot reach the server.'
    if (axiosLike.message) return axiosLike.message
  }
  return 'Something went wrong. Try again.'
}

/**
 * One read cycle. Used by useResource; exported so it can be tested and called
 * outside React (bootstrap, prefetch).
 */
export async function loadResource<T>(
  options: ResourceOptions<T>,
  onSnapshot: (snapshot: ResourceSnapshot<T>) => void,
): Promise<void> {
  const { resource, scope, ttlMs, fetcher, enabled = true } = options
  const key = `${scope}:${resource}`

  const cached = await readCache<T>(key)

  if (cached) {
    onSnapshot({
      data: cached.data,
      status: 'ready',
      error: null,
      isStale: cached.isStale,
      fetchedAt: cached.fetchedAt,
    })
  } else {
    onSnapshot({ data: null, status: 'loading', error: null, isStale: false, fetchedAt: null })
  }

  if (!enabled) {
    if (!cached) {
      onSnapshot({ data: null, status: 'ready', error: null, isStale: false, fetchedAt: null })
    }
    return
  }

  try {
    const fresh = await dedupe(key, fetcher)
    await writeCache(key, scope, fresh, ttlMs)
    onSnapshot({
      data: fresh,
      status: 'ready',
      error: null,
      isStale: false,
      fetchedAt: Date.now(),
    })
  } catch (err) {
    const message = toMessage(err)

    if (cached) {
      // Keep showing what we have. This is the whole point of the feature.
      onSnapshot({
        data: cached.data,
        status: 'ready',
        error: null,
        isStale: true,
        fetchedAt: cached.fetchedAt,
      })
      return
    }

    onSnapshot({ data: null, status: 'error', error: message, isStale: false, fetchedAt: null })
  }
}
