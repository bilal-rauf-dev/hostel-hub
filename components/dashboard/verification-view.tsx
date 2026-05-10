'use client'

import { motion } from 'motion/react'
import { 
  Users, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  FileText,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Mail
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { usersApi } from '@/lib/api'

export function VerificationView() {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [residents, setResidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null)

  const [refreshing, setRefreshing] = useState(false)

  const pushToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadPending = useCallback(async () => {
    try {
      setLoading(true)
      const res = await usersApi.getPendingVerifications()
      if (res.data?.success) {
        setResidents(res.data.data || [])
      } else {
        setError(res.data?.message || 'Failed to load users')
      }
    } catch (e: any) {
      setError(e?.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadPending()
    setRefreshing(false)
  }

  useEffect(() => {
    loadPending()
  }, [loadPending])

  const handleVerify = async (id: number) => {
    try {
      setLoading(true)
      const res = await usersApi.verifyUser(id)
      if (res.data?.success) {
        setResidents(prev => prev.filter(r => r.user_id !== id))
        if (selectedId === id) setSelectedId(null)
        pushToast('User verified successfully', 'success')
      } else {
        pushToast(res.data?.message || 'Failed to verify', 'error')
      }
    } catch (e: any) {
      pushToast(e?.message || 'Network error', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSuspend = async (id: number) => {
    try {
      setLoading(true)
      const res = await usersApi.suspendUser(id)
      if (res.data?.success) {
        setResidents(prev => prev.filter(r => r.user_id !== id))
        if (selectedId === id) setSelectedId(null)
        pushToast('User suspended successfully', 'success')
      } else {
        pushToast(res.data?.message || 'Failed to suspend', 'error')
      }
    } catch (e: any) {
      pushToast(e?.message || 'Network error', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async (id: number) => {
    try {
      setLoading(true)
      const res = await usersApi.resendOtp(id)
      if (res.data?.success) {
        // Update local state with new OTP
        setResidents(prev => prev.map(r => r.user_id === id ? { ...r, otp_code: res.data.data.otp_code } : r))
        pushToast('OTP resent successfully', 'success')
      } else {
        pushToast(res.data?.message || 'Failed to resend OTP', 'error')
      }
    } catch (e: any) {
      pushToast(e?.message || 'Network error', 'error')
    } finally {
      setLoading(false)
    }
  }

  const selectedResident = residents.find(r => r.user_id === selectedId)

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-3xl font-black text-[#4D5D53] tracking-tighter">Resident Verification</h3>
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
          <p className="text-sm text-[#9A9A9A] font-medium mt-1">Audit and approve new resident student accounts.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#BDBDBD]" />
            <input 
              type="text" 
              placeholder="Search by ID or Email..." 
              className="pl-10 pr-4 py-2.5 bg-white border border-[#F0F0EE] rounded-xl text-xs focus:border-[#D4A373] outline-none w-64 shadow-sm transition-colors"
            />
          </div>
        </div>
      </div>

      {toast && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-xl text-sm font-bold shadow-sm ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : toast.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}
        >
          {toast.message}
        </motion.div>
      )}

      {loading && residents.length === 0 ? (
        <div className="text-center py-20 text-[#9A9A9A] text-sm">Loading pending verifications...</div>
      ) : residents.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center p-20 text-center space-y-4 bg-white rounded-[3rem] border border-[#F0F0EE] shadow-sm"
        >
          <div className="w-24 h-24 bg-[#FAF9F6] rounded-[2.5rem] flex items-center justify-center text-[#D4A373] shadow-inner">
             <ShieldCheck className="h-10 w-10 opacity-50" />
          </div>
          <h3 className="text-2xl font-black text-[#4D5D53]">All Caught Up!</h3>
          <p className="text-sm text-[#9A9A9A] max-w-xs mx-auto">There are no pending student verifications at the moment. Great job!</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          {/* Left Column: List */}
          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-4">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A]">Pending Approvals ({residents.length})</h4>
            </div>
            <div className="space-y-3">
              {residents.map((resident, idx) => (
                <motion.div
                  key={resident.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedId(resident.user_id)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`group bg-white p-6 rounded-[2rem] border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${selectedId === resident.user_id ? 'border-[#D4A373] shadow-lg ring-1 ring-[#D4A373]' : 'border-[#F0F0EE] hover:border-[#D4A373] hover:shadow-md shadow-sm'}`}
                >
                  <div className="flex items-center gap-6">
                     <div className="w-14 h-14 rounded-2xl bg-[#FAF9F6] flex items-center justify-center text-[#D4A373] font-black group-hover:scale-110 transition-transform shadow-sm">
                       {(resident.display_name || 'U').substring(0, 2).toUpperCase()}
                     </div>
                     <div>
                       <h4 className="text-lg font-black text-[#4D5D53] tracking-tight">{resident.display_name}</h4>
                       <p className="text-xs text-[#9A9A9A] font-bold">{resident.email}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-[10px] font-black px-2 py-0.5 bg-[#FEFAE0] text-[#D4A373] rounded-lg">ID: {resident.student_id || 'N/A'}</span>
                        <span className="text-[10px] font-black px-2 py-0.5 bg-blue-50 text-blue-500 rounded-lg flex items-center gap-1">
                          <Mail className="w-3 h-3" /> OTP: {resident.otp_code || 'None'}
                        </span>
                        <span className="text-[10px] font-black text-[#BDBDBD] uppercase tracking-widest">
                          • {resident.created_at ? new Date(resident.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                        </span>
                      </div>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-6 self-end sm:self-auto">
                     <div className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-orange-50 border-orange-100 text-orange-600">
                       Pending
                     </div>
                     <ChevronRight className={`h-5 w-5 transition-transform ${selectedId === resident.user_id ? 'rotate-90 text-[#D4A373]' : 'text-[#BDBDBD]'}`} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Column: Review Details */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[3rem] border border-[#F0F0EE] shadow-sm sticky top-32">
              {!selectedResident ? (
                <div className="text-center py-20 space-y-4 opacity-40">
                   <ShieldCheck className="h-16 w-16 mx-auto text-[#BDBDBD]" />
                   <p className="text-xs font-black uppercase tracking-widest text-[#9A9A9A]">Select a profile to review</p>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={selectedResident.user_id} 
                  className="space-y-8"
                >
                   <div>
                      <h4 className="text-sm font-black text-[#4D5D53] uppercase tracking-widest mb-6">Verification Data</h4>
                      <div className="p-6 bg-[#FAF9F6] rounded-[2rem] space-y-4">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A]">Current OTP</span>
                            <span className="text-xl font-black text-[#4D5D53] tracking-widest bg-white px-3 py-1 rounded-xl shadow-sm">{selectedResident.otp_code || '---'}</span>
                         </div>
                         <div className="h-px bg-black/5 w-full my-2"></div>
                         <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A]">Student ID</span>
                            <span className="text-sm font-bold text-[#4D5D53]">{selectedResident.student_id}</span>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <p className="text-[10px] font-black text-[#9A9A9A] uppercase tracking-widest px-2">Decision Actions</p>
                      
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleVerify(selectedResident.user_id)} 
                          className="w-full py-4 bg-[#4D5D53] text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#3D4D43] transition-all shadow-lg shadow-[#4D5D53]/20"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Verify Manually
                        </motion.button>
                        
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleResendOtp(selectedResident.user_id)} 
                          className="w-full py-4 bg-[#FEFAE0] text-[#D4A373] rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#F9E2B5] transition-all"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Resend OTP Code
                        </motion.button>

                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSuspend(selectedResident.user_id)} 
                          className="w-full py-4 bg-white border border-red-100 text-red-500 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-50 transition-all"
                        >
                          <XCircle className="h-4 w-4" />
                          Suspend Account
                        </motion.button>
                   </div>

                   <div className="pt-6 border-t border-[#F0F0EE]">
                      <div className="flex items-center gap-2 mb-3">
                         <Clock className="h-3 w-3 text-[#BDBDBD]" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-[#BDBDBD]">System Notice</span>
                      </div>
                      <p className="text-[10px] text-[#9A9A9A] font-bold leading-relaxed italic">
                        &quot;Admin manual verification bypasses the email OTP requirement and grants immediate student access to the portal.&quot;
                      </p>
                   </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
