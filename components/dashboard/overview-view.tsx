'use client'

import { motion } from 'motion/react'
import { 
  ArrowRight, 
  Plus, 
  Calendar, 
  Wrench, 
  CheckCircle2, 
  ShoppingCart, 
  MessageSquare, 
  BarChart3
} from 'lucide-react'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { marketplaceApi, maintenanceApi, notificationsApi } from '@/lib/api'

export function OverviewView() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recentListings, setRecentListings] = useState<any[]>([])
  const [recentTickets, setRecentTickets] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const activeTicketCount = recentTickets.filter((ticket) => ticket.status !== 'resolved' && ticket.status !== 'closed').length

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const [listRes, ticketRes, notifRes] = await Promise.all([
          marketplaceApi.getListings(),
          maintenanceApi.getTickets(),
          notificationsApi.getNotifications(),
        ])

        if (!mounted) return

        if (listRes.data?.success) {
          setRecentListings((listRes.data.data || []).slice(0, 4))
        }
        if (ticketRes.data?.success) {
          setRecentTickets((ticketRes.data.data || []).slice(0, 4))
        }
        if (notifRes.data?.success) {
          setUnreadCount(notifRes.data.data?.unread_count || 0)
        }
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
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ 
            backgroundColor: '#FAF9F6', 
            borderColor: '#D4A373',
            scale: 1.01,
            transition: { duration: 0.05 }
          }}
          className="bg-white p-6 rounded-3xl border border-[#EFEFE9] shadow-sm flex items-center justify-between group cursor-pointer transition-all duration-500 hover:shadow-xl hover:shadow-[#D4A373]/5"
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A] mb-1">Marketplace</p>
            <h4 className="text-2xl font-black text-[#4D5D53]">{recentListings.length} New</h4>
            <p className="text-[10px] items-center flex gap-1 text-emerald-600 font-bold mt-1">
              {recentListings.length} total listings
            </p>
          </div>
          <motion.div 
            whileHover={{ x: 3, y: -3, scale: 1.1 }}
            className="p-4 bg-[#FEFAE0] rounded-2xl text-[#D4A373] transition-transform duration-300"
          >
            <ShoppingCart className="h-6 w-6" />
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ 
            backgroundColor: '#FAF9F6', 
            borderColor: '#F97316',
            scale: 1.01,
            transition: { duration: 0.05 }
          }}
          className="bg-white p-6 rounded-3xl border border-[#EFEFE9] shadow-sm flex items-center justify-between group cursor-pointer transition-all duration-500 hover:shadow-xl hover:shadow-orange-500/5"
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A] mb-1">Maintenance</p>
            <h4 className="text-2xl font-black text-[#4D5D53]">{activeTicketCount} Active</h4>
            <p className="text-[10px] items-center flex gap-1 text-[#D4A373] font-bold mt-1">
              {recentTickets.length} total tickets
            </p>
          </div>
          <motion.div 
            whileHover={{ x: 3, y: -3, scale: 1.1 }}
            className="p-4 bg-orange-50 rounded-2xl text-orange-500 transition-transform duration-300"
          >
            <Wrench className="h-6 w-6" />
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ 
            backgroundColor: '#FAF9F6', 
            borderColor: '#10B981',
            scale: 1.01,
            transition: { duration: 0.05 }
          }}
          className="bg-white p-6 rounded-3xl border border-[#EFEFE9] shadow-sm flex items-center justify-between group cursor-pointer transition-all duration-500 hover:shadow-xl hover:shadow-emerald-500/5"
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A] mb-1">Community Poll</p>
            <h4 className="text-2xl font-black text-[#4D5D53]">Vote Now</h4>
            <p className="text-[10px] items-center flex gap-1 text-[#4D5D53] font-bold mt-1">
              Active polls in community
            </p>
          </div>
          <motion.div 
            whileHover={{ x: 3, y: -3, scale: 1.1 }}
            className="p-4 bg-emerald-50 rounded-2xl text-[#4D5D53] transition-transform duration-300"
          >
            <BarChart3 className="h-6 w-6" />
          </motion.div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activities */}
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
                transition={{ delay: 0.5 + (idx * 0.05), duration: 0.6 }}
                whileHover={{ backgroundColor: '#FAF9F6', borderColor: '#D4A373' }}
                className="bg-white rounded-3xl p-3 border border-[#EFEFE9] flex gap-4 group cursor-pointer shadow-sm transition-all duration-300"
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
                  <p className="text-sm font-black text-[#4D5D53] tracking-tighter">${item.price?.toFixed?.(2) ?? item.price}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div 
            whileHover={{ backgroundColor: 'rgba(233, 237, 201, 0.4)', borderColor: '#4D5D53' }}
            className="bg-[#E9EDC9]/30 border-2 border-dashed border-[#E9EDC9] rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 cursor-pointer group transition-all duration-300"
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
            >
              Create Listing
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Sidebar Cards */}
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          <div className="space-y-4">
            {recentTickets.length > 0 ? (
              recentTickets.map((ticket, idx) => {
                const resolved = ticket.status === 'resolved' || ticket.status === 'closed'
                return (
                  <motion.div 
                    key={ticket.ticket_id || ticket.id || idx}
                    whileHover={{ x: 6 }}
                    className="p-5 bg-white rounded-2xl border border-[#EFEFE9] flex items-center gap-4 group cursor-pointer shadow-sm transition-all duration-300"
                  >
                    <div className={`w-3.5 h-3.5 rounded-full ${resolved ? 'bg-emerald-500' : 'bg-[#D4A373]'}`} />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-black text-[#4D5D53] truncate">{ticket.category} • Room {ticket.room_number}</h5>
                      <p className="text-[10px] text-[#9A9A9A]">{ticket.created_at}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#BDBDBD] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </motion.div>
                )
              })
            ) : (
              <p className="text-xs text-[#9A9A9A] text-center py-4">No tickets yet</p>
            )}
          </div>

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
                        <p className="text-xs font-bold text-[#414D45] group-hover:text-[#D4A373] transition-colors">{ticket.category} • Room {ticket.room_number}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          {resolved ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <span className="w-1.5 h-1.5 rounded-full bg-[#D4A373] animate-pulse" />}
                          <p className={`text-[10px] font-bold ${resolved ? 'text-emerald-600' : 'text-[#9A9A9A]'}`}>{ticket.status}</p>
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
