'use client'

import { motion } from 'motion/react'
import { ModalShell } from './modal-shell'
import type { Order } from '@/lib/types'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between py-4 border-b border-[#F0F0EE]">
      <span className="text-sm font-bold text-[#9A9A9A]">{label}</span>
      {children}
    </div>
  )
}

export function OrderDetailModal({
  order,
  onClose,
}: {
  order: Order | null
  onClose: () => void
}) {
  return (
    <ModalShell
      open={!!order}
      onClose={onClose}
      labelledBy="order-detail-title"
      className="max-w-lg p-8 rounded-[3rem]"
    >
      {order && (
        <>
          <h4 id="order-detail-title" className="text-2xl font-black mb-8 text-[#4D5D53]">
            Order Details
          </h4>

          <div className="space-y-4">
            <Row label="Item">
              <span className="font-black text-[#4D5D53]">{order.item_title}</span>
            </Row>
            <Row label="Quantity">
              <span className="font-black text-[#4D5D53]">{order.quantity}</span>
            </Row>
            <Row label="Total Price">
              <span className="font-black text-[#D4A373]">
                Rs.{order.total_price ?? order.price}
              </span>
            </Row>
            <Row label="Seller">
              <span className="font-black text-[#4D5D53]">
                {order.seller_display_name ?? 'Unknown'}
              </span>
            </Row>
            <Row label="Status">
              {/*
                The old markup also tested for 'fulfilled', 'Delivered' and
                'Cancelled'. order_status is lower-case and has no 'fulfilled',
                so those branches never ran.
              */}
              <span
                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                  order.status === 'delivered'
                    ? 'bg-emerald-50 text-emerald-600'
                    : order.status === 'cancelled'
                      ? 'bg-red-50 text-red-500'
                      : 'bg-blue-50 text-blue-600'
                }`}
              >
                {order.status}
              </span>
            </Row>
            <div className="flex justify-between py-4">
              <span className="text-sm font-bold text-[#9A9A9A]">Order Date</span>
              <span className="font-black text-[#4D5D53]">
                {order.created_at
                  ? new Date(order.created_at).toLocaleDateString('en-PK', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Unknown'}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-6 py-3 rounded-2xl border font-bold text-sm hover:bg-[#FAF9F6]"
            >
              Close
            </motion.button>
          </div>
        </>
      )}
    </ModalShell>
  )
}
