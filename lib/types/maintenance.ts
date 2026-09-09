import type { Timestamp } from './api'

/** Mirrors the `ticket_status` enum in database/hostelhub.sql. */
export type TicketStatus =
  | 'submitted'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'closed'

export interface Ticket {
  ticket_id: number
  student_id: number
  description: string
  category: string
  room_number: string | null
  status: TicketStatus
  assigned_to: number | null
  created_at: Timestamp
  updated_at: Timestamp | null
  student_name: string
  student_room: string | null
}
