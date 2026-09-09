import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StaleMarker,
} from '@/components/offline/resource-states'

describe('resource states', () => {
  it('shows what is loading', () => {
    render(<LoadingState label="Loading events" />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading events')
  })

  it('distinguishes empty from error', () => {
    // These must never look alike: "nothing here yet" and "we could not fetch"
    // mean opposite things to the user.
    const { unmount } = render(
      <EmptyState title="No listings yet" hint="Post something to get started." />,
    )
    expect(screen.getByText('No listings yet')).toBeInTheDocument()
    expect(screen.queryByText(/could not load/i)).not.toBeInTheDocument()
    unmount()

    render(<ErrorState message="Cannot reach the server." />)
    expect(screen.getByText(/could not load this/i)).toBeInTheDocument()
    expect(screen.getByText('Cannot reach the server.')).toBeInTheDocument()
  })

  it('offers a retry only when there is something to retry', async () => {
    const onRetry = vi.fn()
    const { unmount } = render(<ErrorState message="Boom" onRetry={onRetry} />)

    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledOnce()
    unmount()

    render(<ErrorState message="Boom" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('says how old stale data is, and renders nothing without a timestamp', () => {
    const { container, unmount } = render(<StaleMarker fetchedAt={null} />)
    expect(container).toBeEmptyDOMElement()
    unmount()

    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    render(<StaleMarker fetchedAt={1_700_000_000_000 - 12 * 60_000} />)
    expect(screen.getByText(/12 minutes ago/i)).toBeInTheDocument()
  })
})
