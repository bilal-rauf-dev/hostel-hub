import { describe, expect, it, vi } from 'vitest'
import { relativeTime } from '@/lib/offline/format'

describe('relativeTime', () => {
  it('says never for a missing timestamp', () => {
    expect(relativeTime(null)).toBe('never')
  })

  it('reads naturally at each scale', () => {
    const now = 1_700_000_000_000
    vi.spyOn(Date, 'now').mockReturnValue(now)

    expect(relativeTime(now - 5_000)).toBe('just now')
    expect(relativeTime(now - 60_000)).toBe('1 minute ago')
    expect(relativeTime(now - 12 * 60_000)).toBe('12 minutes ago')
    expect(relativeTime(now - 3 * 3_600_000)).toBe('3 hours ago')
    expect(relativeTime(now - 2 * 86_400_000)).toBe('2 days ago')
  })
})
