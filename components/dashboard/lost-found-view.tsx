'use client'

import { motion, AnimatePresence } from 'motion/react'
import { 
  Search, 
  MapPin, 
  Clock, 
  Plus, 
  Tag, 
  Camera,
  AlertCircle,
  CheckCircle2,
  Filter,
  User as UserIcon,
  EyeOff
} from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'

const ITEMS = [
  {
    id: 1,
    title: 'Silver Apple Watch',
    type: 'Lost',
    location: 'Gym Area',
    date: 'Today, 10:00 AM',
    desc: 'Series 7 with a black sport band. Left it near the treadmills.',
    image: 'https://picsum.photos/seed/watch2/400/300',
    anonymous: false,
    author: 'Alex Rivers',
    status: 'Open'
  },
  {
    id: 2,
    title: 'Blue Water Bottle',
    type: 'Found',
    location: 'Study Hub B',
    date: 'Yesterday',
    desc: 'Hydroflask blue 32oz. Handed it to the reception desk.',
    image: 'https://picsum.photos/seed/bottle/400/300',
    anonymous: true,
    author: 'Anonymous Student',
    status: 'Open'
  },
  {
    id: 3,
    title: 'Room Keys (402)',
    type: 'Lost',
    location: 'Main Entrance',
    date: '2 days ago',
    desc: 'Keys with a "Spiderman" keychain. Very important!',
    image: null,
    anonymous: false,
    author: 'Sarah J.',
    status: 'Resolved'
  }
]

export function LostAndFoundView() {
  const [filter, setFilter] = useState('All')

  const filteredItems = filter === 'All' ? ITEMS : ITEMS.filter(item => item.type === filter)

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="text-2xl font-black text-[#4D5D53] tracking-tight">Lost & Found</h3>
          <p className="text-sm text-[#9A9A9A] font-medium">Reuniting students with their belongings.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-3 bg-[#D4A373] text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-[#D4A373]/20"
        >
          <Plus className="h-4 w-4" />
          Report Item
        </motion.button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl border border-[#F0F0EE] shadow-sm">
        <div className="flex gap-2">
          {['All', 'Lost', 'Found'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === f 
                ? 'bg-[#4D5D53] text-white' 
                : 'bg-[#FAF9F6] text-[#79837C] hover:bg-[#E9EDC9] hover:text-[#4D5D53]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#BDBDBD]" />
           <input 
             type="text" 
             placeholder="Search items..."
             className="w-full pl-10 pr-4 py-2 bg-[#FAF9F6] border border-transparent rounded-xl text-sm focus:border-[#D4A373] outline-none transition-all"
           />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item, idx) => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
              transition={{ delay: idx * 0.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="group h-full"
            >
              <div className="bg-white rounded-[3rem] border border-[#F0F0EE] overflow-hidden shadow-sm hover:border-[#D4A373]/30 hover:bg-[#FAF9F6]/30 transition-all duration-500 flex flex-col h-full cursor-pointer relative">
                <div className="relative h-56 bg-[#FAF9F6] shrink-0 overflow-hidden">
                  {item.image ? (
                    <Image 
                      src={item.image} 
                      alt={item.title}
                      fill
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#BDBDBD] space-y-3 bg-[#FAF9F6] group-hover:bg-[#FEFAE0]/30 transition-colors">
                      <Camera className="h-12 w-12 opacity-10 group-hover:opacity-20 transition-opacity" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">No Image provided</span>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-700" />

                  <div className="absolute top-6 left-6 flex gap-3 transform transition-transform group-hover:translate-x-1 group-hover:translate-y-1">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-white/50 backdrop-blur-xl ${
                      item.type === 'Lost' ? 'bg-red-500/90 text-white' : 'bg-emerald-500/90 text-white'
                    }`}>
                      {item.type}
                    </span>
                    {item.status === 'Resolved' && (
                      <span className="px-4 py-1.5 bg-blue-500/90 backdrop-blur-xl text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" /> Found
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-xl font-black text-[#4D5D53] tracking-tighter group-hover:text-[#D4A373] transition-colors leading-tight">{item.title}</h4>
                  </div>
                  
                  <p className="text-sm text-[#79837C] line-clamp-2 mb-6 leading-relaxed flex-1 font-medium tracking-tight">
                    {item.desc}
                  </p>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#BDBDBD] group-hover:text-[#D4A373] transition-colors">
                      <MapPin className="h-3.5 w-3.5" /> {item.location}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#BDBDBD]">
                      <Clock className="h-3.5 w-3.5" /> {item.date}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[#F0F0EE] flex items-center justify-between group-hover:border-[#D4A373]/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#FAF9F6] border border-[#F0F0EE] flex items-center justify-center group-hover:bg-[#E9EDC9] transition-colors">
                        {item.anonymous ? <EyeOff className="h-4 w-4 text-[#BDBDBD]" /> : <UserIcon className="h-4 w-4 text-[#D4A373]" />}
                      </div>
                      <span className="text-[10px] font-black text-[#4D5D53] uppercase tracking-widest leading-none">{item.author}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] border border-[#F0F0EE] flex items-center justify-center text-[#BDBDBD] group-hover:bg-[#4D5D53] group-hover:text-white group-hover:rotate-12 transition-all duration-500">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="bg-[#4D5D53] rounded-[2rem] p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h4 className="text-xl font-bold mb-2">Notice: Unclaimed Items</h4>
          <p className="text-emerald-50/50 text-xs max-w-sm leading-relaxed">
            Items without activity for 30 days are automatically archived and moved to the Central Office for disposal or donation.
          </p>
        </div>
        <Tag className="absolute -right-5 -bottom-5 h-32 w-32 text-white/5 -rotate-12" />
      </div>
    </motion.div>
  )
}
