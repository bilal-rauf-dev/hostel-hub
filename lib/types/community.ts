import type { Timestamp } from './api'

export interface CommunityPost {
  post_id: number
  user_id: number
  content: string
  created_at: Timestamp
  author_name?: string
  display_name?: string
  like_count?: number
  liked_by_me?: boolean
}

export interface PollOption {
  option_id: number
  poll_id: number
  option_text: string
  vote_count?: number
  percentage?: number
}

export interface Poll {
  poll_id: number
  question: string
  deadline: Timestamp | null
  created_at: Timestamp
  options: PollOption[]
  my_vote?: number | null
}
