'use client'

/**
 * Session state.
 *
 * Three modes, because "logged in or not" no longer describes the app:
 *
 *   guest                  no token. Public reads only. Writes prompt sign-in.
 *   authenticated          valid token, backend reachable. Everything works.
 *   offline-authenticated  valid token, backend unreachable. Cached personal
 *                          data renders, marked stale. Writes are blocked.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { clearTokens, getCurrentUser, type DecodedToken } from '@/lib/auth'
import { useConnectivity } from '@/lib/offline/connectivity'
import { clearScope, type CacheScope } from '@/lib/offline/store'

export type SessionMode = 'guest' | 'authenticated' | 'offline-authenticated'

export interface SignInPrompt {
  /** What the user was trying to do, phrased for a modal. */
  action: string
}

export interface SessionState {
  mode: SessionMode
  user: DecodedToken | null
  /** Cache namespace for the current session. */
  scope: CacheScope
  isGuest: boolean
  /** True only when a write can actually succeed. */
  canWrite: boolean
  signInPrompt: SignInPrompt | null
  promptSignIn: (action: string) => void
  dismissSignInPrompt: () => void
  /** Called after a successful login. */
  adoptUser: (user: DecodedToken) => void
  continueAsGuest: () => void
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionState | null>(null)

export function SessionProvider({
  children,
  onSignedOut,
}: {
  children: React.ReactNode
  onSignedOut?: () => void
}) {
  const { isBackendReachable } = useConnectivity()
  const [user, setUser] = useState<DecodedToken | null>(null)
  const [signInPrompt, setSignInPrompt] = useState<SignInPrompt | null>(null)

  useEffect(() => {
    setUser(getCurrentUser())
  }, [])

  const mode: SessionMode = useMemo(() => {
    if (!user) return 'guest'
    return isBackendReachable ? 'authenticated' : 'offline-authenticated'
  }, [user, isBackendReachable])

  const scope: CacheScope = useMemo(
    () => (user ? (`user:${user.user_id}` as CacheScope) : 'guest'),
    [user],
  )

  const promptSignIn = useCallback((action: string) => {
    setSignInPrompt({ action })
  }, [])

  const dismissSignInPrompt = useCallback(() => setSignInPrompt(null), [])

  const adoptUser = useCallback((next: DecodedToken) => {
    setUser(next)
    setSignInPrompt(null)
  }, [])

  const continueAsGuest = useCallback(() => {
    setUser(null)
  }, [])

  const signOut = useCallback(async () => {
    // Wipe this user's cache BEFORE dropping the identity, otherwise the scope
    // to clear is no longer known. Skipping this leaves one student's orders
    // and notifications readable by the next person on a shared machine.
    if (user) {
      await clearScope(`user:${user.user_id}` as CacheScope)
    }
    clearTokens()
    setUser(null)
    onSignedOut?.()
  }, [user, onSignedOut])

  const value: SessionState = {
    mode,
    user,
    scope,
    isGuest: mode === 'guest',
    canWrite: mode === 'authenticated',
    signInPrompt,
    promptSignIn,
    dismissSignInPrompt,
    adoptUser,
    continueAsGuest,
    signOut,
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside SessionProvider')
  return ctx
}

/**
 * Guard for every write path.
 *
 *   const guard = useWriteGuard()
 *   if (!guard('place an order')) return
 */
export function useWriteGuard() {
  const { canWrite, mode, promptSignIn } = useSession()

  return useCallback(
    (action: string): boolean => {
      if (canWrite) return true
      if (mode === 'guest') {
        promptSignIn(action)
      } else {
        promptSignIn(`${action} while offline`)
      }
      return false
    },
    [canWrite, mode, promptSignIn],
  )
}
