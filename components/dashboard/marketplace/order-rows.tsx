'use client'

import { motion } from 'motion/react'
import Image from 'next/image'
import { ArrowUpRight, ShoppingBag } from 'lucide-react'
import type { Listing, Order, OrderStatus } from '@/lib/types'

function statusChipClass(status: OrderStatus): string {
  if (status === 'delivered') return 'bg-emerald-50 text-emerald-600'
  if (status === 'confirmed') return 'bg-blue-50 text-blue-600'
  if (status === 'cancelled') return 'bg-red-50 text-red-500'
  return 'bg-orange-50 text-orange-500'
}

const ACTION = 'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

/** One of the current user's own listings. */
export function MyListingRow({ listing }: { listing: Listing }) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="bg-white p-6 rounded-[2.5rem] border border-[#F0F0EE] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all hover:border-[#D4A373]/50"
    >
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl overflow-hidden relative shrink-0 bg-[#F4F4F2]">
          <Image
            src={`https://picsum.photos/seed/${listing.listing_id}/400/300`}
            alt=""
            fill
            unoptimized
            className="object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest">
            {listing.category}
          </span>
          <h4 className="font-bold text-[#4D5D53] text-lg">{listing.title}</h4>
          <p className="text-xs text-[#9A9A9A] font-bold">
            Rs.{listing.price} • {listing.quantity} remaining
          </p>
        </div>
      </div>
      <div className="text-left sm:text-right">
        <div className="px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 inline-block">
          {listing.status}
        </div>
      </div>
    </motion.div>
  )
}

/** An order placed on one of the current user's listings. */
export function ReceivedOrderRow({
  order,
  onUpdateStatus,
}: {
  order: Order
  onUpdateStatus: (orderId: number, status: OrderStatus) => void
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="bg-white p-5 rounded-3xl border border-[#F0F0EE] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3 transition-all hover:border-[#D4A373]/50"
    >
      <div>
        <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest">
          Order #{order.order_id}
        </span>
        <h4 className="font-bold text-[#4D5D53] text-lg">{order.item_title}</h4>
        <p className="text-xs text-[#9A9A9A] font-bold">
          By {order.buyer_display_name} • Qty: {order.quantity} • Rs.
          {order.total_price}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${statusChipClass(order.status)}`}
        >
          {order.status}
        </span>

        {order.status === 'pending' && (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onUpdateStatus(order.order_id, 'confirmed')}
              className={`${ACTION} bg-[#4D5D53] text-white hover:bg-[#3D4D43] focus-visible:ring-[#4D5D53]`}
            >
              Confirm
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onUpdateStatus(order.order_id, 'cancelled')}
              className={`${ACTION} border border-red-500 text-red-500 hover:bg-red-50 focus-visible:ring-red-500`}
            >
              Cancel
            </motion.button>
          </>
        )}

        {order.status === 'confirmed' && (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onUpdateStatus(order.order_id, 'delivered')}
              className={`${ACTION} bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600`}
            >
              Deliver
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onUpdateStatus(order.order_id, 'cancelled')}
              className={`${ACTION} border border-red-500 text-red-500 hover:bg-red-50 focus-visible:ring-red-500`}
            >
              Cancel
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  )
}

/** An order the current user placed. */
export function MyOrderRow({
  order,
  onOpen,
  onCancel,
}: {
  order: Order
  onOpen: (order: Order) => void
  onCancel: (orderId: number) => void
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={() => onOpen(order)}
      className="bg-white p-6 rounded-[2.5rem] border border-[#F0F0EE] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between group hover:shadow-md hover:border-[#D4A373]/50 transition-all cursor-pointer gap-4"
    >
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 bg-[#FAF9F6] rounded-2xl flex items-center justify-center text-[#D4A373] group-hover:rotate-6 transition-all shrink-0">
          <ShoppingBag className="h-8 w-8" aria-hidden="true" />
        </div>
        <div>
          <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest">
            Order #{order.order_id}
          </span>
          <h4 className="font-bold text-[#4D5D53] tracking-tight text-lg">
            {order.item_title}
          </h4>
          <p className="text-xs text-[#9A9A9A] font-bold">
            {new Date(order.created_at).toLocaleDateString('en-PK', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}{' '}
            • Rs.{order.total_price ?? order.price}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-8 self-end sm:self-auto">
        <div className="text-right">
          <div
            className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
              order.status === 'delivered'
                ? 'text-emerald-500 bg-emerald-50'
                : order.status === 'cancelled'
                  ? 'text-red-500 bg-red-50'
                  : 'text-blue-500 bg-blue-50'
            }`}
          >
            {order.status}
          </div>
        </div>

        {order.status === 'confirmed' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation()
              onCancel(order.order_id)
            }}
            className={`${ACTION} border border-red-500 text-red-500 hover:bg-red-50 focus-visible:ring-red-500`}
          >
            Cancel
          </motion.button>
        )}

        <ArrowUpRight
          className="h-5 w-5 text-[#BDBDBD] group-hover:text-[#D4A373] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all"
          aria-hidden="true"
        />
      </div>
    </motion.div>
  )
}
