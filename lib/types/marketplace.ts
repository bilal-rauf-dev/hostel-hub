import type { Timestamp } from './api'

export type ListingStatus = 'active' | 'sold' | 'removed'
/**
 * Mirrors the `order_status` enum in database/hostelhub.sql, plus 'pending',
 * which the schema originally omitted even though place_order() inserts it.
 * See database/migrations/0001_add_pending_order_status.sql -- that migration
 * must be applied for order placement to work at all.
 */
export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled'

export interface Listing {
  listing_id: number
  seller_id: number
  title: string
  description: string
  category: string
  price: number
  quantity: number
  status: ListingStatus
  created_at: Timestamp
  seller_display_name: string
  /** Withheld on the public (guest) route. */
  seller_contact?: string | null
}

export interface Order {
  order_id: number
  buyer_id: number
  quantity: number
  status: OrderStatus
  created_at: Timestamp
  item_title: string
  price: number
  total_price: number
  /** Present on /orders/mine. */
  seller_display_name?: string
  /** Present on /orders/received, along with listing_id. */
  buyer_display_name?: string
  listing_id?: number
}
