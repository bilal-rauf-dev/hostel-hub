'use client'

import { motion, AnimatePresence } from 'motion/react'
import { Inbox, Plus, RefreshCw, Search, ShoppingBag, Tag } from 'lucide-react'
import { useEffect, useState } from 'react'

import { marketplaceApi } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { useMarketplaceData } from '@/hooks/use-marketplace-data'
import { useWriteGuard } from '@/lib/session/session-context'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StaleMarker,
} from '@/components/offline/resource-states'
import type { Listing, Order, OrderStatus } from '@/lib/types'

import { CreateListingForm } from './marketplace/create-listing-form'
import { ListingCard } from './marketplace/listing-card'
import { ModalShell } from './marketplace/modal-shell'
import { OrderDetailModal } from './marketplace/order-detail-modal'
import { QuantityModal } from './marketplace/quantity-modal'
import {
  MyListingRow,
  MyOrderRow,
  ReceivedOrderRow,
} from './marketplace/order-rows'

const CATEGORIES = ['All', 'Electronics', 'Books', 'Clothing', 'Food', 'Other']

type MarketTab = 'Market' | 'Orders' | 'Listings'

const TABS: { id: MarketTab; label: string }[] = [
  { id: 'Market', label: 'Browse Market' },
  { id: 'Orders', label: 'My Orders' },
  { id: 'Listings', label: 'My Listings' },
]

interface Props {
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void
}

export function MarketplaceView({ onToast }: Props) {
  const currentUser = getCurrentUser()
  const guardWrite = useWriteGuard()

  const [tab, setTab] = useState<MarketTab>('Market')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [orderingListing, setOrderingListing] = useState<Listing | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(handler)
  }, [search])

  const {
    listings: listingsResource,
    orders: ordersResource,
    received: receivedResource,
    reload,
  } = useMarketplaceData(debouncedSearch, selectedCategory)

  const listings = listingsResource.data ?? []
  const orders = ordersResource.data ?? []
  const receivedOrders = receivedResource.data ?? []
  const myListings = listings.filter((l) => l.seller_id === currentUser?.user_id)

  const activeResource =
    tab === 'Orders'
      ? ordersResource
      : tab === 'Listings'
        ? receivedResource
        : listingsResource

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await reload()
    } finally {
      setRefreshing(false)
    }
  }

  const openOrderModal = (listing: Listing) => {
    if (!guardWrite('place an order')) return
    setOrderingListing(listing)
    setQuantity(1)
  }

  const handlePlaceOrder = async () => {
    if (!orderingListing) return
    if (!guardWrite('place an order')) return

    try {
      const res = await marketplaceApi.placeOrder(
        orderingListing.listing_id,
        quantity,
      )
      if (res.data?.success) {
        onToast('Order placed successfully', 'success')
        await reload()
      } else {
        onToast(res.data?.message || 'Failed to place order', 'error')
      }
    } catch (err: any) {
      onToast(
        err?.response?.data?.message || err?.message || 'Network error',
        'error',
      )
    } finally {
      setOrderingListing(null)
      setQuantity(1)
    }
  }

  const updateOrderStatus = async (orderId: number, status: OrderStatus) => {
    if (!guardWrite('update an order')) return
    try {
      await marketplaceApi.updateOrderStatus(orderId, status)
      await reload()
      onToast(
        status === 'cancelled' ? 'Order cancelled' : `Order ${status}`,
        status === 'cancelled' ? 'error' : 'success',
      )
    } catch {
      onToast('Could not update that order', 'error')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h3 className="text-2xl font-black text-[#4D5D53] tracking-tight">
          Marketplace
        </h3>

        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1.5 rounded-2xl border border-[#F0F0EE] shadow-sm">
            {TABS.map(({ id, label }) => (
              <motion.button
                key={id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTab(id)}
                aria-pressed={tab === id}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  tab === id
                    ? 'bg-[#4D5D53] text-white shadow-lg'
                    : 'text-[#9A9A9A] hover:bg-[#FAF9F6]'
                }`}
              >
                {label}
              </motion.button>
            ))}
          </div>

          <motion.button
            onClick={handleRefresh}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={refreshing}
            aria-label="Refresh"
            className="p-2.5 bg-white border border-[#F0F0EE] rounded-xl text-[#79837C] hover:bg-[#FAF9F6] transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
          </motion.button>
        </div>
      </div>

      {activeResource.isStale && (
        <div className="flex justify-end">
          <StaleMarker fetchedAt={activeResource.fetchedAt} />
        </div>
      )}

      <ModalShell
        open={creating}
        onClose={() => setCreating(false)}
        labelledBy="create-listing-title"
      >
        <h4 id="create-listing-title" className="text-xl font-black mb-6 text-[#4D5D53]">
          Create Listing
        </h4>
        <CreateListingForm
          onDone={async (success, message) => {
            if (success) {
              onToast(message || 'Listing created successfully', 'success')
              setCreating(false)
              await reload()
            } else {
              onToast(message || 'Failed to create listing', 'error')
            }
          }}
          onCancel={() => setCreating(false)}
        />
      </ModalShell>

      <QuantityModal
        listing={orderingListing}
        quantity={quantity}
        onQuantityChange={setQuantity}
        onConfirm={handlePlaceOrder}
        onClose={() => setOrderingListing(null)}
      />

      <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />

      <AnimatePresence mode="wait">
        {tab === 'Market' ? (
          <motion.div
            key="market"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 w-full relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#BDBDBD]"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search listings"
                  placeholder="What are you looking for?"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-[#EFEFE9] rounded-2xl outline-none focus:border-[#D4A373] focus:ring-4 focus:ring-[#D4A373]/5 shadow-sm transition-all"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (!guardWrite('create a listing')) return
                  setCreating(true)
                }}
                className="w-full md:w-auto px-8 py-4 bg-[#4D5D53] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#4D5D53]/20 hover:bg-[#3D4D43] transition-all"
              >
                <Plus className="h-5 w-5" aria-hidden="true" />
                Create Listing
              </motion.button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {CATEGORIES.map((cat, idx) => (
                <motion.button
                  key={cat}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedCategory(cat)}
                  aria-pressed={selectedCategory === cat}
                  className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-[0.15em] whitespace-nowrap transition-all border-2 ${
                    selectedCategory === cat
                      ? 'bg-[#E9EDC9] border-[#E9EDC9] text-[#4D5D53] shadow-md'
                      : 'bg-white border-[#F0F0EE] text-[#9A9A9A] hover:border-[#E9EDC9] hover:text-[#4D5D53]'
                  }`}
                >
                  {cat}
                </motion.button>
              ))}
            </div>

            {listingsResource.status === 'loading' && (
              <LoadingState label="Loading the marketplace" />
            )}

            {listingsResource.status === 'error' && (
              <ErrorState
                message={listingsResource.error ?? 'Unknown error'}
                onRetry={listingsResource.refresh}
              />
            )}

            {listingsResource.status === 'ready' && listings.length === 0 && (
              <EmptyState
                title="No items found"
                hint="Try another category or search term."
                icon={ShoppingBag}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {listings.map((listing, idx) => (
                  <ListingCard
                    key={listing.listing_id}
                    listing={listing}
                    index={idx}
                    isOwn={listing.seller_id === currentUser?.user_id}
                    onBuy={openOrderModal}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : tab === 'Listings' ? (
          <motion.div
            key="listings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {receivedResource.status === 'error' ? (
              <ErrorState
                message={receivedResource.error ?? 'Unknown error'}
                onRetry={receivedResource.refresh}
              />
            ) : myListings.length === 0 ? (
              <EmptyState
                title="No active listings"
                hint="You have not posted anything for sale yet."
                icon={Tag}
              />
            ) : (
              myListings.map((listing) => (
                <MyListingRow key={listing.listing_id} listing={listing} />
              ))
            )}

            <div className="mt-10">
              <h4 className="text-sm font-black uppercase tracking-widest text-[#4D5D53] mb-4">
                Received Orders
              </h4>
              {receivedOrders.length === 0 ? (
                <div className="p-6 text-sm text-[#9A9A9A] bg-white rounded-[2rem] border border-[#F0F0EE] text-center italic shadow-sm">
                  No orders received yet.
                </div>
              ) : (
                receivedOrders.map((order) => (
                  <ReceivedOrderRow
                    key={order.order_id}
                    order={order}
                    onUpdateStatus={updateOrderStatus}
                  />
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {ordersResource.status === 'loading' ? (
              <LoadingState label="Loading your orders" />
            ) : ordersResource.status === 'error' ? (
              <ErrorState
                message={ordersResource.error ?? 'Unknown error'}
                onRetry={ordersResource.refresh}
              />
            ) : orders.length === 0 ? (
              <EmptyState
                title="No orders found"
                hint="You have not placed any orders yet."
                icon={Inbox}
              />
            ) : (
              orders.map((order) => (
                <MyOrderRow
                  key={order.order_id}
                  order={order}
                  onOpen={setDetailOrder}
                  onCancel={(id) => updateOrderStatus(id, 'cancelled')}
                />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
