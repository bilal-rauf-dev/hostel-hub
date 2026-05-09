'use client'

import { motion } from 'motion/react'
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

const TICKETS = [
  {
    id: '#3041',
    title: 'Plumbing: Leaking Sink',
    status: 'In Progress',
    priority: 'High',
    date: 'Oct 28',
    room: 'Room 402',
    icon: Wrench,
    color: 'text-blue-500 bg-blue-50',
    statusColor: 'bg-blue-500'
  },
  {
    id: '#2988',
    title: 'AC Repair: Filter Cleaning',
    status: 'Resolved',
    priority: 'Normal',
    date: 'Oct 25',
    room: 'Room 402',
    icon: CheckCircle2,
    color: 'text-emerald-500 bg-emerald-50',
    statusColor: 'bg-emerald-500'
  },
  {
    id: '#2855',
    title: 'Internet Latency Issues',
    status: 'Pending',
    priority: 'Low',
    date: 'Oct 20',
    room: 'Building B',
    icon: AlertCircle,
    color: 'text-orange-500 bg-orange-50',
    statusColor: 'bg-orange-500'
  }
]

export function TicketsView() {
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
        {TICKETS.map((ticket, idx) => (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ backgroundColor: '#FAF9F6', borderColor: '#D4A373' }}
            className="bg-white p-6 rounded-3xl border border-[#F0F0EE] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group cursor-pointer transition-all duration-300"
          >
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-2xl ${ticket.color} transition-all duration-500 group-hover:rotate-6`}>
                <ticket.icon className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest">{ticket.id}</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${ticket.color} border-current opacity-70`}>
                    {ticket.priority}
                  </span>
                </div>
                <h4 className="text-lg font-black text-[#4D5D53] mt-1 group-hover:text-[#D4A373] transition-colors">{ticket.title}</h4>
                <p className="text-[11px] text-[#9A9A9A] font-bold uppercase tracking-wide">{ticket.room} • {ticket.date}</p>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 pt-4 md:pt-0">
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end mb-1">
                  <span className={`w-2 h-2 rounded-full ${ticket.statusColor} ${ticket.status === 'In Progress' ? 'animate-pulse' : ''}`} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#4D5D53]">{ticket.status}</p>
                </div>
                <p className="text-[10px] text-[#9A9A9A] font-bold">Last update 2h ago</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] border border-[#F0F0EE] flex items-center justify-center transition-all group-hover:bg-[#4D5D53] group-hover:text-white group-hover:scale-110">
                <ChevronRight className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
        ))}
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
