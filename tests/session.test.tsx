import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SessionProvider, useSession, useWriteGuard } from '@/lib/session/session-context'
import { SignInPrompt } from '@/components/offline/sign-in-prompt'
import * as auth from '@/lib/auth'
import * as store from '@/lib/offline/store'
import * as connectivity from '@/lib/offline/connectivity'

function mockConnectivity(isBackendReachable: boolean) {
  vi.spyOn(connectivity, 'useConnectivity').mockReturnValue({
    isOnline: true,
    isBackendReachable,
    lastCheckedAt: Date.now(),
    checkNow: async () => isBackendReachable,
  })
}

/** Renders the session mode plus a guarded action button. */
function Probe() {
  const { mode } = useSession()
  const guard = useWriteGuard()
  return (
    <>
      <p data-testid="mode">{mode}</p>
      <button onClick={() => guard('place an order')}>Order</button>
    </>
  )
}

function renderSession(onSignedOut = vi.fn()) {
  return render(
    <SessionProvider onSignedOut={onSignedOut}>
      <Probe />
      <SignInPrompt onSignIn={vi.fn()} />
    </SessionProvider>,
  )
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('session modes', () => {
  it('is guest with no token', async () => {
    mockConnectivity(true)
    vi.spyOn(auth, 'getCurrentUser').mockReturnValue(null)

    renderSession()
    await waitFor(() => expect(screen.getByTestId('mode')).toHaveTextContent('guest'))
  })

  it('is authenticated with a token and a reachable backend', async () => {
    mockConnectivity(true)
    vi.spyOn(auth, 'getCurrentUser').mockReturnValue({
      user_id: 7,
      email: 'a@hostel.edu',
      role: 'student',
      exp: 9_999_999_999,
    })

    renderSession()
    await waitFor(() =>
      expect(screen.getByTestId('mode')).toHaveTextContent('authenticated'),
    )
  })

  it('is offline-authenticated with a token but no reachable backend', async () => {
    mockConnectivity(false)
    vi.spyOn(auth, 'getCurrentUser').mockReturnValue({
      user_id: 7,
      email: 'a@hostel.edu',
      role: 'student',
      exp: 9_999_999_999,
    })

    renderSession()
    await waitFor(() =>
      expect(screen.getByTestId('mode')).toHaveTextContent('offline-authenticated'),
    )
  })
})

describe('write guard', () => {
  it('lets a signed-in online user through without a prompt', async () => {
    mockConnectivity(true)
    vi.spyOn(auth, 'getCurrentUser').mockReturnValue({
      user_id: 7,
      email: 'a@hostel.edu',
      role: 'student',
      exp: 9_999_999_999,
    })

    renderSession()
    await waitFor(() =>
      expect(screen.getByTestId('mode')).toHaveTextContent('authenticated'),
    )

    await userEvent.click(screen.getByRole('button', { name: 'Order' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('asks a guest to sign in, naming the action', async () => {
    mockConnectivity(true)
    vi.spyOn(auth, 'getCurrentUser').mockReturnValue(null)

    renderSession()
    await userEvent.click(screen.getByRole('button', { name: 'Order' }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent(/sign in to continue/i)
    expect(dialog).toHaveTextContent(/place an order/i)
  })

  it('tells an offline user it is the connection, not their account', async () => {
    mockConnectivity(false)
    vi.spyOn(auth, 'getCurrentUser').mockReturnValue({
      user_id: 7,
      email: 'a@hostel.edu',
      role: 'student',
      exp: 9_999_999_999,
    })

    renderSession()
    await waitFor(() =>
      expect(screen.getByTestId('mode')).toHaveTextContent('offline-authenticated'),
    )

    await userEvent.click(screen.getByRole('button', { name: 'Order' }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent(/you are offline/i)
    // No sign-in button: they are already signed in.
    expect(
      screen.queryByRole('button', { name: /sign in or register/i }),
    ).not.toBeInTheDocument()
  })
})

describe('signOut', () => {
  it('wipes the departing user cache scope before dropping the identity', async () => {
    // If this regresses, the next person on a shared hostel machine sees the
    // previous student's orders and notifications.
    mockConnectivity(true)
    vi.spyOn(auth, 'getCurrentUser').mockReturnValue({
      user_id: 42,
      email: 'a@hostel.edu',
      role: 'student',
      exp: 9_999_999_999,
    })
    vi.spyOn(auth, 'clearTokens').mockImplementation(() => {})
    const clearScope = vi.spyOn(store, 'clearScope').mockResolvedValue()

    function SignOutButton() {
      const { signOut, mode } = useSession()
      return (
        <>
          <p data-testid="mode">{mode}</p>
          <button onClick={() => void signOut()}>Sign out</button>
        </>
      )
    }

    render(
      <SessionProvider>
        <SignOutButton />
      </SessionProvider>,
    )

    await waitFor(() =>
      expect(screen.getByTestId('mode')).toHaveTextContent('authenticated'),
    )

    await userEvent.click(screen.getByRole('button', { name: /sign out/i }))

    await waitFor(() => expect(clearScope).toHaveBeenCalledWith('user:42'))
    expect(auth.clearTokens).toHaveBeenCalled()
    await waitFor(() => expect(screen.getByTestId('mode')).toHaveTextContent('guest'))
  })
})
