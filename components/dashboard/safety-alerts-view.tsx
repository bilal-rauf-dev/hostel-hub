'use client'

import { motion } from 'motion/react'
import { 
  AlertTriangle, 
  Send, 
  History, 
  ShieldAlert, 
  BellRing,
  Globe,
  Smartphone,
  CheckCircle2,
  Trash2
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { safetyAlertsApi } from '@/lib/api'

// Loaded from notifications API

export function SafetyAlertsView() {
   const [selectedMethod, setSelectedMethod] = useState('All')
   const [alerts, setAlerts] = useState<any[]>([])
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState<string|null>(null)
   const [message, setMessage] = useState('')
   const [sending, setSending] = useState(false)
   const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)

   const pushToast = (message: string, type: 'success' | 'error') => {
      setToast({ message, type })
      setTimeout(() => setToast(null), 3000)
   }

   useEffect(()=>{
      let mounted = true
      const load = async ()=>{
         try{
            setLoading(true)
            const res = await safetyAlertsApi.getAlerts()
            if (!mounted) return
            if (res.data?.success) setAlerts(res.data.data || [])
            else setError(res.data?.message || 'Failed to load alerts')
         }catch(e:any){ setError(e?.message || 'Network error') }
         finally{ if (mounted) setLoading(false) }
      }
      load()
      return ()=>{ mounted = false }
   },[])

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-3xl font-black text-[#4D5D53] tracking-tighter text-red-500">Safety & Broadcast</h3>
          <p className="text-sm text-[#9A9A9A] font-medium mt-1">Issue hostel-wide alerts or emergency notifications.</p>
        </div>
      </div>

         {toast && (
            <div className={`p-3 rounded-lg text-sm ${toast.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
               {toast.message}
            </div>
         )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Left Column: Composer */}
        <div className="space-y-8">
           <div className="bg-white p-10 rounded-[3rem] border border-[#F0F0EE] shadow-sm space-y-8">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A] mb-4">Compose Alert</h4>
                <div className="p-1 bg-[#FAF9F6] rounded-[2rem] flex gap-1">
                     {['All', 'Block A', 'Block B', 'Staff Only'].map(m => (
                     <button 
                       key={m}
                       onClick={() => setSelectedMethod(m)}
                       className={`flex-1 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${selectedMethod === m ? 'bg-white text-[#4D5D53] shadow-sm' : 'text-[#BDBDBD] hover:text-[#79837C]'}`}
                     >
                       {m}
                     </button>
                   ))}
                </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] font-black text-[#9A9A9A] uppercase tracking-widest">Message Content</p>
                    <span className="text-[10px] font-bold text-orange-500">145 characters left</span>
                 </div>
                 <textarea 
                    value={message}
                    onChange={e=>setMessage(e.target.value)}
                    placeholder="Enter critical message here..."
                    className="w-full h-40 bg-[#FAF9F6] border border-[#F0F0EE] rounded-[2rem] p-8 text-sm focus:border-red-400 outline-none transition-all placeholder:text-[#BDBDBD] resize-none"
                 />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-[#FAF9F6] p-6 rounded-[2rem] border border-[#F0F0EE] flex items-center gap-4 cursor-pointer hover:border-red-400 transition-all group">
                    <div className="p-3 bg-white rounded-xl text-red-500 shadow-sm group-hover:scale-110 transition-transform">
                       <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                       <p className="text-xs font-black text-[#4D5D53]">Push Alert</p>
                       <p className="text-[10px] font-bold text-[#9A9A9A]">Send to Mobile App</p>
                    </div>
                 </div>
                 <div className="bg-[#FAF9F6] p-6 rounded-[2rem] border border-[#F0F0EE] flex items-center gap-4 cursor-pointer hover:border-blue-400 transition-all group">
                    <div className="p-3 bg-white rounded-xl text-blue-500 shadow-sm group-hover:scale-110 transition-transform">
                       <Globe className="h-5 w-5" />
                    </div>
                    <div>
                       <p className="text-xs font-black text-[#4D5D53]">Banner</p>
                       <p className="text-[10px] font-bold text-[#9A9A9A]">Host on Hub Header</p>
                    </div>
                 </div>
              </div>

                     <button onClick={async ()=>{
                        try{
                           setSending(true)
                           await safetyAlertsApi.createAlert({
                             title: selectedMethod === 'All' ? 'Hostel Alert' : `${selectedMethod} Alert`,
                             body: message,
                             severity: 'critical',
                           })
                           setMessage('')
                           const r = await safetyAlertsApi.getAlerts()
                           if (r.data?.success) setAlerts(r.data.data || [])
                           pushToast('Alert broadcasted', 'success')
                        }catch(e){ console.error(e); pushToast('Failed to broadcast', 'error') }
                        finally{ setSending(false) }
                     }} className="w-full py-5 bg-red-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-600 transition-all shadow-xl shadow-red-500/20">
                         <Send className="h-4 w-4" />
                         {sending? 'Sending...':'Broadcast Emergency Alert'}
                     </button>
           </div>
        </div>

        {/* Right Column: History */}
        <div className="space-y-8">
           <div className="bg-white p-10 rounded-[3rem] border border-[#F0F0EE] shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A]">Alert History</h4>
                 <History className="h-4 w-4 text-[#BDBDBD]" />
              </div>
              
                     <div className="space-y-4">
                        {(alerts || []).map((item, idx) => (
                           <motion.div
                           key={item.id || idx}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="p-6 bg-[#FAF9F6] rounded-[2rem] border border-transparent hover:border-[#F0F0EE] transition-all group"
                           >
                              <div className="flex items-center justify-between mb-3">
                                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                     item.level === 'critical' || item.type === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                                  }`}>
                                     {item.level || item.type}
                                  </span>
                                  <span className="text-[10px] font-bold text-[#BDBDBD]">{item.time || item.created_at}</span>
                              </div>
                              <p className="text-sm font-bold text-[#4D5D53] leading-relaxed mb-4">{item.message || item.body || item.msg}</p>
                              <div className="flex items-center justify-between pt-4 border-t border-black/5">
                                  <div className="flex items-center gap-2">
                                       <BellRing className="h-3 w-3 text-[#BDBDBD]" />
                                       <span className="text-[10px] font-black text-[#BDBDBD] uppercase tracking-widest">{item.target || item.method || 'All'}</span>
                                  </div>
                                   <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <button onClick={async ()=>{
                                         try{
                                           await safetyAlertsApi.toggleAlert(item.alert_id || item.id)
                                           const r = await safetyAlertsApi.getAlerts()
                                           if (r.data?.success) setAlerts(r.data.data || [])
                                           pushToast('Alert updated', 'success')
                                         }catch(e:any){ console.error(e); pushToast('Failed to update alert', 'error') }
                                       }} className="text-[10px] font-black text-red-400 flex items-center gap-1">
                                          <Trash2 className="h-3 w-3" />
                                          Void
                                       </button>
                                   </div>
                              </div>
                           </motion.div>
                        ))}
                     </div>
           </div>

           <div className="bg-red-50 p-10 rounded-[3rem] border border-red-100 relative overflow-hidden group">
              <div className="relative z-10 space-y-4">
                 <div className="p-3 bg-white rounded-2xl w-fit text-red-500 shadow-sm">
                    <ShieldAlert className="h-6 w-6" />
                 </div>
                 <h4 className="text-xl font-black text-red-900 tracking-tight">Panic Response Protocol</h4>
                 <p className="text-sm text-red-800/70 leading-relaxed">
                   When triggered by a resident, the system will instantly ping the nearest warden and security post with GPS coordinates.
                 </p>
                 <button className="px-6 py-2 bg-white text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm">
                   Audit Response Records
                 </button>
              </div>
              <AlertTriangle className="absolute bottom-[-20%] right-[-10%] h-48 w-48 text-red-500/10 group-hover:rotate-12 transition-transform" />
           </div>
        </div>
      </div>
    </motion.div>
  )
}
