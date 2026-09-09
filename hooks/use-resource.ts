'use client'

/**
 * React binding for the offline resource layer.
 *
 * Replaces the `useEffect` + `setLoading` + `try/catch` block repeated across
 * every view. See docs/02-frontend-standards.md.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { loadResource, type ResourceSnapshot, type ResourceStatus } from '@/lib/offline/resource'
import { useConnectivity } from '@/lib/offline/connectivity'
import type { CacheScope } from '@/lib/offline/store'

export interface UseResourceOptions<T> {
  resource: string
  scope: CacheScope
  ttlMs: number
  fetcher: () => Promise<T>
  enabled?: boolean
  /** Revalidate on this cadence while the tab is visible. Omit for none. */
  refreshIntervalMs?: number
}

export interface UseResourceResult<T> {
  data: T | null
  status: ResourceStatus
  error: string | null
  isStale: boolean
  fetchedAt: number | null
  refresh: () => Promise<void>
  /** Optimistic local update, e.g. after a successful write. */
  mutate: (updater: (current: T | null) => T | null) => void
}

const EMPTY: ResourceSnapshot<never> = {
  data: null,
  status: 'loading',
  error: null,
  isStale: false,
  fetchedAt: null,
}

export function useResource<T>(options: UseResourceOptions<T>): UseResourceResult<T> {
  const { resource, scope, ttlMs, enabled = true, refreshIntervalMs } = options

  const [snapshot, setSnapshot] = useState<ResourceSnapshot<T>>(EMPTY as ResourceSnapshot<T>)
  const mounted = useRef(true)
  const { isBackendReachable } = useConnectivity()

  // Kept in a ref so an inline arrow fetcher does not retrigger the effect.
  const fetcherRef = useRef(options.fetcher)
  fetcherRef.current = options.fetcher

  const apply = useCallback((next: ResourceSnapshot<T>) => {
    if (mounted.current) setSnapshot(next)
  }, [])

  const run = useCallback(async () => {
    await loadResource<T>(
      { resource, scope, ttlMs, enabled, fetcher: () => fetcherRef.current() },
      apply,
    )
  }, [resource, scope, ttlMs, enabled, apply])

  useEffect(() => {
    mounted.current = true
    void run()
    return () => {
      mounted.current = false
    }
  }, [run])

  // Revalidate when the backend comes back.
  const wasReachable = useRef(isBackendReachable)
  useEffect(() => {
    if (isBackendReachable && !wasReachable.current) void run()
    wasReachable.current = isBackendReachable
  }, [isBackendReachable, run])

  // Visibility-aware polling. Replaces the unconditional setInterval polls.
  useEffect(() => {
    if (!refreshIntervalMs || !enabled) return

    const tick = () => {
      if (typeof document !== 'undefined' && document.hidden) return
      void run()
    }
    const id = setInterval(tick, refreshIntervalMs)

    const onFocus = () => {
      if (!document.hidden) void run()
    }
    document.addEventListener('visibilitychange', onFocus)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [refreshIntervalMs, enabled, run])

  const mutate = useCallback((updater: (current: T | null) => T | null) => {
    setSnapshot((prev) => ({ ...prev, data: updater(prev.data) }))
  }, [])

  return {
    data: snapshot.data,
    status: snapshot.status,
    error: snapshot.error,
    isStale: snapshot.isStale,
    fetchedAt: snapshot.fetchedAt,
    refresh: run,
    mutate,
  }
}
