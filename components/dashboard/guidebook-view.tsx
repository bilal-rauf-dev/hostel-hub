'use client'

import { motion } from 'motion/react'
import { useState, useEffect } from 'react'
import { guidebookApi } from '@/lib/api'
import { 
  BookOpen, 
  Wifi, 
  Trash2, 
  Zap, 
  MapPin, 
  ChefHat, 
  Search,
  ChevronRight,
  ShieldCheck,
  PhoneCall
} from 'lucide-react'

export function GuidebookView() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)

  useEffect(()=>{
    let mounted = true
    const load = async ()=>{
      try{
        setLoading(true)
        const res = await guidebookApi.getEntries()
        if (!mounted) return
        if (res.data?.success) setEntries(res.data.data || [])
        else setError(res.data?.message || 'Failed to load guidebook')
      }catch(e:any){ setError(e?.message || 'Network error') }
      finally{ if (mounted) setLoading(false) }
    }
    load()
    return ()=>{ mounted = false }
  },[])
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="relative overflow-hidden bg-[#4D5D53] rounded-[2.5rem] p-10 text-white shadow-xl shadow-[#4D5D53]/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-md">
            <h3 className="text-3xl font-black tracking-tight mb-4">Resident Guidebook</h3>
            <p className="text-emerald-50/70 text-sm leading-relaxed">
              Everything you need to know about living at the Hub. From technical setups to community rules, we&apos;ve got you covered.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
             <button className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2">
               <PhoneCall className="h-4 w-4" /> Emergency
             </button>
             <button className="px-6 py-3 bg-[#E9EDC9] text-[#4D5D53] rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#DDE2B6] transition-all flex items-center gap-2">
               <Search className="h-4 w-4" /> Search Wiki
             </button>
          </div>
        </div>
        <BookOpen className="absolute -right-10 -bottom-10 h-64 w-64 text-white/5 rotate-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(entries || []).map((guide, idx) => (
          <motion.div
            key={guide.id || guide.title || idx}
            initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ backgroundColor: '#FAF9F6', borderColor: '#D4A373' }}
            className="bg-white p-8 rounded-[3rem] border border-[#F0F0EE] shadow-sm hover:shadow-xl hover:shadow-[#D4A373]/20 transition-all duration-250 group cursor-pointer"
          >
            <div className={`w-16 h-16 rounded-[1.5rem] bg-blue-50 text-blue-500 flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-sm`}>
              <Wifi className="h-8 w-8" />
            </div>
            <h4 className="text-2xl font-black text-[#4D5D53] tracking-tighter mb-4 group-hover:text-[#D4A373] transition-colors leading-tight">{guide.title}</h4>
            <p className="text-sm font-medium text-[#79837C] leading-relaxed mb-8 tracking-tight">{guide.content || guide.desc || guide.description}</p>
            <div className="flex items-center text-[10px] font-black uppercase tracking-[0.25em] text-[#D4A373] group-hover:pl-2 transition-all">
              Comprehensive Guide <ChevronRight className="h-4 w-4 ml-1" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-[#FEFAE0]/50 border border-[#E9EDC9] rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="p-3 bg-white rounded-2xl shadow-sm">
            <ShieldCheck className="h-8 w-8 text-[#D4A373]" />
          </div>
          <div>
            <h5 className="font-bold text-[#4D5D53]">Health & Safety Protocols</h5>
            <p className="text-xs text-[#79837C]">Updated 2 days ago for Winter Season.</p>
          </div>
        </div>
        <button className="text-xs font-black uppercase tracking-widest text-[#4D5D53] hover:underline underline-offset-4">
          View Full Document
        </button>
      </div>
    </motion.div>
  )
}
