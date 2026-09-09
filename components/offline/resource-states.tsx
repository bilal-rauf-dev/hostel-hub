'use client'

import { AlertCircle, Inbox, Clock, RefreshCw } from 'lucide-react'
import { relativeTime } from '@/lib/offline/format'

/**
 * The four states every panel must handle. Empty and error are deliberately
 * different components: "no listings yet" and "couldn't load listings" mean
 * opposite things and must not look the same.
 */

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16" role="status">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#D4A373] border-t-transparent" />
      <p className="text-xs font-bold text-[#9A9A9A]">{label}...</p>
    </div>
  )
}

export function EmptyState({
  title,
  hint,
  icon: Icon = Inbox,
}: {
  title: string
  hint?: string
  icon?: typeof Inbox
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4F4F2]">
        <Icon className="h-5 w-5 text-[#9A9A9A]" aria-hidden="true" />
      </div>
      <p className="text-sm font-black text-[#4D5D53]">{title}</p>
      {hint && <p className="max-w-xs text-xs font-medium text-[#9A9A9A]">{hint}</p>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
        <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
      </div>
      <p className="text-sm font-black text-[#4D5D53]">Could not load this</p>
      <p className="max-w-xs text-xs font-medium text-[#9A9A9A]">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 flex items-center gap-1.5 rounded-xl border border-[#E5E5E0] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#4D5D53] transition-colors hover:bg-[#F4F4F2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A373]"
        >
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  )
}

/** Small honest marker on any panel rendering expired cache. */
export function StaleMarker({ fetchedAt }: { fetchedAt: number | null }) {
  if (!fetchedAt) return null
  return (
    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#B0AFA8]">
      <Clock className="h-3 w-3" aria-hidden="true" />
      Updated {relativeTime(fetchedAt)}
    </p>
  )
}
