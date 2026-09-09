'use client'

import { motion } from 'motion/react'
import Image from 'next/image'
import { ArrowUpRight, Clock, Star, Tag } from 'lucide-react'
import type { Listing } from '@/lib/types'

export function ListingCard({
  listing,
  index,
  isOwn,
  onBuy,
}: {
  listing: Listing
  index: number
  isOwn: boolean
  onBuy: (listing: Listing) => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="group"
    >
      <div className="bg-white rounded-[2.5rem] p-4 border border-[#F0F0EE] shadow-sm hover:border-[#D4A373]/30 hover:bg-[#FAF9F6]/50 transition-all duration-700 overflow-hidden relative hover:shadow-2xl hover:shadow-[#D4A373]/10">
        <div className="aspect-[4/3] rounded-[1.75rem] overflow-hidden mb-5 relative bg-[#F4F4F2]">
          <Image
            unoptimized
            src={`https://picsum.photos/seed/${listing.listing_id}/400/300`}
            alt=""
            fill
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-700" />

          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-white/50 text-[8px] font-black uppercase tracking-widest text-[#4D5D53] transform transition-transform group-hover:translate-x-1 group-hover:translate-y-1">
            {listing.category}
          </div>

          <div className="absolute bottom-4 right-4 bg-[#4D5D53]/90 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold flex items-center gap-1 transform transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" aria-hidden="true" />
            {listing.quantity} left
          </div>
        </div>

        <div className="px-2 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-lg font-bold text-[#4D5D53] tracking-tight line-clamp-1 group-hover:text-[#D4A373] transition-colors">
                {listing.title}
              </h4>
              <p className="text-[10px] text-[#9A9A9A] font-bold flex items-center gap-1.5 mt-0.5">
                <Tag className="h-3 w-3" aria-hidden="true" />
                By {listing.seller_display_name || 'Unknown'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-[#4D5D53] tracking-tighter">
                Rs.{listing.price}
              </p>
              {isOwn ? (
                <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest mt-0.5">
                  Your Item
                </p>
              ) : (
                <p className="text-[9px] text-[#D4A373] font-black uppercase tracking-widest mt-0.5">
                  {listing.status}
                </p>
              )}
            </div>
          </div>

          <div className="h-[1px] bg-emerald-900/5 w-full transition-all group-hover:bg-[#D4A373]/20" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[10px] font-black text-[#79837C] group-hover:text-[#4D5D53] transition-colors uppercase tracking-widest">
              <Clock className="h-3 w-3" aria-hidden="true" />
              Limited Stock
            </div>
            {/*
              This was a click handler on the whole card plus a nested div.
              A real button is focusable and reachable by keyboard, which the
              card never was.
            */}
            {!isOwn && (
              <button
                type="button"
                onClick={() => onBuy(listing)}
                aria-label={`Order ${listing.title}`}
                className="w-10 h-10 bg-[#FAF9F6] rounded-xl flex items-center justify-center text-[#BDBDBD] border border-[#EFEFE9] group-hover:bg-[#D4A373] group-hover:text-white group-hover:border-[#D4A373] group-hover:rotate-12 transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A373] focus-visible:ring-offset-2"
              >
                <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
