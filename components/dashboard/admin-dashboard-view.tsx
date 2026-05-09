'use client'

import { motion } from 'motion/react'
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
  Mail
} from 'lucide-react'

const STATS = [
  { label: 'Active Tickets', value: '12', trend: '+2 this week', icon: Wrench, color: 'text-blue-500 bg-blue-50' },
  { label: 'Pending Users', value: '45', trend: 'Audit required', icon: Users, color: 'text-orange-500 bg-orange-50' },
  { label: 'Marketplace Items', value: '128', trend: 'Moderate 5', icon: ShoppingBag, color: 'text-emerald-500 bg-emerald-50' },
  { label: 'Active Polls', value: '3', trend: 'Ending soon', icon: BarChart3, color: 'text-purple-500 bg-purple-50' },
]

export function AdminDashboardView() {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-[#4D5D53] tracking-tight">Staff Administration</h3>
          <p className="text-sm text-[#9A9A9A] font-medium mt-1">Global oversight of hostel operations and requests.</p>
        </div>
        <div className="flex gap-2">
           <button className="px-6 py-2.5 bg-white border border-[#F0F0EE] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#4D5D53] hover:bg-[#FAF9F6] transition-all shadow-sm">
             Export Audit Logs
           </button>
           <button className="px-6 py-2.5 bg-[#4D5D53] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#3D4D43] transition-all shadow-lg">
             New Announcement
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: -20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ backgroundColor: '#FAF9F6', borderColor: '#D4A373' }}
            className="bg-white p-6 rounded-[2.5rem] border border-[#F0F0EE] shadow-sm group transition-all duration-300 cursor-pointer"
          >
            <div className={`p-4 rounded-2xl ${stat.color} w-fit mb-6 transition-all duration-500 group-hover:rotate-6 group-hover:scale-110`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9A9A9A] group-hover:text-[#4D5D53] transition-colors">{stat.label}</p>
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
               <button className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest hover:underline underline-offset-8">Manage All Ops</button>
            </div>
            <div className="space-y-4">
              {[
                { id: 'T-882', user: 'Room 402', issue: 'AC Leakage', priority: 'High', status: 'Pending', time: '12m ago' },
                { id: 'T-881', user: 'Block B Commons', issue: 'Broken Wi-Fi Router', priority: 'Medium', status: 'In Progress', time: '1h ago' },
                { id: 'T-880', user: 'Room 211', issue: 'Flickering Lights', priority: 'Low', status: 'Pending', time: '4h ago' }
              ].map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-5 bg-[#FAF9F6] rounded-[2rem] group cursor-pointer hover:bg-white border border-transparent hover:border-[#F0F0EE] transition-all duration-300">
                  <div className="flex items-center gap-5">
                     <div className={`w-3 h-3 rounded-full ${ticket.priority === 'High' ? 'bg-red-500 animate-pulse' : ticket.priority === 'Medium' ? 'bg-orange-500' : 'bg-[#D4A373]'}`} />
                     <div>
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest">{ticket.id}</span>
                           <h5 className="text-sm font-black text-[#4D5D53] group-hover:text-[#D4A373] transition-colors">{ticket.issue}</h5>
                        </div>
                        <p className="text-[10px] text-[#9A9A9A] font-bold uppercase tracking-wide">{ticket.user} • {ticket.time}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                     <button className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4" />
                     </button>
                     <button className="w-10 h-10 rounded-xl bg-white border border-[#F0F0EE] text-[#79837C] hover:text-[#4D5D53] transition-all flex items-center justify-center">
                        <MoreVertical className="h-4 w-4" />
                     </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#4D5D53] p-12 rounded-[3rem] text-white relative overflow-hidden shadow-xl shadow-[#4D5D53]/20">
             <div className="relative z-10 space-y-4">
                <div className="p-3 bg-white/10 rounded-2xl w-fit">
                   <ShieldCheck className="h-6 w-6 text-[#E9EDC9]" />
                </div>
                <h4 className="text-2xl font-black tracking-tight">Security Protocol Update</h4>
                <p className="text-sm opacity-80 leading-relaxed max-w-sm">
                  Remember to verify all guest entries at the main gate terminal. New scanning firmware available in the IT portal.
                </p>
                <button className="px-6 py-2 bg-[#E9EDC9] text-[#4D5D53] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-colors">
                  Update Gate Terminal
                </button>
             </div>
             <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
          </div>
        </div>

        {/* User Verification / Activity */}
        <div className="space-y-8">
           <div className="bg-white p-10 rounded-[3rem] border border-[#F0F0EE] shadow-sm">
              <h4 className="font-black text-[#4D5D53] uppercase tracking-widest text-xs mb-8">Staff Chat</h4>
              <div className="space-y-6">
                {[
                  { name: 'Admin Sarah', msg: 'Yoga session needs more chairs in Hall B', time: '10:15 AM' },
                  { name: 'Warden Ken', msg: 'Gate scan logs have been uploaded.', time: '09:45 AM' }
                ].map((chat) => (
                  <div key={chat.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest">{chat.name}</span>
                       <span className="text-[8px] text-[#BDBDBD] font-bold">{chat.time}</span>
                    </div>
                    <p className="text-[10px] text-[#4D5D53] leading-relaxed p-3 bg-[#FAF9F6] rounded-2xl rounded-tl-none">{chat.msg}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-[#F0F0EE] flex gap-2">
                 <input type="text" placeholder="Type message..." className="flex-1 bg-[#FAF9F6] border-none rounded-xl p-3 text-[10px] outline-none focus:ring-1 focus:ring-[#D4A373]/20" />
                 <button className="p-3 bg-[#4D5D53] text-white rounded-xl">
                   <Mail className="h-3 w-3" />
                 </button>
              </div>
           </div>

           <div className="bg-[#FEFAE0]/30 border border-[#E9EDC9] rounded-[3rem] p-8">
              <h4 className="font-black text-[#4D5D53] uppercase tracking-widest text-xs mb-6">Critical Alerts</h4>
              <div className="space-y-4">
                 {[
                   'Main Gate Scanner offline',
                   'Block C Water Supply low',
                   '5 Unauthorized listing flags'
                 ].map((alert) => (
                   <div key={alert} className="flex items-center gap-3 text-[10px] font-bold text-[#79837C]">
                      <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
                      {alert}
                   </div>
                 ))}
              </div>
              <button className="w-full mt-8 py-3 border border-[#E9EDC9] rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#4D5D53] hover:bg-white transition-all">
                 System Health
              </button>
           </div>
        </div>
      </div>
    </motion.div>
  )
}
