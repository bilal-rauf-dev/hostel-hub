'use client'

import { motion, AnimatePresence } from 'motion/react'
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  ChevronRight,
  Filter,
  Plus,
  ArrowRight,
  Search,
  Inbox,
  RefreshCw
} from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { eventsApi } from '@/lib/api'
import { isAdmin } from '@/lib/auth'

interface Props { onToast: (msg: string, type: 'success' | 'error' | 'info') => void }

function CreateEventForm({ onDone, onCancel }: { onDone: (s:boolean)=>void, onCancel: ()=>void }){
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!title || !date || !time || !location) {
       alert("All fields are required.")
       return
    }
    try {
      setSubmitting(true)
      const eventDate = `${date}T${time}:00`
      const res = await eventsApi.createEvent(title, '', location, eventDate)
      onDone(true)
    } catch (e: any) {
      console.error(e)
      onDone(false)
    }
    finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Event Title" className="w-full p-4 bg-[#FAF9F6] border border-[#F0F0EE] rounded-2xl text-sm focus:border-[#D4A373] outline-none transition-colors" />
        <div className="grid grid-cols-2 gap-4">
           <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full p-4 bg-[#FAF9F6] border border-[#F0F0EE] rounded-2xl text-sm focus:border-[#D4A373] outline-none transition-colors" />
           <input type="time" value={time} onChange={e=>setTime(e.target.value)} className="w-full p-4 bg-[#FAF9F6] border border-[#F0F0EE] rounded-2xl text-sm focus:border-[#D4A373] outline-none transition-colors" />
        </div>
        <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Location" className="w-full p-4 bg-[#FAF9F6] border border-[#F0F0EE] rounded-2xl text-sm focus:border-[#D4A373] outline-none transition-colors" />
      </div>
      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#F0F0EE]">
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onCancel} className="px-6 py-3 border border-[#F0F0EE] rounded-2xl text-xs font-black uppercase tracking-widest text-[#9A9A9A] hover:bg-[#FAF9F6]">Cancel</motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={submit} disabled={submitting} className="px-6 py-3 bg-[#4D5D53] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#4D5D53]/20 hover:bg-[#3D4D43] disabled:opacity-50 flex items-center gap-2">{submitting? 'Saving...':'Create Event'}</motion.button>
      </div>
    </div>
  )
}

export function EventsView({ onToast }: Props) {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await eventsApi.getEvents()
      if (res.data?.success) setEvents(res.data.data || [])
      else setError(res.data?.message || 'Failed to load events')
    } catch (err: any) {
      setError(err?.message || 'Network error')
    } finally { setLoading(false) }
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  useEffect(() => {
    load()
  }, [load])

  const categories = ['All', ...Array.from(new Set(events.map(e => e.category).filter(Boolean)))]

  const filteredEvents = events.filter(e => {
     const matchesSearch = (e.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                           (e.location?.toLowerCase() || '').includes(searchQuery.toLowerCase())
     if (!matchesSearch) return false

     if (selectedCategory !== 'All' && e.category !== selectedCategory) return false
     return true
  })

  const handleRsvp = async (event_id: number, currentRsvp: string | null) => {
    try {
      const newStatus = currentRsvp === 'going' ? 'not_going' : 'going'
      await eventsApi.rsvpEvent(event_id, newStatus)
      const res = await eventsApi.getEvents()
      if (res.data?.success) setEvents(res.data.data || [])
      onToast(newStatus === 'going' ? 'You\'re going!' : 'RSVP removed', 'success')
    } catch (err) { onToast('Failed to RSVP', 'error') }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="text-center md:text-left">
           <div className="flex items-center gap-3 justify-center md:justify-start">
             <h3 className="text-2xl font-black text-[#4D5D53] tracking-tight">Events Calendar</h3>
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
           <p className="text-sm text-[#9A9A9A] font-medium mt-1">Discover and join campus activities.</p>
        </div>
        {isAdmin() && <motion.button 
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setCreating(true)}
          className="px-6 py-3 bg-[#D4A373] text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-[#D4A373]/20"
        >
          <Plus className="h-4 w-4" />
          Organize Event
        </motion.button>}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[2rem] border border-[#F0F0EE] shadow-sm">
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
          {categories.map((cat, idx) => (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                selectedCategory === cat 
                ? 'bg-[#4D5D53] text-white shadow-sm' 
                : 'bg-[#FAF9F6] text-[#79837C] hover:bg-[#E9EDC9] hover:text-[#4D5D53]'
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#BDBDBD]" />
           <input 
             type="text" 
             placeholder="Search events..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full pl-10 pr-4 py-2 bg-[#FAF9F6] border border-transparent rounded-xl text-sm focus:border-[#D4A373] outline-none transition-all"
           />
        </div>
      </div>

      <div className="space-y-10">
        {loading ? (
           <div className="py-20 text-center text-[#9A9A9A] text-sm">Loading events...</div>
        ) : error ? (
           <div className="py-20 text-center text-red-500 text-sm">Error: {error}</div>
        ) : filteredEvents.length === 0 ? (
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="py-20 flex flex-col items-center justify-center space-y-4 bg-white border border-[#F0F0EE] rounded-[3rem] shadow-sm"
           >
              <div className="w-24 h-24 bg-[#FAF9F6] rounded-full flex items-center justify-center text-[#D4A373]">
                 <Calendar className="h-10 w-10 opacity-50" />
              </div>
              <p className="text-lg font-black text-[#4D5D53] tracking-tighter">No events found</p>
              <p className="text-sm text-[#9A9A9A]">Try adjusting your search or category filter.</p>
           </motion.div>
        ) : (
          filteredEvents.map((event, idx) => {
            const eventDate = new Date(event.event_date)
            const dateStr = eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
            const timeStr = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
            
            return (
            <motion.div
              layout
              key={event.event_id}
              initial={{ opacity: 0, x: -30, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.1 + (idx * 0.15), duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-[3rem] border border-[#F0F0EE] overflow-hidden shadow-sm hover:border-[#D4A373]/30 hover:bg-[#FAF9F6]/30 transition-all duration-500 flex flex-col lg:flex-row group"
            >
              <div className="w-full lg:w-96 h-72 lg:h-auto relative overflow-hidden shrink-0 bg-[#FAF9F6]">
                 <Image 
                   src={event.image || `https://picsum.photos/seed/event${event.event_id}/400/300`}
                   alt={event.title}
                   fill
                   className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                   referrerPolicy="no-referrer"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
                 <div className="absolute top-8 left-8 px-5 py-2 bg-white/90 backdrop-blur-xl rounded-full border border-white/50 text-[10px] font-black uppercase tracking-[0.2em] text-[#4D5D53] transform transition-transform group-hover:scale-110 group-hover:bg-[#E9EDC9]">
                   {event.category || 'General'}
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
                     {dateStr} • {timeStr}
                  </motion.div>
                  <h4 className="text-3xl lg:text-4xl font-black text-[#4D5D53] tracking-tighter mb-6 group-hover:text-[#D4A373] transition-colors duration-500 leading-tight">{event.title}</h4>
                  <div className="flex flex-wrap gap-10 text-[#79837C]">
                     <div className="flex items-center gap-3 text-sm font-bold tracking-tight">
                       <div className="p-2 bg-[#FAF9F6] rounded-lg group-hover:bg-[#FEFAE0] transition-colors"><MapPin className="h-4 w-4" /></div> {event.location}
                     </div>
                     <div className="flex items-center gap-3 text-sm font-bold tracking-tight">
                       <div className="p-2 bg-[#FAF9F6] rounded-lg group-hover:bg-[#FEFAE0] transition-colors"><Users className="h-4 w-4" /></div> {event.attendees ?? '0'} attending
                     </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between mt-12 pt-10 border-t border-[#F0F0EE] gap-8">
                   <div className="flex -space-x-4">
                     {[1, 2, 3].map(i => (
                       <motion.div 
                         key={`${event.event_id}-avatar-${i}`}
                         whileHover={{ y: -4, zIndex: 10 }}
                         className="w-12 h-12 rounded-full border-4 border-white bg-[#F4F4F2] overflow-hidden shadow-sm cursor-pointer transition-transform"
                       >
                         <Image src={`https://picsum.photos/seed/user${i + idx}/100/100`} width={48} height={48} alt="User" referrerPolicy="no-referrer" />
                       </motion.div>
                     ))}
                     <div className="w-12 h-12 rounded-full border-4 border-white bg-[#4D5D53] flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                       +{(event.attendees || 3) > 3 ? (event.attendees - 3) : 0}
                     </div>
                   </div>
                   <motion.button 
                     whileHover={{ x: 8, scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                     onClick={() => handleRsvp(event.event_id, event.my_rsvp)}
                     className={`w-full sm:w-auto px-10 py-5 bg-[#4D5D53] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#3D4D43] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-[#4D5D53]/20 ${event.my_rsvp === 'going' ? 'ring-2 ring-emerald-400 bg-emerald-600 hover:bg-emerald-700' : ''}`}
                   >
                     {event.my_rsvp === 'going' ? 'Cancel RSVP' : 'Join Event'} <ArrowRight className="h-4 w-4" />
                   </motion.button>
                </div>
              </div>
            </motion.div>
            )
          })
        )}
      </div>

      {/* Create Event Modal */}
      {creating && createPortal(
        <AnimatePresence>
          <motion.div
            key="modal-overlay"
            className="fixed inset-0 z-[9999] flex items-center justify-center"
          >
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setCreating(false)}
            />
            <motion.div
              key="modal-content"
              initial={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-white p-8 rounded-[3rem] w-full max-w-xl mx-4 shadow-2xl z-10"
            >
              <h4 className="text-2xl font-black mb-6 text-[#4D5D53]">Create Event</h4>
              <CreateEventForm onDone={async (success: boolean) => { 
                 setCreating(false); 
                 if (success) { 
                    const res = await eventsApi.getEvents(); 
                    if (res.data?.success) setEvents(res.data.data || []);
                    onToast('Event created successfully', 'success');
                 } else {
                    onToast('Failed to create event', 'error');
                 }
              }} onCancel={() => setCreating(false)} />
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  )
}
