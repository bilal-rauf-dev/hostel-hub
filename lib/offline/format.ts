/** "just now", "12 minutes ago", "3 hours ago", "2 days ago". */
export function relativeTime(timestamp: number | null): string {
  if (!timestamp) return 'never'

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (seconds < 45) return 'just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}
