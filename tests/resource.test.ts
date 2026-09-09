import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dedupe, loadResource, toMessage, type ResourceSnapshot } from '@/lib/offline/resource'
import { clearScope, writeCache, __resetStoreForTests } from '@/lib/offline/store'

const ONE_MINUTE = 60_000

beforeEach(async () => {
  await clearScope('guest')
  __resetStoreForTests()
})

/** Collects every snapshot the loader emits, in order. */
function recorder<T>() {
  const snapshots: ResourceSnapshot<T>[] = []
  return {
    snapshots,
    onSnapshot: (s: ResourceSnapshot<T>) => {
      snapshots.push(s)
    },
    get last() {
      return snapshots[snapshots.length - 1]
    },
  }
}

describe('loadResource', () => {
  it('goes loading then ready when there is no cache', async () => {
    const rec = recorder<string[]>()

    await loadResource(
      {
        resource: 'events',
        scope: 'guest',
        ttlMs: ONE_MINUTE,
        fetcher: async () => ['fresh'],
      },
      rec.onSnapshot,
    )

    expect(rec.snapshots[0].status).toBe('loading')
    expect(rec.last.status).toBe('ready')
    expect(rec.last.data).toEqual(['fresh'])
    expect(rec.last.isStale).toBe(false)
  })

  it('paints from cache before the network answers', async () => {
    await writeCache('guest:events', 'guest', ['cached'], ONE_MINUTE)
    const rec = recorder<string[]>()

    await loadResource(
      {
        resource: 'events',
        scope: 'guest',
        ttlMs: ONE_MINUTE,
        fetcher: async () => ['fresh'],
      },
      rec.onSnapshot,
    )

    // First paint is the cached value, already 'ready' -- no spinner.
    expect(rec.snapshots[0].status).toBe('ready')
    expect(rec.snapshots[0].data).toEqual(['cached'])
    // Then the network result replaces it.
    expect(rec.last.data).toEqual(['fresh'])
  })

  it('keeps cached data and marks it stale when the network fails', async () => {
    // The core rule: a cache hit plus a network failure is NOT an error state.
    await writeCache('guest:events', 'guest', ['cached'], ONE_MINUTE)
    const rec = recorder<string[]>()

    await loadResource(
      {
        resource: 'events',
        scope: 'guest',
        ttlMs: ONE_MINUTE,
        fetcher: async () => {
          throw new Error('Network Error')
        },
      },
      rec.onSnapshot,
    )

    expect(rec.last.status).toBe('ready')
    expect(rec.last.data).toEqual(['cached'])
    expect(rec.last.isStale).toBe(true)
    expect(rec.last.error).toBeNull()
  })

  it('is an error only when the network fails with nothing cached', async () => {
    const rec = recorder<string[]>()

    await loadResource(
      {
        resource: 'events',
        scope: 'guest',
        ttlMs: ONE_MINUTE,
        fetcher: async () => {
          throw new Error('Network Error')
        },
      },
      rec.onSnapshot,
    )

    expect(rec.last.status).toBe('error')
    expect(rec.last.data).toBeNull()
    expect(rec.last.error).toBe('Network Error')
  })

  it('does not call the network when disabled', async () => {
    // Guest mode hitting a private resource.
    const fetcher = vi.fn()
    const rec = recorder<string[]>()

    await loadResource(
      { resource: 'notifications', scope: 'guest', ttlMs: ONE_MINUTE, enabled: false, fetcher },
      rec.onSnapshot,
    )

    expect(fetcher).not.toHaveBeenCalled()
    expect(rec.last.status).toBe('ready')
    expect(rec.last.data).toBeNull()
  })

  it('writes the fresh result back to the cache', async () => {
    const rec = recorder<string[]>()

    await loadResource(
      { resource: 'events', scope: 'guest', ttlMs: ONE_MINUTE, fetcher: async () => ['written'] },
      rec.onSnapshot,
    )

    const second = recorder<string[]>()
    await loadResource(
      {
        resource: 'events',
        scope: 'guest',
        ttlMs: ONE_MINUTE,
        fetcher: async () => {
          throw new Error('offline now')
        },
      },
      second.onSnapshot,
    )

    expect(second.last.data).toEqual(['written'])
    expect(second.last.isStale).toBe(true)
  })
})

describe('dedupe', () => {
  it('shares one in-flight promise across concurrent callers', async () => {
    let calls = 0
    const run = async () => {
      calls += 1
      await new Promise((r) => setTimeout(r, 10))
      return calls
    }

    const [a, b, c] = await Promise.all([
      dedupe('k', run),
      dedupe('k', run),
      dedupe('k', run),
    ])

    expect(calls).toBe(1)
    expect([a, b, c]).toEqual([1, 1, 1])
  })

  it('allows a new call once the previous one has settled', async () => {
    let calls = 0
    const run = async () => {
      calls += 1
      return calls
    }

    await dedupe('k', run)
    await dedupe('k', run)
    expect(calls).toBe(2)
  })
})

describe('toMessage', () => {
  it('prefers the API envelope message', () => {
    expect(toMessage({ response: { data: { message: 'Listing not found' } } })).toBe(
      'Listing not found',
    )
  })

  it('gives a plain sentence for a network error', () => {
    expect(toMessage({ code: 'ERR_NETWORK' })).toBe('Cannot reach the server.')
  })

  it('falls back rather than showing an empty string', () => {
    expect(toMessage(undefined)).toBe('Something went wrong. Try again.')
  })
})
