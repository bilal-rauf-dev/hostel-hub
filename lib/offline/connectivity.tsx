'use client'

/**
 * Connectivity tracking.
 *
 * `navigator.onLine` alone is not trustworthy: it reports true whenever a
 * network interface is up, including hostel wifi with no route out and a
 * deployed backend that is asleep. The health probe is the actual signal.
 */

import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const BACKOFF_MS = [2000, 4000, 8000, 16000, 32000, 60000]
const HEALTHY_INTERVAL_MS = 60000

export interface ConnectivityState {
  /** Browser-level network flag. Cheap, optimistic, often wrong. */
  isOnline: boolean
  /** Whether /health answered recently. This is what the UI should trust. */
  isBackendReachable: boolean
  lastCheckedAt: number | null
  /** Force a probe now, e.g. from the retry button on the offline banner. */
  checkNow: () => Promise<boolean>
}

const ConnectivityContext = createContext<ConnectivityState>({
  isOnline: true,
  isBackendReachable: true,
  lastCheckedAt: null,
  checkNow: async () => true,
})

export function ConnectivityProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)
  const [isBackendReachable, setIsBackendReachable] = useState(true)
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null)

  const failureCount = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mounted = useRef(true)

  const probe = useCallback(async (): Promise<boolean> => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    try {
      const res = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
      })
      const ok = res.ok
      if (mounted.current) {
        setIsBackendReachable(ok)
        setLastCheckedAt(Date.now())
      }
      failureCount.current = ok ? 0 : failureCount.current + 1
      return ok
    } catch {
      if (mounted.current) {
        setIsBackendReachable(false)
        setLastCheckedAt(Date.now())
      }
      failureCount.current += 1
      return false
    } finally {
      clearTimeout(timeout)
    }
  }, [])

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)

    const delay =
      failureCount.current === 0
        ? HEALTHY_INTERVAL_MS
        : BACKOFF_MS[Math.min(failureCount.current - 1, BACKOFF_MS.length - 1)]

    timer.current = setTimeout(async () => {
      // Do not burn requests on a hidden tab.
      if (typeof document !== 'undefined' && document.hidden) {
        schedule()
        return
      }
      await probe()
      if (mounted.current) schedule()
    }, delay)
  }, [probe])

  const checkNow = useCallback(async () => {
    const ok = await probe()
    schedule()
    return ok
  }, [probe, schedule])

  useEffect(() => {
    mounted.current = true
    setIsOnline(navigator.onLine)

    void probe().then(() => schedule())

    const handleOnline = () => {
      setIsOnline(true)
      failureCount.current = 0
      void checkNow()
    }
    const handleOffline = () => {
      setIsOnline(false)
      setIsBackendReachable(false)
    }
    const handleVisibility = () => {
      if (!document.hidden) void checkNow()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      mounted.current = false
      if (timer.current) clearTimeout(timer.current)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [probe, schedule, checkNow])

  return (
    <ConnectivityContext.Provider
      value={{ isOnline, isBackendReachable, lastCheckedAt, checkNow }}
    >
      {children}
    </ConnectivityContext.Provider>
  )
}

export function useConnectivity(): ConnectivityState {
  return useContext(ConnectivityContext)
}
