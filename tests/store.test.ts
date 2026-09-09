import { beforeEach, describe, expect, it } from 'vitest'
import {
  buildKey,
  clearScope,
  readCache,
  removeCache,
  writeCache,
  __resetStoreForTests,
  type CacheScope,
} from '@/lib/offline/store'

const ONE_MINUTE = 60_000

beforeEach(async () => {
  // fake-indexeddb keeps one database per process, so clear what each test wrote.
  await clearScope('guest')
  await clearScope('user:1' as CacheScope)
  await clearScope('user:2' as CacheScope)
  __resetStoreForTests()
})

describe('buildKey', () => {
  it('namespaces by scope', () => {
    expect(buildKey('guest', 'events')).toBe('guest:events')
    expect(buildKey('user:42' as CacheScope, 'notifications')).toBe(
      'user:42:notifications',
    )
  })
})

describe('readCache / writeCache', () => {
  it('returns null for a key that was never written', async () => {
    expect(await readCache('guest:nothing')).toBeNull()
  })

  it('round-trips a value', async () => {
    await writeCache('guest:events', 'guest', [{ event_id: 1 }], ONE_MINUTE)

    const result = await readCache<{ event_id: number }[]>('guest:events')
    expect(result?.data).toEqual([{ event_id: 1 }])
    expect(result?.isStale).toBe(false)
    expect(result?.fetchedAt).toBeTypeOf('number')
  })

  it('still returns data past its TTL, flagged stale', async () => {
    // A zero TTL is immediately expired. Expired data is shown, not dropped:
    // that is the whole point of the offline behaviour.
    await writeCache('guest:events', 'guest', ['old'], 0)

    const result = await readCache<string[]>('guest:events')
    expect(result?.data).toEqual(['old'])
    expect(result?.isStale).toBe(true)
  })

  it('removes a single key', async () => {
    await writeCache('guest:events', 'guest', ['x'], ONE_MINUTE)
    await removeCache('guest:events')
    expect(await readCache('guest:events')).toBeNull()
  })
})

describe('clearScope', () => {
  it('wipes one user and leaves the other users and guest content alone', async () => {
    // This is the shared-hostel-machine case. If it regresses, one student's
    // orders become visible to the next person to sign in.
    await writeCache('user:1:orders', 'user:1' as CacheScope, ['a-order'], ONE_MINUTE)
    await writeCache('user:1:profile', 'user:1' as CacheScope, { name: 'A' }, ONE_MINUTE)
    await writeCache('user:2:orders', 'user:2' as CacheScope, ['b-order'], ONE_MINUTE)
    await writeCache('guest:guidebook', 'guest', ['rules'], ONE_MINUTE)

    await clearScope('user:1' as CacheScope)

    expect(await readCache('user:1:orders')).toBeNull()
    expect(await readCache('user:1:profile')).toBeNull()

    expect((await readCache<string[]>('user:2:orders'))?.data).toEqual(['b-order'])
    expect((await readCache<string[]>('guest:guidebook'))?.data).toEqual(['rules'])
  })

  it('does not treat a scope name as a prefix of a longer one', async () => {
    // 'user:1' must not match 'user:12'.
    await writeCache('user:12:orders', 'user:12' as CacheScope, ['keep'], ONE_MINUTE)
    await clearScope('user:1' as CacheScope)
    expect((await readCache<string[]>('user:12:orders'))?.data).toEqual(['keep'])
  })
})
