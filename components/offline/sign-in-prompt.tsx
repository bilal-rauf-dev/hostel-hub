'use client'

import { motion, AnimatePresence } from 'motion/react'
import { createPortal } from 'react-dom'
import { LogIn, WifiOff, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSession } from '@/lib/session/session-context'

/**
 * Shown when a guest, or a signed-in user who is offline, tries to act.
 * Explains what the action needs instead of failing silently.
 */
export function SignInPrompt({ onSignIn }: { onSignIn: () => void }) {
  const { signInPrompt, dismissSignInPrompt, mode } = useSession()
  const [mounted, setMounted] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const previouslyFocused = useRef<Element | null>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!signInPrompt) return

    previouslyFocused.current = document.activeElement
    closeRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissSignInPrompt()
    }
    document.addEventListener('keydown', onKey)

    return () => {
      document.removeEventListener('keydown', onKey)
      ;(previouslyFocused.current as HTMLElement | null)?.focus?.()
    }
  }, [signInPrompt, dismissSignInPrompt])

  if (!mounted) return null

  const offline = mode === 'offline-authenticated'

  return createPortal(
    <AnimatePresence>
      {signInPrompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-6 backdrop-blur-sm"
          onClick={dismissSignInPrompt}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sign-in-prompt-title"
        >
          <motion.div
            initial={{ scale: 0.94, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm space-y-4 rounded-[2rem] bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  offline ? 'bg-amber-50 text-amber-600' : 'bg-[#E9EDC9] text-[#4D5D53]'
                }`}
              >
                {offline ? <WifiOff className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={dismissSignInPrompt}
                aria-label="Close"
                className="rounded-lg p-1 text-[#9A9A9A] transition-colors hover:bg-[#F4F4F2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A373]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h2 id="sign-in-prompt-title" className="text-xl font-black tracking-tight text-[#4D5D53]">
              {offline ? 'You are offline' : 'Sign in to continue'}
            </h2>

            <p className="text-sm font-medium leading-relaxed text-[#9A9A9A]">
              {offline
                ? `You need a connection to ${signInPrompt.action.replace(' while offline', '')}. Everything you can already see stays available.`
                : `You need a HostelHub account to ${signInPrompt.action}. Browsing stays open either way.`}
            </p>

            {!offline && (
              <button
                type="button"
                onClick={() => {
                  dismissSignInPrompt()
                  onSignIn()
                }}
                className="w-full rounded-2xl bg-[#4D5D53] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[#3D4D43] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A373] focus-visible:ring-offset-2"
              >
                Sign in or register
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
