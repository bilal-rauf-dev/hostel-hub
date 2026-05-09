'use client'

import { motion } from 'motion/react'
import { 
  Wrench, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowUpRight,
  MessageSquare
} from 'lucide-react'
import { useState } from 'react'

const TICKETS = [
  { id: 'T-882', user: 'Alex Rivers', room: 'B-402', issue: 'AC Leakage', priority: 'High', status: 'Pending', category: 'Maintenance', time: '12m ago' },
  { id: 'T-881', user: 'Community Hall', room: 'Ground', issue: 'Wi-Fi Router Reset', priority: 'Medium', status: 'In Progress', category: 'IT', time: '1h ago' },
  { id: 'T-880', user: 'Sarah Jen', room: 'A-102', issue: 'Flickering Lights', priority: 'Low', status: 'Pending', category: 'Electrical', time: '4h ago' },
  { id: 'T-879', user: 'Mike Ross', room: 'C-211', issue: 'Tap Leak', priority: 'Medium', status: 'Resolved', category: 'Plumbing', time: '1d ago' },
  { id: 'T-878', user: 'Laundry Area', room: 'Block B', issue: 'Machine #4 Error', priority: 'High', status: 'In Progress', category: 'Facilities', time: '2d ago' },
]

export function StaffTicketsView() {
  const [filter, setFilter] = useState('All')

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-3xl font-black text-[#4D5D53] tracking-tighter">Support Tickets</h3>
          <p className="text-sm text-[#9A9A9A] font-medium mt-1">Manage and resolve resident maintenance requests.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#BDBDBD]" />
            <input 
              type="text" 
              placeholder="Search tickets..." 
              className="pl-10 pr-4 py-2.5 bg-white border border-[#F0F0EE] rounded-xl text-xs focus:border-[#D4A373] outline-none w-64 shadow-sm"
            />
          </div>
          <button className="p-2.5 bg-white border border-[#F0F0EE] rounded-xl text-[#79837C] hover:bg-[#FAF9F6] transition-all">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[#F0F0EE] pb-2">
        {['All', 'Pending', 'In Progress', 'Resolved'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-xs font-black uppercase tracking-widest transition-all relative ${filter === tab ? 'text-[#4D5D53]' : 'text-[#BDBDBD] hover:text-[#79837C]'}`}
          >
            {tab}
            {filter === tab && (
              <motion.div layoutId="staff-ticket-tab" className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-[#D4A373]" />
            )}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 gap-4">
        {TICKETS.filter(t => filter === 'All' || t.status === filter).map((ticket, idx) => (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group bg-white p-6 rounded-[2rem] border border-[#F0F0EE] shadow-sm hover:shadow-xl hover:shadow-[#4D5D53]/5 transition-all flex flex-col md:flex-row md:items-center gap-6"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              ticket.priority === 'High' ? 'bg-red-50 text-red-500' : 
              ticket.priority === 'Medium' ? 'bg-orange-50 text-orange-500' : 
              'bg-blue-50 text-blue-500'
            }`}>
              <Wrench className="h-6 w-6" />
            </div>

            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2 mb-1">
                 <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest">{ticket.id}</span>
                 <span className="text-[10px] font-black text-[#BDBDBD] uppercase tracking-widest">• {ticket.category}</span>
               </div>
               <h4 className="text-lg font-black text-[#4D5D53] truncate">{ticket.issue}</h4>
               <p className="text-xs text-[#9A9A9A] font-bold mt-1">Requested by {ticket.user} in {ticket.room}</p>
            </div>

            <div className="flex items-center gap-8 md:px-8 border-l border-r border-[#F0F0EE]/50 h-12">
               <div>
                 <p className="text-[8px] font-black text-[#BDBDBD] uppercase tracking-widest mb-1">Priority</p>
                 <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${
                   ticket.priority === 'High' ? 'bg-red-100 text-red-600' : 
                   ticket.priority === 'Medium' ? 'bg-orange-100 text-orange-600' : 
                   'bg-blue-100 text-blue-600'
                 }`}>
                   {ticket.priority}
                 </span>
               </div>
               <div>
                 <p className="text-[8px] font-black text-[#BDBDBD] uppercase tracking-widest mb-1">Created</p>
                 <span className="text-xs font-black text-[#4D5D53]">{ticket.time}</span>
               </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-4 min-w-[200px]">
               <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                 ticket.status === 'Pending' ? 'bg-orange-50 border-orange-100 text-orange-600' : 
                 ticket.status === 'In Progress' ? 'bg-blue-50 border-blue-100 text-blue-600' : 
                 'bg-emerald-50 border-emerald-100 text-emerald-600'
               }`}>
                 {ticket.status === 'Pending' ? <Clock className="h-3 w-3" /> : 
                  ticket.status === 'In Progress' ? <ArrowUpRight className="h-3 w-3" /> : 
                  <CheckCircle2 className="h-3 w-3" />}
                 <span className="text-[10px] font-black uppercase tracking-widest">{ticket.status}</span>
               </div>

               <div className="flex items-center gap-1">
                 <button className="p-3 text-[#BDBDBD] hover:text-[#D4A373] hover:bg-[#FEFAE0] rounded-xl transition-all">
                    <MessageSquare className="h-4 w-4" />
                 </button>
                 <button className="p-3 text-[#BDBDBD] hover:text-[#4D5D53] hover:bg-[#FAF9F6] rounded-xl transition-all">
                    <MoreVertical className="h-4 w-4" />
                 </button>
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
