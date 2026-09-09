'use client'

/**
 * Data access for the admin community panel: posts, polls (with their
 * results), events and guidebook entries, cached under the admin's own scope.
 */

import { useCallback } from 'react'
import { communityApi, pollsApi, eventsApi, guidebookApi } from '@/lib/api'
import { useResource, type UseResourceResult } from '@/hooks/use-resource'
import { TTL } from '@/lib/offline/store'
import { useSession } from '@/lib/session/session-context'
import type {
  CommunityPost,
  GuidebookEntry,
  HostelEvent,
  Poll,
} from '@/lib/types'

export type PollResults = { [pollId: number]: any[] }

export interface AdminCommunityData {
  posts: UseResourceResult<CommunityPost[]>
  polls: UseResourceResult<{ polls: Poll[]; results: PollResults }>
  events: UseResourceResult<HostelEvent[]>
  entries: UseResourceResult<GuidebookEntry[]>
  reload: () => Promise<void>
}

export function useAdminCommunityData(): AdminCommunityData {
  const { scope } = useSession()

  const posts = useResource<CommunityPost[]>({
    resource: 'admin:community:posts',
    scope,
    ttlMs: TTL.community,
    fetcher: async () => {
      const res = await communityApi.getPosts()
      if (!res.data?.success) throw new Error(res.data?.message)
      return (res.data.data ?? []) as CommunityPost[]
    },
  })

  const polls = useResource<{ polls: Poll[]; results: PollResults }>({
    resource: 'admin:community:polls',
    scope,
    ttlMs: TTL.community,
    fetcher: async () => {
      const res = await pollsApi.getPolls()
      if (!res.data?.success) throw new Error(res.data?.message)
      const loaded: Poll[] = res.data.data ?? []

      const results: PollResults = {}
      await Promise.all(
        loaded.map(async (poll) => {
          try {
            const r = await pollsApi.getPollResults(poll.poll_id)
            if (r.data?.success) results[poll.poll_id] = r.data.data
          } catch {
            // One poll's results failing must not sink the list.
          }
        }),
      )

      return { polls: loaded, results }
    },
  })

  const events = useResource<HostelEvent[]>({
    resource: 'admin:community:events',
    scope,
    ttlMs: TTL.events,
    fetcher: async () => {
      const res = await eventsApi.getEvents()
      if (!res.data?.success) throw new Error(res.data?.message)
      return (res.data.data ?? []) as HostelEvent[]
    },
  })

  const entries = useResource<GuidebookEntry[]>({
    resource: 'admin:community:guidebook',
    scope,
    ttlMs: TTL.guidebook,
    fetcher: async () => {
      const res = await guidebookApi.getEntries()
      if (!res.data?.success) throw new Error(res.data?.message)
      return (res.data.data ?? []) as GuidebookEntry[]
    },
  })

  const reload = useCallback(async () => {
    await Promise.all([
      posts.refresh(),
      polls.refresh(),
      events.refresh(),
      entries.refresh(),
    ])
  }, [posts, polls, events, entries])

  return { posts, polls, events, entries, reload }
}
