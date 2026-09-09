'use client'

/**
 * Marketplace data access: three cached resources plus a combined reload.
 *
 * Kept out of the view so marketplace-view.tsx composes and renders only.
 * See docs/02-frontend-standards.md.
 */

import { useCallback } from 'react'
import { marketplaceApi } from '@/lib/api'
import { useResource, type UseResourceResult } from '@/hooks/use-resource'
import { TTL } from '@/lib/offline/store'
import { useSession } from '@/lib/session/session-context'
import type { Listing, Order } from '@/lib/types'

export interface MarketplaceData {
  listings: UseResourceResult<Listing[]>
  orders: UseResourceResult<Order[]>
  received: UseResourceResult<Order[]>
  reload: () => Promise<void>
}

export function useMarketplaceData(
  search: string,
  category: string,
): MarketplaceData {
  const { isGuest, scope } = useSession()
  const categoryParam = category === 'All' ? undefined : category

  // Public, so the guest scope: readable signed out and offline. The cache key
  // carries the active filters so each filter combination caches separately.
  const listings = useResource<Listing[]>({
    resource: `marketplace:listings?q=${search}&c=${category}`,
    scope: 'guest',
    ttlMs: TTL.listings,
    fetcher: async () => {
      const res = await marketplaceApi.getListings(search, categoryParam)
      if (!res.data?.success) throw new Error(res.data?.message)
      return (res.data.data ?? []) as Listing[]
    },
  })

  // Personal: user scope, wiped on sign-out, never fetched for a guest.
  const orders = useResource<Order[]>({
    resource: 'marketplace:orders:mine',
    scope,
    ttlMs: TTL.listings,
    enabled: !isGuest,
    fetcher: async () => {
      const res = await marketplaceApi.getMyOrders()
      if (!res.data?.success) throw new Error(res.data?.message)
      return (res.data.data ?? []) as Order[]
    },
  })

  const received = useResource<Order[]>({
    resource: 'marketplace:orders:received',
    scope,
    ttlMs: TTL.listings,
    enabled: !isGuest,
    fetcher: async () => {
      const res = await marketplaceApi.getReceivedOrders()
      if (!res.data?.success) throw new Error(res.data?.message)
      return (res.data.data ?? []) as Order[]
    },
  })

  const reload = useCallback(async () => {
    await Promise.all([
      listings.refresh(),
      isGuest ? Promise.resolve() : orders.refresh(),
      isGuest ? Promise.resolve() : received.refresh(),
    ])
  }, [listings, orders, received, isGuest])

  return { listings, orders, received, reload }
}
