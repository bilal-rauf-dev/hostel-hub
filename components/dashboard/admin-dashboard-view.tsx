'use client'

import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect, useCallback } from 'react'
import { maintenanceApi, usersApi, marketplaceApi, pollsApi } from '@/lib/api'
import { 
  Users, 
  Wrench, 
  ShoppingBag, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  MoreVertical,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Mail,
  RefreshCw
} from 'lucide-react'

interface AdminDashboardViewProps {
  onNavigate: (tab: string) => void
}

export function AdminDashboardView({ onNavigate }: AdminDashboardViewProps) {
  const [stats, setStats] = useState<any[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null)
  const [ticketStatus, setTicketStatus] = useState('submitted')
  const [savingTicket, setSavingTicket] = useState(false)

  const handleUpdateTicket = async () => {
  if (!selectedTicket) return
  if (ticketStatus === selectedTicket.status) {
    setSelectedTicket(null)
    return
  }
  try {
    setSavingTicket(true)
    const res = await maintenanceApi.updateTicketStatus(selectedTicket.ticket_id, ticketStatus)
    if (res.data?.success) {
      setTickets(prev => prev.map(t => 
        t.ticket_id === selectedTicket.ticket_id ? { ...t, status: ticketStatus } : t
      ))
      setSelectedTicket(null)
    } else {
      console.error('Update failed:', res.data?.message)
      alert(res.data?.message || 'Failed to update ticket status')
    }
  } catch (e: any) {
    console.error(e)
    alert(e?.response?.data?.message || 'An error occurred')
  } finally {
    setSavingTicket(false)
  }
}

  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try{
      const [tRes, uRes, mRes, pRes] = await Promise.allSettled([
        maintenanceApi.getAllTickets(),
        usersApi.getAllUsers(),
        marketplaceApi.getListings(),
        pollsApi.getPolls()
      ])
      const tickets = tRes.status === 'fulfilled' && tRes.value.data?.success ? (tRes.value.data.data || []) : []
      const users = uRes.status === 'fulfilled' && uRes.value.data?.success ? (uRes.value.data.data || []) : []
      const listings = mRes.status === 'fulfilled' && mRes.value.data?.success ? (mRes.value.data.data || []) : []
      const polls = pRes.status === 'fulfilled' && pRes.value.data?.success ? (pRes.value.data.data || []) : []

      setStats([
        { label: 'Active Tickets', value: String((tickets || []).length), trend: '', icon: Wrench, color: 'text-blue-500 bg-blue-50', tab: 'Staff Tickets' },
        { label: 'Pending Users', value: String((users || []).filter((u:any)=>u.verification_status==='pending').length), trend: '', icon: Users, color: 'text-orange-500 bg-orange-50', tab: 'Verification' },
        { label: 'Marketplace Items', value: String((listings || []).length), trend: '', icon: ShoppingBag, color: 'text-emerald-500 bg-emerald-50', tab: 'Marketplace' },
        { label: 'Active Polls', value: String((polls || []).length), trend: '', icon: BarChart3, color: 'text-purple-500 bg-purple-50', tab: 'Controls' },
      ])
      setTickets(tickets.slice(0, 3))
    }catch(e){ console.error(e) }
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  useEffect(() => {
    load()
  }, [load])
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-black text-[#4D5D53] tracking-tight">Staff Administration</h3>
            <motion.button
              onClick={handleRefresh}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={refreshing}
              className="p-2.5 bg-white border border-[#F0F0EE] rounded-xl text-[#79837C] hover:bg-[#FAF9F6] transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
          <p className="text-sm text-[#9A9A9A] font-medium mt-1">Global oversight of hostel operations and requests.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: -20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ backgroundColor: '#FAF9F6', borderColor: '#D4A373' }}
            className="bg-white p-6 rounded-[2.5rem] border border-[#F0F0EE] shadow-sm group transition-all duration-300 cursor-pointer"
            onClick={() => onNavigate(stat.tab)}
          >
            <div className={`p-4 rounded-2xl ${stat.color} w-fit mb-6 transition-all duration-500 group-hover:rotate-6 group-hover:scale-110`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0  .2em] text-[#9A9A9A] group-hover:text-[#4D5D53] transition-colors">{stat.label}</p>
            <div className="flex items-end justify-between mt-2">
              <h4 className="text-4xl font-black text-[#4D5D53] tracking-tighter tabular-nums group-hover:text-[#D4A373] transition-colors">{stat.value}</h4>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#D4A373] opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">{stat.trend}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Critical Tickets */}
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white p-10 rounded-[3rem] border border-[#F0F0EE] shadow-sm">
            <div className="flex items-center justify-between mb-10">
               <h4 className="font-black text-[#4D5D53] uppercase tracking-[0.25em] text-[10px]">Priority Maintenance</h4>
            </div>
            <div className="space-y-4">
              {tickets.length === 0 ? (
                <div className="text-sm text-[#9A9A9A] p-4">No active tickets.</div>
              ) : (
                tickets.map((ticket) => (
                  <div 
                    key={ticket.ticket_id} 
                    className="flex items-center justify-between p-5 bg-[#FAF9F6] rounded-[2rem] group cursor-pointer hover:bg-white border border-transparent hover:border-[#F0F0EE] transition-all duration-300"
                    onClick={() => {
                      const nextStatus: Record<string, string> = {
                        submitted: 'assigned',
                        assigned: 'in_progress',
                        in_progress: 'resolved',
                        resolved: 'closed',
                        closed: 'closed',
                      }
                      setSelectedTicket(ticket)
                      setTicketStatus(nextStatus[ticket.status] || ticket.status)
                    }}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-3 h-3 rounded-full ${
                        ticket.status === 'submitted' ? 'bg-orange-500 animate-pulse'
                        : ticket.status === 'in_progress' ? 'bg-blue-500'
                        : 'bg-emerald-500'
                      }`} />
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest">#{ticket.ticket_id}</span>
                          <h5 className="text-sm font-black text-[#4D5D53] group-hover:text-[#D4A373] transition-colors">{ticket.category}</h5>
                        </div>
                        <p className="text-[10px] text-[#9A9A9A] font-bold uppercase tracking-wide">
                          Room {ticket.room_number} • {ticket.status}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* User Verification / Activity */}
        <div className="space-y-8">
           <div className="bg-white p-10 rounded-[3rem] border border-[#F0F0EE] shadow-sm">
             <h4 className="font-black text-[#4D5D53] uppercase tracking-widest text-xs mb-4">Staff Chat</h4>
             <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
               <Mail className="h-8 w-8 text-[#BDBDBD]" />
               <p className="text-sm font-black text-[#4D5D53]">Coming Soon</p>
               <p className="text-[10px] text-[#9A9A9A] font-bold">Internal staff messaging is under development.</p>
             </div>
           </div>

           <div className="bg-[#FEFAE0]/30 border border-[#E9EDC9] rounded-[3rem] p-8">
             <h4 className="font-black text-[#4D5D53] uppercase tracking-widest text-xs mb-6">Critical Alerts</h4>
             <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
               <CheckCircle2 className="h-6 w-6 text-emerald-500" />
               <p className="text-[10px] font-black text-[#4D5D53] uppercase tracking-widest">All Systems Normal</p>
               <p className="text-[10px] text-[#9A9A9A]">No critical alerts at this time.</p>
             </div>
           </div>
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && createPortal(
        <AnimatePresence>
          <motion.div
            key="ticket-modal-overlay"
            className="fixed inset-0 z-[9999] flex items-center justify-center"
          >
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#4D5D53]/40 backdrop-blur-md"
              onClick={() => setSelectedTicket(null)}
            />
            <motion.div
              key="modal-content"
              initial={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(10px)' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-white rounded-[3rem] border border-[#F0F0EE] p-8 w-full max-w-md mx-4 shadow-2xl z-10"
            >
              <button
                onClick={() => setSelectedTicket(null)}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-[#FAF9F6] text-[#9A9A9A] hover:bg-[#F0F0EE] hover:text-[#4D5D53] transition-colors"
              >
                ✕
              </button>
              
              <div className="mb-8 pr-12">
                <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest">#{selectedTicket.ticket_id}</span>
                <h3 className="text-2xl font-black text-[#4D5D53] tracking-tight mt-1 leading-tight">{selectedTicket.category}</h3>
                <p className="text-sm text-[#9A9A9A] font-medium mt-2">Room {selectedTicket.room_number}</p>
                {selectedTicket.created_at && (
                  <p className="text-[10px] text-[#BDBDBD] font-bold mt-1 uppercase tracking-widest">{new Date(selectedTicket.created_at).toLocaleString()}</p>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-[#9A9A9A] uppercase tracking-widest mb-2 block">Description</label>
                  <p className="text-sm text-[#4D5D53] bg-[#FAF9F6] p-4 rounded-2xl">{selectedTicket.description || 'No description provided.'}</p>
                </div>

                <div>
                  <label className="text-[10px] font-black text-[#9A9A9A] uppercase tracking-widest mb-2 block">Status Update</label>
                  <select
                    value={ticketStatus}
                    onChange={(e) => setTicketStatus(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#F0F0EE] rounded-xl p-3 text-sm font-bold text-[#4D5D53] outline-none focus:ring-2 focus:ring-[#D4A373]/20"
                  >
                    {(['submitted', 'assigned', 'in_progress', 'resolved', 'closed'] as const).map((s) => {
                      const nextMap: Record<string, string> = {
                        submitted: 'assigned',
                        assigned: 'in_progress',
                        in_progress: 'resolved',
                        resolved: 'closed',
                        closed: 'closed',
                      }
                      const validNext = nextMap[selectedTicket?.status ?? '']
                      const isCurrent = s === selectedTicket?.status
                      const isNext = s === validNext && !isCurrent
                      const isDisabled = !isCurrent && !isNext
                      return (
                        <option key={s} value={s} disabled={isDisabled} className={isDisabled ? 'text-[#BDBDBD]' : ''}>
                          {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                          {isCurrent ? ' (current)' : ''}
                          {isDisabled ? ' (unavailable)' : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>
              </div>

              <div className="mt-10 flex justify-end">
                <button 
                  onClick={handleUpdateTicket}
                  disabled={savingTicket}
                  className="px-6 py-3 bg-[#4D5D53] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#3D4D43] transition-all shadow-lg shadow-[#4D5D53]/20 disabled:opacity-50"
                >
                  {savingTicket ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  )
}
