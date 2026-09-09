'use client'

import { motion } from 'motion/react'
import Image from 'next/image'
import { ModalShell } from './modal-shell'
import type { Listing } from '@/lib/types'

export function QuantityModal({
  listing,
  quantity,
  onQuantityChange,
  onConfirm,
  onClose,
}: {
  listing: Listing | null
  quantity: number
  onQuantityChange: (next: number) => void
  onConfirm: () => void
  onClose: () => void
}) {
  const max = Number(listing?.quantity) || 99
  const clamp = (n: number) => Math.min(max, Math.max(1, n))

  return (
    <ModalShell
      open={!!listing}
      onClose={onClose}
      labelledBy="quantity-modal-title"
      className="max-w-sm p-8 rounded-[2.5rem]"
    >
      {listing && (
        <>
          <div className="flex items-center gap-4 mb-6">
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
              <h4 id="quantity-modal-title" className="text-lg font-black text-[#4D5D53]">
                How many do you want?
              </h4>
              <p className="text-sm text-[#9A9A9A]">{listing.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: '#E9EDC9' }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onQuantityChange(clamp(quantity - 1))}
              aria-label="Decrease quantity"
              className="px-4 py-2 bg-[#FAF9F6] rounded-xl border text-lg font-black transition-colors"
            >
              -
            </motion.button>
            <input
              type="number"
              min="1"
              max={max}
              aria-label="Quantity"
              value={quantity.toString()}
              onChange={(e) => onQuantityChange(clamp(parseInt(e.target.value) || 1))}
              className="flex-1 p-3 border rounded-xl text-center text-lg font-bold outline-none focus:border-[#D4A373]"
            />
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: '#E9EDC9' }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onQuantityChange(clamp(quantity + 1))}
              aria-label="Increase quantity"
              className="px-4 py-2 bg-[#FAF9F6] rounded-xl border text-lg font-black transition-colors"
            >
              +
            </motion.button>
          </div>

          <p className="text-sm text-[#9A9A9A] mb-4 text-center">
            Max available: {max}
          </p>

          <div className="bg-[#FAF9F6] p-4 rounded-2xl mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A] mb-1">
              Total
            </p>
            <p className="text-2xl font-black text-[#4D5D53]">
              Rs.{(quantity * (listing.price || 0)).toFixed(2)}
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border font-bold text-sm hover:bg-[#FAF9F6] transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: '#3D4D43' }}
              whileTap={{ scale: 0.97 }}
              onClick={onConfirm}
              className="flex-1 py-3 bg-[#4D5D53] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#4D5D53]/20"
            >
              Confirm
            </motion.button>
          </div>
        </>
      )}
    </ModalShell>
  )
}
