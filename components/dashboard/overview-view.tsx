'use client'

import { motion, AnimatePresence } from 'motion/react'
import { 
  ArrowRight, 
  Plus, 
  Wrench, 
  CheckCircle2, 
  ShoppingCart, 
  MessageSquare,
  Bell
} from 'lucide-react'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { marketplaceApi, maintenanceApi, usersApi } from '@/lib/api'

export function OverviewView({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recentListings, setRecentListings] = useState<any[]>([])
  const [recentTickets, setRecentTickets] = useState<any[]>([])
  const [summary, setSummary] = useState({ ticket_count: 0, order_count: 0, post_count: 0, unread_notifications: 0 })
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [quantityModal, setQuantityModal] = useState<{ visible: boolean; listing?: any }>({ visible: false })
  const [quantityValue, setQuantityValue] = useState(1)
  const pushToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handlePlaceOrder = async () => {
    if (!quantityModal.listing) return
    try {
      const res = await marketplaceApi.placeOrder(quantityModal.listing.listing_id, quantityValue)
      if (res.data?.success) {
        pushToast('Order placed successfully', 'success')
        setQuantityModal({ visible: false })
        setQuantityValue(1)
        // Refresh listings
        const listRes = await marketplaceApi.getListings()
        if (listRes.data?.success) setRecentListings((listRes.data.data || []).slice(0, 4))
      } else {
        setQuantityModal({ visible: false })
        pushToast(res.data?.message || 'Failed to place order', 'error')
      }
    } catch (err: any) {
      setQuantityModal({ visible: false })
      setQuantityValue(1)
      pushToast(err?.response?.data?.message || err?.message || 'Network error', 'error')
    }
  }

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const [listRes, ticketRes, summaryRes] = await Promise.all([
          marketplaceApi.getListings(),
          maintenanceApi.getTickets(),
          usersApi.getSummary(),
        ])

        if (!mounted) return

        if (listRes.data?.success) setRecentListings((listRes.data.data || []).slice(0, 4))
        if (ticketRes.data?.success) setRecentTickets((ticketRes.data.data || []).slice(0, 4))
        if (summaryRes.data?.success) setSummary(summaryRes.data.data)
      } catch (err: any) {
        setError(err?.message || 'Failed to load overview')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  if (loading) return <div className="p-6">Loading overview...</div>
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>

  return (
    <motion.div 
      initial={{ x: -20, y: 20, opacity: 0, filter: 'blur(10px)' }}
      animate={{ x: 0, y: 0, opacity: 1, filter: 'blur(0px)' }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8"
    >
      {/* Toast */}
      {toast && (
        <div className={`p-3 rounded-lg text-sm ${toast.type === 'success' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-500'}`}>
          {toast.message}
        </div>
      )}

      {/* Quantity Modal — same as marketplace */}
      {quantityModal.visible && quantityModal.listing && createPortal(
        <AnimatePresence>
          <motion.div
            key="modal-overlay"
            className="fixed inset-0 z-[9999] flex items-center justify-center"
          >
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setQuantityModal({ visible: false })}
            />
            <motion.div
              key="modal-content"
              initial={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-white p-6 rounded-2xl w-full max-w-sm mx-4 shadow-2xl z-10"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden relative shrink-0 bg-[#F4F4F2]">
                  <Image
                    src={`https://picsum.photos/seed/${quantityModal.listing.listing_id}/400/300`}
                    alt={quantityModal.listing.title}
                    fill
                    unoptimized
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h4 className="text-lg font-black">How many do you want?</h4>
                  <p className="text-sm text-[#9A9A9A]">{quantityModal.listing.title}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: '#E9EDC9' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQuantityValue(Math.max(1, quantityValue - 1))}
                  className="px-4 py-2 bg-[#FAF9F6] rounded-lg border text-lg font-black transition-colors"
                >−</motion.button>
                <input
                  type="number"
                  min="1"
                  max={parseInt(quantityModal.listing.quantity) || 99}
                  value={quantityValue.toString()}
                  onChange={(e) =>
                    setQuantityValue(
                      Math.min(
                        parseInt(quantityModal.listing.quantity) || 99,
                        Math.max(1, parseInt(e.target.value) || 1)
                      )
                    )
                  }
                  className="flex-1 p-3 border rounded-lg text-center text-lg font-bold"
                />
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: '#E9EDC9' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQuantityValue(Math.min(parseInt(quantityModal.listing.quantity) || 99, quantityValue + 1))}
                  className="px-4 py-2 bg-[#FAF9F6] rounded-lg border text-lg font-black transition-colors"
                >+</motion.button>
              </div>

              <p className="text-sm text-[#9A9A9A] mb-1">Max available: {parseInt(quantityModal.listing.quantity) || 99}</p>
              <p className="text-lg font-black text-[#4D5D53] mb-6">
                Total: Rs.{(quantityValue * (quantityModal.listing.price || 0)).toFixed(2)}
              </p>

              <div className="flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setQuantityModal({ visible: false })}
                  className="px-4 py-2 rounded-xl border font-bold text-sm hover:border-[#3D4D43] transition-colors duration-150"
                >Cancel</motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: '#3D4D43' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handlePlaceOrder}
                  className="px-4 py-2 bg-[#4D5D53] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#4D5D53]/20"
                >Confirm Order</motion.button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ backgroundColor: '#FAF9F6', borderColor: '#F97316', scale: 1.01, transition: { duration: 0.05 } }}
          className="bg-white p-6 rounded-3xl border border-[#EFEFE9] shadow-sm flex items-center justify-between group cursor-pointer transition-all duration-250 hover:shadow-xl hover:shadow-orange-500/5"
          onClick={() => onNavigate?.('Tickets')}
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A] mb-1">My Tickets</p>
            <h4 className="text-2xl font-black text-[#4D5D53]">{summary.ticket_count} Total</h4>
          </div>
          <motion.div whileHover={{ x: 3, y: -3, scale: 1.1 }} className="p-4 bg-orange-50 rounded-2xl text-orange-500">
            <Wrench className="h-6 w-6" />
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ backgroundColor: '#FAF9F6', borderColor: '#10B981', scale: 1.01, transition: { duration: 0.05 } }}
          className="bg-white p-6 rounded-3xl border border-[#EFEFE9] shadow-sm flex items-center justify-between group cursor-pointer transition-all duration-250 hover:shadow-xl hover:shadow-emerald-500/5"
          onClick={() => onNavigate?.('Marketplace')}
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A] mb-1">My Orders</p>
            <h4 className="text-2xl font-black text-[#4D5D53]">{summary.order_count} Placed</h4>
          </div>
          <motion.div whileHover={{ x: 3, y: -3, scale: 1.1 }} className="p-4 bg-emerald-50 rounded-2xl text-emerald-500">
            <ShoppingCart className="h-6 w-6" />
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ backgroundColor: '#FAF9F6', borderColor: '#3B82F6', scale: 1.01, transition: { duration: 0.05 } }}
          className="bg-white p-6 rounded-3xl border border-[#EFEFE9] shadow-sm flex items-center justify-between group cursor-pointer transition-all duration-250 hover:shadow-xl hover:shadow-blue-500/5"
          onClick={() => onNavigate?.('Community')}
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A] mb-1">My Posts</p>
            <h4 className="text-2xl font-black text-[#4D5D53]">{summary.post_count} Shared</h4>
          </div>
          <motion.div whileHover={{ x: 3, y: -3, scale: 1.1 }} className="p-4 bg-blue-50 rounded-2xl text-blue-500">
            <MessageSquare className="h-6 w-6" />
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ backgroundColor: '#FAF9F6', borderColor: '#8B5CF6', scale: 1.01, transition: { duration: 0.05 } }}
          className="bg-white p-6 rounded-3xl border border-[#EFEFE9] shadow-sm flex items-center justify-between group cursor-pointer transition-all duration-250 hover:shadow-xl hover:shadow-purple-500/5"
          onClick={() => {}}
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A] mb-1">Notifications</p>
            <h4 className="text-2xl font-black text-[#4D5D53]">{summary.unread_notifications} Unread</h4>
          </div>
          <motion.div whileHover={{ x: 3, y: -3, scale: 1.1 }} className="p-4 bg-purple-50 rounded-2xl text-purple-500">
            <Bell className="h-6 w-6" />
          </motion.div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Marketplace Items */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#414D45]">Recent Marketplace Items</h3>
            <motion.button 
              whileHover={{ x: 8 }}
              onClick={() => onNavigate?.('Marketplace')}
              className="text-[10px] font-black uppercase tracking-widest text-[#D4A373] flex items-center gap-2 hover:underline underline-offset-4 transition-all"
            >
              View All <ArrowRight className="h-3 w-3" />
            </motion.button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentListings.map((item, idx) => (
              <motion.div 
                key={item.listing_id || idx}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + idx * 0.05, duration: 0.6 }}
                whileHover={{ backgroundColor: '#FAF9F6', borderColor: '#D4A373' }}
                className="bg-white rounded-3xl p-3 border border-[#EFEFE9] flex gap-4 group cursor-pointer shadow-sm transition-all duration-300"
                onClick={() => { setQuantityModal({ visible: true, listing: item }); setQuantityValue(1) }}
              >
                <div className="w-24 h-24 bg-[#F4F4F2] rounded-2xl overflow-hidden relative shrink-0">
                  <Image 
                    src={`https://picsum.photos/seed/${item.listing_id}/400/300`}
                    alt={item.title || 'Product'}
                    fill
                    unoptimized
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 py-1 flex flex-col justify-between">
                  <div>
                    <h5 className="text-sm font-black text-[#4D5D53] line-clamp-1 group-hover:text-[#D4A373] transition-colors">
                      {item.title}
                    </h5>
                    <p className="text-[10px] text-[#9A9A9A] font-bold">By {item.seller_display_name || 'Unknown'}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-[#4D5D53] tracking-tighter">
                      Rs.{item.price?.toFixed?.(2) ?? item.price}
                    </p>
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#D4A373] bg-[#FEFAE0] px-2 py-0.5 rounded-full">
                      Order
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div 
            whileHover={{ backgroundColor: 'rgba(233, 237, 201, 0.4)', borderColor: '#4D5D53' }}
            className="bg-[#E9EDC9]/30 border-2 border-dashed border-[#E9EDC9] rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 cursor-pointer group transition-all duration-50"
          >
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#D4A373] shadow-sm transform transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
              <Plus className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#4D5D53]">Have something to sell?</p>
              <p className="text-xs text-[#79837C]">List your food, services or items on the hub.</p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
              whileTap={{ scale: 0.95 }}
              className="bg-[#4D5D53] text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#4D5D53]/20 transition-all"
              onClick={() => onNavigate?.('Marketplace')}
            >
              Create Listing
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Sidebar — Recent Tickets */}
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="bg-white p-8 rounded-[2.5rem] border border-[#EFEFE9] shadow-sm overflow-hidden relative"
          >
            <div className="relative z-10">
              <h4 className="font-black text-[#4D5D53] mb-6 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                <Wrench className="h-4 w-4 text-[#D4A373]" />
                Recent Tickets
              </h4>
              <div className="space-y-6">
                {recentTickets.length > 0 ? (
                  recentTickets.slice(0, 2).map((ticket, idx) => {
                    const resolved = ticket.status === 'resolved' || ticket.status === 'closed'
                    return (
                      <motion.div 
                        key={ticket.ticket_id || ticket.id || idx}
                        whileHover={{ x: 6 }}
                        className={`relative pl-6 ${idx === 0 ? 'pb-6 border-l border-[#F0F0EE]' : ''} cursor-pointer group`}
                      >
                        <div className={`absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full ${resolved ? 'bg-emerald-500' : 'bg-[#D4A373]'} border-4 border-white transition-transform group-hover:scale-150`} />
                        <p className="text-xs font-bold text-[#414D45] group-hover:text-[#D4A373] transition-colors">
                          {ticket.category} • Room {ticket.room_number}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          {resolved
                            ? <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            : <span className="w-1.5 h-1.5 rounded-full bg-[#D4A373] animate-pulse" />
                          }
                          <p className={`text-[10px] font-bold ${resolved ? 'text-emerald-600' : 'text-[#9A9A9A]'}`}>
                            {ticket.status}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })
                ) : (
                  <p className="text-xs text-[#9A9A9A]">No recent tickets</p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}