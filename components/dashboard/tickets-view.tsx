'use client'

import { motion } from 'motion/react'
import { useState, useEffect } from 'react'
import { maintenanceApi } from '@/lib/api'
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MessageSquare,
  ChevronRight
} from 'lucide-react'

// tickets will be loaded from API

export function TicketsView() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const res = await maintenanceApi.getTickets()
        if (!mounted) return
        if (res.data?.success) setTickets(res.data.data || [])
        else setError(res.data?.message || 'Failed to load tickets')
      } catch (err: any) {
        setError(err?.message || 'Network error')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const activeCount = tickets.filter(t => t.status && t.status !== 'Resolved').length
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length
  const waitingCount = tickets.filter(t => t.status === 'Pending' || t.status === 'Waiting').length

  const handleCreateDone = async (success: boolean) => {
    setCreating(false)
    if (success) {
      const res = await maintenanceApi.getTickets()
      if (res.data?.success) setTickets(res.data.data || [])
    }
  }

  function CreateTicketForm({ onDone }: { onDone: (success: boolean) => void }) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('General')
    const [priority, setPriority] = useState('Normal')
    const [room, setRoom] = useState('')
    const [saving, setSaving] = useState(false)
    const [err, setErr] = useState<string | null>(null)

    const submit = async (e?: any) => {
      if (e && e.preventDefault) e.preventDefault()
      try {
        setSaving(true)
        const res = await maintenanceApi.createTicket(title, description, category, priority, room)
        if (res.data?.success) onDone(true)
        else { setErr(res.data?.message || 'Failed'); onDone(false) }
      } catch (e: any) {
        setErr(e?.message || 'Network error')
        onDone(false)
      } finally { setSaving(false) }
    }

    return (
      <form onSubmit={submit} className="space-y-3">
        <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Title" className="w-full p-3 rounded-lg border" />
        <textarea value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Description" className="w-full p-3 rounded-lg border" />
        <div className="grid grid-cols-3 gap-2">
          <input value={category} onChange={(e)=>setCategory(e.target.value)} placeholder="Category" className="p-2 rounded-lg border" />
          <select value={priority} onChange={(e)=>setPriority(e.target.value)} className="p-2 rounded-lg border">
            <option>Low</option><option>Normal</option><option>High</option>
          </select>
          <input value={room} onChange={(e)=>setRoom(e.target.value)} placeholder="Room #" className="p-2 rounded-lg border" />
        </div>
        {err && <div className="text-red-500">{err}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => onDone(false)} className="px-4 py-2 rounded-xl border">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-[#4D5D53] text-white rounded-xl">{saving ? 'Submitting...' : 'Submit'}</button>
        </div>
      </form>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h3 className="text-2xl font-black text-[#4D5D53] tracking-tight">Support Tickets</h3>
        <motion.button 
          whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-4 bg-[#4D5D53] text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-[#4D5D53]/20 transition-all border-b-4 border-black/20"
        >
          <Plus className="h-4 w-4" />
          New Request
        </motion.button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-6">Loading tickets...</div>
        ) : error ? (
          <div className="p-6 text-red-500">Error: {error}</div>
        ) : (
          tickets.map((ticket, idx) => (
            <motion.div
              key={ticket.ticket_id || idx}
              initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ backgroundColor: '#FAF9F6', borderColor: '#D4A373' }}
              className="bg-white p-6 rounded-3xl border border-[#F0F0EE] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group cursor-pointer transition-all duration-300"
            >
              <div className="flex items-center gap-5">
                <div className={`p-4 rounded-2xl text-white ${ticket.priority === 'High' ? 'bg-blue-500' : ticket.priority === 'Low' ? 'bg-orange-500' : 'bg-emerald-500'} transition-all duration-500 group-hover:rotate-6`}>
                  <Wrench className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest">{ticket.ticket_number || ticket.ticket_id}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${ticket.priority === 'High' ? 'border-blue-500' : ticket.priority === 'Low' ? 'border-orange-500' : 'border-emerald-500'} border-current opacity-70`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-[#4D5D53] mt-1 group-hover:text-[#D4A373] transition-colors">{ticket.title}</h4>
                  <p className="text-[11px] text-[#9A9A9A] font-bold uppercase tracking-wide">{ticket.room || ticket.room_number} • {ticket.created_at || ticket.date}</p>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 pt-4 md:pt-0">
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    <span className={`w-2 h-2 rounded-full ${ticket.status === 'In Progress' ? 'bg-blue-500 animate-pulse' : ticket.status === 'Resolved' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#4D5D53]">{ticket.status}</p>
                  </div>
                  <p className="text-[10px] text-[#9A9A9A] font-bold">Last update {ticket.updated_at || 'N/A'}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] border border-[#F0F0EE] flex items-center justify-center transition-all group-hover:bg-[#4D5D53] group-hover:text-white group-hover:scale-110">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
        {[
          { label: 'Active', value: '02', icon: Clock, color: 'text-blue-500' },
          { label: 'Resolved', value: '48', icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Waiting', value: '01', icon: MessageSquare, color: 'text-orange-500' }
        ].map((stat, i) => (
          <div key={i} className="bg-[#FAF9F6] p-6 rounded-3xl border border-[#F0F0EE] flex flex-col items-center text-center">
            <stat.icon className={`h-6 w-6 ${stat.color} mb-3`} />
            <h5 className="text-2xl font-black text-[#4D5D53]">{stat.value}</h5>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
