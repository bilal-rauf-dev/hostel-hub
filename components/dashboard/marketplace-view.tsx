'use client'

import { motion, AnimatePresence } from 'motion/react'
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  Star,
  Tag,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'

const CATEGORIES = ['All', 'Food', 'Books', 'Furniture', 'Electronics', 'Services']

const PRODUCTS = [
  {
    id: 1,
    title: 'Homemade Thai Curry',
    price: 6.50,
    category: 'Food',
    seller: 'Sarah J.',
    rating: 4.8,
    image: 'https://picsum.photos/seed/curry/400/300',
    time: '20m ago'
  },
  {
    id: 2,
    title: 'Organic Desk Lamp',
    price: 15.00,
    category: 'Furniture',
    seller: 'Mike R.',
    rating: 4.5,
    image: 'https://picsum.photos/seed/lamp/400/300',
    time: '1h ago'
  },
  {
    id: 3,
    title: 'Data Structures Textbook',
    price: 25.00,
    category: 'Books',
    seller: 'Academic Source',
    rating: 5.0,
    image: 'https://picsum.photos/seed/book/400/300',
    time: '3h ago'
  },
  {
    id: 4,
    title: 'iPhone 13 Case (New)',
    price: 8.00,
    category: 'Electronics',
    seller: 'Linh T.',
    rating: 4.2,
    image: 'https://picsum.photos/seed/phone/400/300',
    time: '5h ago'
  },
  {
    id: 5,
    title: 'Laundry Service',
    price: 12.00,
    category: 'Services',
    seller: 'EcoWash',
    rating: 4.9,
    image: 'https://picsum.photos/seed/wash/400/300',
    time: 'Yesterday'
  },
  {
    id: 6,
    title: 'Gaming Keyboard',
    price: 45.00,
    category: 'Electronics',
    seller: 'GamersHub',
    rating: 4.7,
    image: 'https://picsum.photos/seed/keyboard/400/300',
    time: '2d ago'
  }
]

export function MarketplaceView() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [view, setView] = useState<'Market' | 'Orders'>('Market')

  const filteredProducts = selectedCategory === 'All' 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === selectedCategory)

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h3 className="text-2xl font-black text-[#4D5D53] tracking-tight">Marketplace</h3>
        <div className="flex bg-white p-1.5 rounded-2xl border border-[#F0F0EE] shadow-sm">
          <button 
            onClick={() => setView('Market')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'Market' ? 'bg-[#4D5D53] text-white shadow-lg' : 'text-[#9A9A9A] hover:bg-[#FAF9F6]'}`}
          >
            Browse Market
          </button>
          <button 
            onClick={() => setView('Orders')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'Orders' ? 'bg-[#4D5D53] text-white shadow-lg' : 'text-[#9A9A9A] hover:bg-[#FAF9F6]'}`}
          >
            My Orders
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'Market' ? (
          <motion.div
            key="market"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Search & New Listing */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#BDBDBD]" />
                <input 
                  type="text" 
                  placeholder="What are you looking for?"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-[#EFEFE9] rounded-2xl outline-none focus:border-[#D4A373] focus:ring-4 focus:ring-[#D4A373]/5 shadow-sm transition-all"
                />
              </div>
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full md:w-auto px-8 py-4 bg-[#4D5D53] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#4D5D53]/20 hover:bg-[#3D4D43] transition-all"
              >
                <Plus className="h-5 w-5" />
                Create Listing
              </motion.button>
            </div>

      {/* Categories */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((cat, idx) => (
          <motion.button
            key={cat}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-[0.15em] whitespace-nowrap transition-all border-2 ${
              selectedCategory === cat 
              ? 'bg-[#E9EDC9] border-[#E9EDC9] text-[#4D5D53] shadow-md' 
              : 'bg-white border-[#F0F0EE] text-[#9A9A9A] hover:border-[#E9EDC9] hover:text-[#4D5D53]'
            }`}
          >
            {cat}
          </motion.button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((product, idx) => (
            <motion.div
              layout
              key={product.id}
              initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
              transition={{ duration: 0.8, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="group cursor-pointer"
            >
              <div className="bg-white rounded-[2.5rem] p-4 border border-[#F0F0EE] shadow-sm hover:border-[#D4A373]/30 hover:bg-[#FAF9F6]/50 transition-all duration-700 overflow-hidden relative hover:shadow-2xl hover:shadow-[#D4A373]/10">
                {/* Image Wrap */}
                <div className="aspect-[4/3] rounded-[1.75rem] overflow-hidden mb-5 relative bg-[#F4F4F2]">
                  <Image 
                    src={product.image} 
                    alt={product.title}
                    fill
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-700" />
                  
                  {/* Category Tag */}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-white/50 text-[8px] font-black uppercase tracking-widest text-[#4D5D53] transform transition-transform group-hover:translate-x-1 group-hover:translate-y-1">
                    {product.category}
                  </div>

                  {/* Rating */}
                  <div className="absolute bottom-4 right-4 bg-[#4D5D53]/90 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold flex items-center gap-1 transform transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {product.rating}
                  </div>
                </div>

                <div className="px-2 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-bold text-[#4D5D53] tracking-tight line-clamp-1 group-hover:text-[#D4A373] transition-colors">{product.title}</h4>
                      <p className="text-[10px] text-[#9A9A9A] font-bold flex items-center gap-1.5 mt-0.5">
                        <Tag className="h-3 w-3" />
                        By {product.seller}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-[#4D5D53] tracking-tighter">${product.price.toFixed(2)}</p>
                      <p className="text-[9px] text-[#D4A373] font-black uppercase tracking-widest mt-0.5">{product.time}</p>
                    </div>
                  </div>

                  <div className="h-[1px] bg-emerald-900/5 w-full transition-all group-hover:bg-[#D4A373]/20" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] font-black text-[#79837C] group-hover:text-[#4D5D53] transition-colors uppercase tracking-widest">
                      <Clock className="h-3 w-3" />
                      Limited Stock
                    </div>
                    <div className="w-10 h-10 bg-[#FAF9F6] rounded-xl flex items-center justify-center text-[#BDBDBD] border border-[#EFEFE9] group-hover:bg-[#D4A373] group-hover:text-white group-hover:border-[#D4A373] group-hover:rotate-12 transition-all duration-500">
                      <ArrowUpRight className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

        {filteredProducts.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 bg-[#F4F4F2] rounded-[2rem] flex items-center justify-center text-[#BDBDBD]">
              <ShoppingBag className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#4D5D53]">No items found</h3>
              <p className="text-sm text-[#9A9A9A]">Try another category or search term.</p>
            </div>
          </div>
        )}
          </motion.div>
        ) : (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {[
              { id: 'ORD-5521', item: 'Homemade Thai Curry', status: 'Confirmed', date: 'Today', price: '$6.50', color: 'text-blue-500 bg-blue-50' },
              { id: 'ORD-5490', item: 'Data Structures Textbook', status: 'Delivered', date: 'Oct 25', price: '$25.00', color: 'text-emerald-500 bg-emerald-50' },
              { id: 'ORD-5481', item: 'iPhone 13 Case', status: 'Ready', date: 'Oct 24', price: '$8.00', color: 'text-orange-500 bg-orange-50' }
            ].map((order, idx) => (
              <motion.div 
                key={order.id} 
                initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white p-6 rounded-[2.5rem] border border-[#F0F0EE] shadow-sm flex items-center justify-between group hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-[#FAF9F6] rounded-2xl flex items-center justify-center text-[#D4A373] group-hover:rotate-6 transition-all">
                     <ShoppingBag className="h-8 w-8" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest">{order.id}</span>
                    <h4 className="font-bold text-[#4D5D53] tracking-tight">{order.item}</h4>
                    <p className="text-[10px] text-[#9A9A9A] font-bold">{order.date} • {order.price}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                   <div className="text-right hidden sm:block">
                      <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${order.color}`}>
                        {order.status}
                      </div>
                   </div>
                   <ArrowUpRight className="h-5 w-5 text-[#BDBDBD] group-hover:text-[#D4A373] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
