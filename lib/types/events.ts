import type { Timestamp } from './api'

export type RsvpStatus = 'going' | 'maybe' | 'not_going'

export interface HostelEvent {
  event_id: number
  title: string
  description: string
  event_date: Timestamp
  location: string
  created_by: number | null
  created_at: Timestamp
  /** Count of 'going' RSVPs. Present for guests too. */
  attendees: number
  /** The signed-in user's own RSVP. Always null in guest mode. */
  my_rsvp: RsvpStatus | null
}
