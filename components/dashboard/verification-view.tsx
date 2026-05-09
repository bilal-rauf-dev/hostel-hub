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
  ChevronRight
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { usersApi } from '@/lib/api'

// loaded from API

export function VerificationView() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [residents, setResidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)

  useEffect(()=>{
    let mounted = true
    const load = async ()=>{
      try{
        setLoading(true)
        const res = await usersApi.getAllUsers()
        if (!mounted) return
        if (res.data?.success) setResidents((res.data.data || []).filter((u:any)=>u.status === 'Pending' || u.verification_status === 'pending'))
        else setError(res.data?.message || 'Failed to load users')
      }catch(e:any){ setError(e?.message || 'Network error') }
      finally{ if (mounted) setLoading(false) }
    }
    load()
    return ()=>{ mounted = false }
  },[])

  const handleVerify = async (id: number) => {
    try {
      setLoading(true)
      const res = await usersApi.verifyUser(id)
      if (res.data?.success) {
        // refresh
        const r = await usersApi.getAllUsers()
        if (r.data?.success) setResidents((r.data.data || []).filter((u:any)=>u.status === 'Pending' || u.verification_status === 'pending'))
        setError(null)
        alert('User verified')
      } else {
        alert(res.data?.message || 'Failed to verify')
      }
    } catch (e:any) {
      alert(e?.message || 'Network error')
    } finally { setLoading(false) }
  }

  const handleSuspend = async (id: number) => {
    try {
      setLoading(true)
      const res = await usersApi.suspendUser(id)
      if (res.data?.success) {
        const r = await usersApi.getAllUsers()
        if (r.data?.success) setResidents((r.data.data || []).filter((u:any)=>u.status === 'Pending' || u.verification_status === 'pending'))
        alert('User suspended')
      } else {
        alert(res.data?.message || 'Failed to suspend')
      }
    } catch (e:any) {
      alert(e?.message || 'Network error')
    } finally { setLoading(false) }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-3xl font-black text-[#4D5D53] tracking-tighter">Resident Verification</h3>
          <p className="text-sm text-[#9A9A9A] font-medium mt-1">Audit and approve new resident student accounts.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#BDBDBD]" />
            <input 
              type="text" 
              placeholder="Search by ID or Email..." 
              className="pl-10 pr-4 py-2.5 bg-white border border-[#F0F0EE] rounded-xl text-xs focus:border-[#D4A373] outline-none w-64 shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Left Column: List */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-4">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A]">Pending Approvals ({residents.length})</h4>
             <button className="text-[10px] font-black uppercase tracking-widest text-[#D4A373] hover:underline">Batch Verify</button>
          </div>
          <div className="space-y-3">
            {residents.map((resident, idx) => (
              <motion.div
                key={resident.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedId(resident.id)}
                className={`group bg-white p-6 rounded-[2rem] border transition-all cursor-pointer flex items-center justify-between ${selectedId === resident.id ? 'border-[#D4A373] shadow-lg ring-1 ring-[#D4A373]' : 'border-[#F0F0EE] hover:border-[#D4A373] hover:shadow-md shadow-sm'}`}
              >
                <div className="flex items-center gap-6">
                   <div className="w-14 h-14 rounded-2xl bg-[#FAF9F6] flex items-center justify-center text-[#D4A373] font-black group-hover:scale-110 transition-transform">
                     {(resident.name || resident.full_name || resident.display_name || 'U').split(' ').map((n:any)=>n[0]).join('')}
                   </div>
                   <div>
                     <h4 className="text-lg font-black text-[#4D5D53] tracking-tight">{resident.name}</h4>
                     <p className="text-xs text-[#9A9A9A] font-bold">{resident.email}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] font-black px-2 py-0.5 bg-[#FEFAE0] text-[#D4A373] rounded-lg">Block {resident.block || resident.block_name || '—'} • {resident.room || resident.room_number || '—'}</span>
                      <span className="text-[10px] font-black text-[#BDBDBD] uppercase tracking-widest">• {resident.updated_at || resident.time || ''}</span>
                    </div>
                   </div>
                </div>
                
                <div className="flex items-center gap-6">
                   <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                     resident.status === 'Pending' ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-blue-50 border-blue-100 text-blue-600'
                   }`}>
                     {resident.status}
                   </div>
                   <ChevronRight className={`h-5 w-5 transition-transform ${selectedId === resident.id ? 'rotate-90 text-[#D4A373]' : 'text-[#BDBDBD]'}`} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Column: Review Details */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-[#F0F0EE] shadow-sm sticky top-32">
            {!selectedId ? (
              <div className="text-center py-20 space-y-4 opacity-40">
                 <ShieldCheck className="h-16 w-16 mx-auto text-[#BDBDBD]" />
                 <p className="text-xs font-black uppercase tracking-widest text-[#9A9A9A]">Select a profile to review</p>
              </div>
            ) : (
              <div className="space-y-8">
                 <div>
                    <h4 className="text-sm font-black text-[#4D5D53] uppercase tracking-widest mb-6">Review Portal</h4>
                    <div className="p-6 bg-[#FAF9F6] rounded-[2rem] space-y-4">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-xl text-[#D4A373] shadow-sm">
                             <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#4D5D53]">ID & Proof of Enrollment</p>
                            <p className="text-[10px] font-medium text-[#9A9A9A]">Uploaded Oct 28 • PDF</p>
                          </div>
                          <ExternalLink className="h-4 w-4 ml-auto text-[#BDBDBD] cursor-pointer hover:text-[#D4A373]" />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-[#9A9A9A] uppercase tracking-widest px-2">Decision Actions</p>
                      <button onClick={() => selectedId && handleVerify(Number(selectedId))} className="w-full py-4 bg-[#4D5D53] text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#3D4D43] transition-all shadow-lg shadow-[#4D5D53]/20">
                        <CheckCircle2 className="h-4 w-4" />
                        Verify Account
                      </button>
                      <button onClick={() => selectedId && handleSuspend(Number(selectedId))} className="w-full py-4 bg-white border border-red-100 text-red-500 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-50 transition-all">
                        <XCircle className="h-4 w-4" />
                        Reject Docs
                      </button>
                 </div>

                 <div className="pt-6 border-t border-[#F0F0EE]">
                    <div className="flex items-center gap-2 mb-3">
                       <Clock className="h-3 w-3 text-[#BDBDBD]" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-[#BDBDBD]">Last System Audit</span>
                    </div>
                    <p className="text-[10px] text-[#9A9A9A] font-bold leading-relaxed italic">
                      &quot;Cross-referenced with University LDAP. Email domain verified successfully.&quot;
                    </p>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
