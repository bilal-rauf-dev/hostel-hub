import type { Timestamp, UserRole } from './api'

export interface UserProfile {
  user_id: number
  email: string
  student_id: string | null
  display_name: string
  profile_picture: string | null
  contact_number: string | null
  room_number: string | null
  role: UserRole
  is_verified: boolean
  is_suspended: boolean
  created_at: Timestamp
}

export interface UserSummary {
  ticket_count: number
  order_count: number
  post_count: number
  unread_notifications: number
}
