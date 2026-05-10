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
  Trash2,
  PowerOff,
  Power,
  RefreshCw
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { safetyAlertsApi } from '@/lib/api'

export function SafetyAlertsView() {
   const [selectedMethod, setSelectedMethod] = useState('All')
   const [severity, setSeverity] = useState('critical')
   const [alerts, setAlerts] = useState<any[]>([])
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState<string|null>(null)
   const [message, setMessage] = useState('')
   const [sending, setSending] = useState(false)
   const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
   const [refreshing, setRefreshing] = useState(false)

   const pushToast = (message: string, type: 'success' | 'error') => {
      setToast({ message, type })
      setTimeout(() => setToast(null), 3000)
   }

   const loadAlerts = useCallback(async () => {
      try {
         setLoading(true)
         const res = await safetyAlertsApi.getAlerts()
         if (res.data?.success) setAlerts(res.data.data || [])
         else setError(res.data?.message || 'Failed to load alerts')
      } catch(e:any) { 
         setError(e?.message || 'Network error') 
      } finally { 
         setLoading(false) 
      }
   }, [])

   const handleRefresh = async () => {
      setRefreshing(true)
      await loadAlerts()
      setRefreshing(false)
   }

   useEffect(() => {
      loadAlerts()
   }, [loadAlerts])

   const handleBroadcast = async () => {
      if (!message.trim()) {
         pushToast('Message cannot be empty', 'error')
         return
      }

      try {
         setSending(true)
         await safetyAlertsApi.createAlert({
            title: selectedMethod === 'All' ? 'Hostel Alert' : `${selectedMethod} Alert`,
            body: message,
            severity: severity,
         })
         setMessage('')
         await loadAlerts()
         pushToast('Alert broadcasted', 'success')
      } catch(e) { 
         console.error(e)
         pushToast('Failed to broadcast', 'error') 
      } finally { 
         setSending(false) 
      }
   }

   const handleToggle = async (id: number) => {
      try {
         await safetyAlertsApi.toggleAlert(id)
         await loadAlerts()
         pushToast('Alert updated', 'success')
      } catch(e:any) { 
         console.error(e)
         pushToast('Failed to update alert', 'error') 
      }
   }

   const handleDelete = async (id: number) => {
      if (!window.confirm('Are you sure you want to delete this alert permanently?')) return
      
      try {
         await safetyAlertsApi.deleteAlert(id)
         await loadAlerts()
         pushToast('Alert deleted', 'success')
      } catch(e:any) { 
         console.error(e)
         pushToast('Failed to delete alert', 'error') 
      }
   }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-3xl font-black text-[#4D5D53] tracking-tighter text-red-500">Safety & Broadcast</h3>
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
          <p className="text-sm text-[#9A9A9A] font-medium mt-1">Issue hostel-wide alerts or emergency notifications.</p>
        </div>
      </div>

      {toast && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-lg text-sm font-bold shadow-sm ${toast.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}
        >
           {toast.message}
        </motion.div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Left Column: Composer */}
        <div className="space-y-8">
           <div className="bg-white p-10 rounded-[3rem] border border-[#F0F0EE] shadow-sm space-y-8">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A] mb-4">Compose Alert</h4>
                <div className="p-1 bg-[#FAF9F6] rounded-[2rem] flex flex-wrap gap-1 mb-4">
                     {['All', 'Block A', 'Block B', 'Staff Only'].map(m => (
                     <motion.button 
                       whileHover={{ scale: 1.02 }}
                       whileTap={{ scale: 0.98 }}
                       key={m}
                       onClick={() => setSelectedMethod(m)}
                       className={`flex-1 min-w-[80px] py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${selectedMethod === m ? 'bg-white text-[#4D5D53] shadow-sm' : 'text-[#BDBDBD] hover:text-[#79837C]'}`}
                     >
                       {m}
                     </motion.button>
                   ))}
                </div>

                <div className="flex gap-4">
                   <div className="flex-1">
                      <p className="text-[10px] font-black text-[#9A9A9A] uppercase tracking-widest mb-2 px-2">Severity Level</p>
                      <select 
                         value={severity}
                         onChange={(e) => setSeverity(e.target.value)}
                         className="w-full bg-[#FAF9F6] border border-[#F0F0EE] rounded-xl px-4 py-3 text-xs font-bold text-[#4D5D53] outline-none"
                      >
                         <option value="info">Info</option>
                         <option value="warning">Warning</option>
                         <option value="critical">Critical</option>
                      </select>
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] font-black text-[#9A9A9A] uppercase tracking-widest">Message Content</p>
                    <span className="text-[10px] font-bold text-orange-500">{145 - message.length} chars left</span>
                 </div>
                 <textarea 
                    value={message}
                    onChange={e=>setMessage(e.target.value)}
                    maxLength={145}
                    placeholder="Enter critical message here..."
                    className="w-full h-40 bg-[#FAF9F6] border border-[#F0F0EE] rounded-[2rem] p-8 text-sm focus:border-red-400 outline-none transition-all placeholder:text-[#BDBDBD] resize-none font-medium"
                 />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-[#FAF9F6] p-6 rounded-[2rem] border border-[#F0F0EE] flex items-center gap-4 transition-all group">
                    <div className="p-3 bg-white rounded-xl text-red-500 shadow-sm group-hover:scale-110 transition-transform">
                       <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                       <p className="text-xs font-black text-[#4D5D53]">Push Alert</p>
                       <p className="text-[10px] font-bold text-[#9A9A9A]">Send to Mobile App</p>
                    </div>
                 </div>
                 <div className="bg-[#FAF9F6] p-6 rounded-[2rem] border border-[#F0F0EE] flex items-center gap-4 transition-all group">
                    <div className="p-3 bg-white rounded-xl text-blue-500 shadow-sm group-hover:scale-110 transition-transform">
                       <Globe className="h-5 w-5" />
                    </div>
                    <div>
                       <p className="text-xs font-black text-[#4D5D53]">Banner</p>
                       <p className="text-[10px] font-bold text-[#9A9A9A]">Host on Hub Header</p>
                    </div>
                 </div>
              </div>

              <motion.button 
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 onClick={handleBroadcast}
                 disabled={sending}
                 className="w-full py-5 bg-red-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 disabled:opacity-50"
              >
                  <Send className="h-4 w-4" />
                  {sending ? 'Sending...' : 'Broadcast Emergency Alert'}
              </motion.button>
           </div>
        </div>

        {/* Right Column: History */}
        <div className="space-y-8">
           <div className="bg-white p-10 rounded-[3rem] border border-[#F0F0EE] shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A]">Alert History</h4>
                 <History className="h-4 w-4 text-[#BDBDBD]" />
              </div>
              
              {loading && alerts.length === 0 ? (
                  <div className="text-center py-10 text-sm text-[#9A9A9A]">Loading history...</div>
              ) : alerts.length === 0 ? (
                  <div className="text-center py-20 opacity-40 space-y-4">
                     <ShieldAlert className="h-16 w-16 mx-auto text-[#BDBDBD]" />
                     <p className="text-xs font-black uppercase tracking-widest text-[#9A9A9A]">No alerts recorded</p>
                  </div>
              ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                     {alerts.map((item, idx) => (
                        <motion.div
                           key={item.alert_id || idx}
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: idx * 0.05 }}
                           className={`p-6 rounded-[2rem] border transition-all group ${item.is_active ? 'bg-red-50/50 border-red-100 shadow-sm' : 'bg-[#FAF9F6] border-transparent opacity-75 hover:border-[#F0F0EE]'}`}
                        >
                           <div className="flex items-center justify-between mb-3">
                               <div className="flex items-center gap-2">
                                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                     item.severity === 'critical' ? 'bg-red-100 text-red-600' : 
                                     item.severity === 'warning' ? 'bg-orange-100 text-orange-600' : 
                                     'bg-blue-100 text-blue-600'
                                  }`}>
                                     {item.severity}
                                  </span>
                                  {item.is_active && (
                                     <span className="flex h-2 w-2 relative">
                                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                       <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                     </span>
                                  )}
                               </div>
                               <span className="text-[10px] font-bold text-[#BDBDBD]">
                                  {new Date(item.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                               </span>
                           </div>
                           <h5 className="text-sm font-black text-[#4D5D53] mb-1">{item.title}</h5>
                           <p className="text-sm font-medium text-[#79837C] leading-relaxed mb-4">{item.body}</p>
                           <div className="flex items-center justify-between pt-4 border-t border-black/5">
                               <div className="flex items-center gap-2">
                                    <BellRing className="h-3 w-3 text-[#BDBDBD]" />
                                    <span className="text-[10px] font-black text-[#BDBDBD] uppercase tracking-widest">Global</span>
                               </div>
                                <div className="flex gap-4">
                                    <motion.button 
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => handleToggle(item.alert_id)} 
                                      className={`text-[10px] font-black flex items-center gap-1 ${item.is_active ? 'text-orange-400' : 'text-emerald-400'}`}
                                      title={item.is_active ? "Deactivate" : "Activate"}
                                    >
                                       {item.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                    </motion.button>
                                    <motion.button 
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => handleDelete(item.alert_id)} 
                                      className="text-[10px] font-black text-red-400 flex items-center gap-1"
                                    >
                                       <Trash2 className="h-4 w-4" />
                                    </motion.button>
                                </div>
                           </div>
                        </motion.div>
                     ))}
                  </div>
              )}
           </div>

           <div className="bg-red-50 p-10 rounded-[3rem] border border-red-100 relative overflow-hidden group">
              <div className="relative z-10 space-y-4">
                 <div className="p-3 bg-white rounded-2xl w-fit text-red-500 shadow-sm">
                    <ShieldAlert className="h-6 w-6" />
                 </div>
                 <h4 className="text-xl font-black text-red-900 tracking-tight">Panic Response Protocol</h4>
                 <p className="text-sm text-red-800/70 leading-relaxed font-medium">
                   When triggered by a resident, the system will instantly ping the nearest warden and security post with GPS coordinates.
                 </p>
                 <motion.button 
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   className="px-6 py-3 bg-white text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
                 >
                   Audit Response Records
                 </motion.button>
              </div>
              <AlertTriangle className="absolute bottom-[-20%] right-[-10%] h-48 w-48 text-red-500/10 group-hover:rotate-12 transition-transform" />
           </div>
        </div>
      </div>
    </motion.div>
  )
}
