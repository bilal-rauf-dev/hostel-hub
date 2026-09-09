import type { Timestamp } from './api'

export interface GuidebookEntry {
  entry_id: number
  title: string
  content: string
  category: string
  icon_url?: string | null
  created_at: Timestamp
  updated_at: Timestamp | null
}
