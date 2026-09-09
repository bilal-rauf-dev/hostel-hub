'use client'

import { motion, AnimatePresence } from 'motion/react'
import { CloudOff, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useConnectivity } from '@/lib/offline/connectivity'
import { relativeTime } from '@/lib/offline/format'

/**
 * One banner for the whole app. Per-panel error walls were the old behaviour
 * and they read as fifteen separate bugs rather than one lost connection.
 */
export function ConnectionBanner({ oldestFetchedAt }: { oldestFetchedAt?: number | null }) {
  const { isBackendReachable, isOnline, checkNow } = useConnectivity()
  const [retrying, setRetrying] = useState(false)

  const handleRetry = async () => {
    setRetrying(true)
    try {
      await checkNow()
    } finally {
      setRetrying(false)
    }
  }

  return (
    <AnimatePresence>
      {!isBackendReachable && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <div className="mx-4 mb-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <CloudOff className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
            <p className="flex-1 text-xs font-bold text-amber-800">
              {isOnline ? 'Cannot reach the server.' : 'You are offline.'}{' '}
              {oldestFetchedAt ? (
                <span className="font-medium">
                  Showing data from {relativeTime(oldestFetchedAt)}.
                </span>
              ) : (
                <span className="font-medium">Some content may be unavailable.</span>
              )}
            </p>
            <button
              type="button"
              onClick={handleRetry}
              disabled={retrying}
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${retrying ? 'animate-spin' : ''}`} aria-hidden="true" />
              {retrying ? 'Checking' : 'Retry'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
