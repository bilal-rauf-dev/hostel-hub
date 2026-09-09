import type { Timestamp } from './api'

export type LostFoundType = 'lost' | 'found'

export interface LostFoundItem {
  item_id: number
  item_type: LostFoundType
  title: string
  description: string
  location_tag: string | null
  /** Alias of location_tag added by the backend for the UI. */
  location: string | null
  item_date: string | null
  posted_date: string | null
  image_url: string | null
  is_anonymous: boolean
  is_archived: boolean
  status: string | null
  /** null when the post is anonymous. */
  reporter: number | null
  /** 'Anonymous' when the post is anonymous. */
  reporter_name: string
}
