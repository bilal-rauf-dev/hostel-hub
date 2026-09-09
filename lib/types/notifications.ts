import type { Timestamp } from './api'

export interface AppNotification {
  notification_id: number
  user_id: number
  title: string
  body: string
  is_read: boolean
  created_at: Timestamp
}

export interface NotificationsPayload {
  notifications: AppNotification[]
  unread_count: number
}
