'use client'

import { motion } from 'motion/react'
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  ChevronRight,
  Filter,
  Plus,
  ArrowRight
} from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { eventsApi } from '@/lib/api'

export function EventsView() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const res = await eventsApi.getEvents()
        if (!mounted) return
        if (res.data?.success) setEvents(res.data.data || [])
        else setError(res.data?.message || 'Failed to load events')
      } catch (err: any) {
        setError(err?.message || 'Network error')
      } finally { if (mounted) setLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [])

  const categories = ['All', ...Array.from(new Set(events.map(e => e.category).filter(Boolean)))]

  const handleRsvp = async (event_id: number) => {
    try {
      await eventsApi.rsvpEvent(event_id, 'going')
      alert('RSVP saved')
    } catch (err) { alert('Failed to RSVP') }
  }

  function CreateEventForm({ onDone, onCancel }: { onDone: (s:boolean)=>void, onCancel: ()=>void }){
    const [title, setTitle] = useState('')
    const [date, setDate] = useState('')
    const [time, setTime] = useState('')
    const [location, setLocation] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const submit = async () => {
      try {
        setSubmitting(true)
        await eventsApi.createEvent({ title, date, time, location })
        onDone(true)
      } catch (e) { onDone(false) }
      finally { setSubmitting(false) }
    }
    return (
      <div>
        <div className="grid grid-cols-1 gap-3">
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" className="p-3 border rounded-md" />
          <input value={date} onChange={e=>setDate(e.target.value)} placeholder="Date" className="p-3 border rounded-md" />
          <input value={time} onChange={e=>setTime(e.target.value)} placeholder="Time" className="p-3 border rounded-md" />
          <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Location" className="p-3 border rounded-md" />
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onCancel} className="px-4 py-2 border rounded-md">Cancel</button>
          <button onClick={submit} disabled={submitting} className="px-4 py-2 bg-[#4D5D53] text-white rounded-md">{submitting? 'Saving...':'Save'}</button>
        </div>
      </div>
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
        <h3 className="text-2xl font-black text-[#4D5D53] tracking-tight">Events Calendar</h3>
        <motion.button 
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-3 bg-[#D4A373] text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-[#D4A373]/20"
        >
          <Plus className="h-4 w-4" />
          Organize Event
        </motion.button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat, idx) => (
          <motion.button
            key={cat}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-[0.15em] border-2 transition-all ${
              selectedCategory === cat ? 'bg-[#E9EDC9] border-[#E9EDC9] text-[#4D5D53]' : 'bg-white border-[#F0F0EE] text-[#9A9A9A]'
            }`}
          >
            {cat}
          </motion.button>
        ))}
      </div>

      <div className="space-y-10">
        {(events.filter(e => selectedCategory === 'All' || e.category === selectedCategory)).map((event, idx) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.1 + (idx * 0.15), duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-[3rem] border border-[#F0F0EE] overflow-hidden shadow-sm hover:border-[#D4A373]/30 hover:bg-[#FAF9F6]/30 transition-all duration-500 flex flex-col lg:flex-row group"
          >
            <div className="w-full lg:w-96 h-72 lg:h-auto relative overflow-hidden shrink-0">
               <Image 
                 src={event.image} 
                 alt={event.title}
                 fill
                 className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                 referrerPolicy="no-referrer"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
               <div className="absolute top-8 left-8 px-5 py-2 bg-white/90 backdrop-blur-xl rounded-full border border-white/50 text-[10px] font-black uppercase tracking-[0.2em] text-[#4D5D53] transform transition-transform group-hover:scale-110 group-hover:bg-[#E9EDC9]">
                 {event.category}
               </div>
            </div>

            <div className="flex-1 p-8 lg:p-14 flex flex-col justify-between">
              <div>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-4 text-[#D4A373] text-[10px] font-black uppercase tracking-[0.3em] mb-6"
                >
                  <Calendar className="h-4 w-4" />
                   {event.date} • {event.time}
                </motion.div>
                <h4 className="text-3xl lg:text-4xl font-black text-[#4D5D53] tracking-tighter mb-6 group-hover:text-[#D4A373] transition-colors duration-500 leading-tight">{event.title}</h4>
                <div className="flex flex-wrap gap-10 text-[#79837C]">
                   <div className="flex items-center gap-3 text-sm font-bold tracking-tight">
                     <div className="p-2 bg-[#FAF9F6] rounded-lg group-hover:bg-[#FEFAE0] transition-colors"><MapPin className="h-4 w-4" /></div> {event.location}
                   </div>
                   <div className="flex items-center gap-3 text-sm font-bold tracking-tight">
                     <div className="p-2 bg-[#FAF9F6] rounded-lg group-hover:bg-[#FEFAE0] transition-colors"><Users className="h-4 w-4" /></div> {event.attendees}
                   </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between mt-12 pt-10 border-t border-[#F0F0EE] gap-8">
                 <div className="flex -space-x-4">
                   {[1, 2, 3, 4].map(i => (
                     <motion.div 
                       key={`${event.id}-avatar-${i}`} 
                       whileHover={{ y: -4, zIndex: 10 }}
                       className="w-12 h-12 rounded-full border-4 border-white bg-[#F4F4F2] overflow-hidden shadow-sm cursor-pointer transition-transform"
                     >
                       <Image src={`https://picsum.photos/seed/user${i + idx}/100/100`} width={48} height={48} alt="User" referrerPolicy="no-referrer" />
                     </motion.div>
                   ))}
                   <div className="w-12 h-12 rounded-full border-4 border-white bg-[#4D5D53] flex items-center justify-center text-xs font-black text-white shadow-sm">
                     +12
                   </div>
                 </div>
                 <motion.button 
                   whileHover={{ x: 8, scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => handleRsvp(event.event_id || event.id)}
                   className="w-full sm:w-auto px-10 py-5 bg-[#4D5D53] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#3D4D43] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-[#4D5D53]/20"
                 >
                   Join Event <ArrowRight className="h-4 w-4" />
                 </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Event Modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded-2xl w-full max-w-xl">
            <h4 className="text-lg font-bold mb-4">Create Event</h4>
            <CreateEventForm onDone={async (success: boolean) => { setCreating(false); if (success) { const res = await eventsApi.getEvents(); if (res.data?.success) setEvents(res.data.data || []) } }} onCancel={() => setCreating(false)} />
          </div>
        </div>
      )}
    </motion.div>
  )
}
