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
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { marketplaceApi } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'

function CreateListingForm({ onDone, onCancel }: { onDone: (success: boolean, message?: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState('1')

  const handleSubmit = async (e?: any) => {
    if (e && e.preventDefault) e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      const res = await marketplaceApi.createListing(title, description, category, parseFloat(price || '0'), parseInt(quantity || '1', 10))
      if (res.data?.success) {
        onDone(true, res.data?.message || 'Listing created successfully')
      } else {
        const message = res.data?.message || 'Failed to create'
        setError(message)
        onDone(false, message)
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Network error'
      setError(message)
      onDone(false, message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-black">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 rounded-lg border" />
      </div>
      <div>
        <label className="text-sm font-black">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 rounded-lg border" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="p-3 rounded-lg border">
          <option value="">Select category</option>
          <option value="Food & Drinks">Food & Drinks</option>
          <option value="Stationery">Stationery</option>
          <option value="Electronics">Electronics</option>
          <option value="Clothing">Clothing</option>
          <option value="Books">Books</option>
          <option value="Services">Services</option>
          <option value="Transport">Transport</option>
          <option value="Other">Other</option>
        </select>
        <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" type="number" className="p-3 rounded-lg border" />
      </div>
      <div>
        <label className="text-sm font-black">Quantity</label>
        <input value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" min="1" className="w-full p-3 rounded-lg border" />
      </div>
      {error && <div className="text-red-500">{error}</div>}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => { onCancel(); }} className="px-4 py-2 rounded-xl border">Cancel</button>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-[#4D5D53] text-white rounded-xl">{loading ? 'Creating...' : 'Create'}</button>
      </div>
    </form>
  )
}

export function MarketplaceView() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [view, setView] = useState<'Market' | 'Orders' | 'Listings'>('Market')
  const [listings, setListings] = useState<any[]>([])
  const currentUser = getCurrentUser()
  const [orders, setOrders] = useState<any[]>([])
  const [receivedOrders, setReceivedOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  const [quantityModal, setQuantityModal] = useState<{ visible: boolean; listing?: any }>({ visible: false })
  const [quantityValue, setQuantityValue] = useState(1)
  const [orderDetailModal, setOrderDetailModal] = useState<{ visible: boolean; order?: any }>({ visible: false })

  const pushToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handlePlaceOrder = async () => {
    if (!quantityModal.listing) return
    try {
      const res = await marketplaceApi.placeOrder(quantityModal.listing.listing_id, quantityValue)
      if (res.data?.success) {
        pushToast('Order placed successfully', 'success')
        setQuantityModal({ visible: false })
        setQuantityValue(1)
        await loadMarketplace()
      } else {
      setQuantityModal({ visible: false })
        pushToast(res.data?.message || 'Failed to place order', 'error')
      }
    } catch (err: any) {
      setQuantityModal({ visible: false })
      setQuantityValue(1)
      pushToast(err?.response?.data?.message || err?.message || 'Network error', 'error')
    }
  }

  const loadMarketplace = async () => {
    const [listRes, ordersRes, receivedRes] = await Promise.all([
      marketplaceApi.getListings(search, selectedCategory === 'All' ? undefined : selectedCategory),
      marketplaceApi.getMyOrders(),
      marketplaceApi.getReceivedOrders(),
    ])

    if (listRes.data?.success) setListings(listRes.data.data || [])
    if (ordersRes.data?.success) setOrders(ordersRes.data.data || [])
    if (receivedRes.data?.success) setReceivedOrders(receivedRes.data.data || [])
  }

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const [listRes, ordersRes, receivedRes] = await Promise.all([
          marketplaceApi.getListings(search, selectedCategory === 'All' ? undefined : selectedCategory),
          marketplaceApi.getMyOrders(),
          marketplaceApi.getReceivedOrders(),
        ])
        if (!mounted) return
        if (listRes.data?.success) setListings(listRes.data.data || [])
        if (ordersRes.data?.success) setOrders(ordersRes.data.data || [])
        if (receivedRes.data?.success) setReceivedOrders(receivedRes.data.data || [])
      } catch (err: any) {
        setError(err?.message || 'Failed to load marketplace')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [selectedCategory, search])

  const categories = ['All', ...Array.from(new Set(listings.map(l => l.category).filter(Boolean)))]

  const filteredProducts = selectedCategory === 'All' ? listings : listings.filter(p => p.category === selectedCategory)

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
  onClick={async () => { setView('Market'); await loadMarketplace() }}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'Market' ? 'bg-[#4D5D53] text-white shadow-lg' : 'text-[#9A9A9A] hover:bg-[#FAF9F6]'}`}
          >
            Browse Market
          </button>
          <button 
  onClick={async () => { setView('Orders'); await loadMarketplace() }}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'Orders' ? 'bg-[#4D5D53] text-white shadow-lg' : 'text-[#9A9A9A] hover:bg-[#FAF9F6]'}`}
          >
            My Orders
          </button>
          <button
            onClick={async () => { setView('Listings'); await loadMarketplace() }}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'Listings' ? 'bg-[#4D5D53] text-white shadow-lg' : 'text-[#9A9A9A] hover:bg-[#FAF9F6]'}`}
          >
            My Listings
          </button>
        </div>
      </div>

      {toast && (
        <div className={`p-3 rounded-lg text-sm ${toast.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {toast.message}
        </div>
      )}

      {/* Create Listing Modal */}
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
              className="relative bg-white p-6 rounded-2xl w-full max-w-lg mx-4 shadow-2xl z-10"
            >
              <h4 className="text-lg font-black mb-4">Create Listing</h4>
              <CreateListingForm
                onDone={async (success, message) => {
                  if (success) {
                    pushToast(message || 'Listing created successfully', 'success')
                    setCreating(false)
                    try {
                      await loadMarketplace()
                    } catch (err: any) {
                      pushToast(err?.message || 'Failed to refresh listings', 'error')
                    }
                  } else {
                    pushToast(message || 'Failed to create listing', 'error')
                  }
                }}
                onCancel={() => setCreating(false)}
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Quantity Selector Modal */}
      {quantityModal.visible && quantityModal.listing && createPortal(
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
              onClick={() => setQuantityModal({ visible: false })}
            />
            <motion.div
              key="modal-content"
              initial={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-white p-6 rounded-2xl w-full max-w-sm mx-4 shadow-2xl z-10"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden relative shrink-0 bg-[#F4F4F2]">
                  <Image
                    src={`https://picsum.photos/seed/${quantityModal.listing.listing_id}/400/300`}
                    alt={quantityModal.listing.title}
                    fill
                    unoptimized
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h4 className="text-lg font-black">How many do you want?</h4>
                  <p className="text-sm text-[#9A9A9A]">{quantityModal.listing.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setQuantityValue(Math.max(1, quantityValue - 1))} className="px-4 py-2 bg-[#FAF9F6] rounded-lg border">-</button>
                <input type="number" min="1" max={parseInt(quantityModal?.listing?.quantity) || 99} value={quantityValue.toString()} onChange={(e) => setQuantityValue(Math.min(parseInt(quantityModal?.listing?.quantity) || 99, Math.max(1, parseInt(e.target.value) || 1)))} className="flex-1 p-3 border rounded-lg text-center text-lg font-bold" />
                <button onClick={() => setQuantityValue(Math.min(parseInt(quantityModal?.listing?.quantity) || 99, quantityValue + 1))} className="px-4 py-2 bg-[#FAF9F6] rounded-lg border">+</button>
              </div>
              <p className="text-sm text-[#9A9A9A] mb-4">Max available: {parseInt(quantityModal?.listing?.quantity) || 99}</p>
              <p className="text-lg font-black text-[#4D5D53] mb-6">Total: ${(quantityValue * (quantityModal.listing.price || 0)).toFixed(2)}</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setQuantityModal({ visible: false })} className="px-4 py-2 rounded-xl border">Cancel</button>
                <button onClick={handlePlaceOrder} className="px-4 py-2 bg-[#4D5D53] text-white rounded-xl">Confirm</button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Order Detail Modal */}
      {orderDetailModal.visible && orderDetailModal.order && createPortal(
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
              onClick={() => setOrderDetailModal({ visible: false })}
            />
            <motion.div
              key="modal-content"
              initial={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-white p-6 rounded-2xl w-full max-w-lg mx-4 shadow-2xl z-10"
            >
              <h4 className="text-lg font-black mb-6">Order Details</h4>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b">
                  <span className="text-sm text-[#9A9A9A]">Item</span>
                  <span className="font-bold">{orderDetailModal.order.item_title || orderDetailModal.order.listing_title || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-3 border-b">
                  <span className="text-sm text-[#9A9A9A]">Quantity</span>
                  <span className="font-bold">{orderDetailModal.order.quantity || orderDetailModal.order.qty || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-3 border-b">
                  <span className="text-sm text-[#9A9A9A]">Total Price</span>
                  <span className="font-bold">${orderDetailModal.order.total_price || orderDetailModal.order.price || '0.00'}</span>
                </div>
                <div className="flex justify-between py-3 border-b">
                  <span className="text-sm text-[#9A9A9A]">Seller</span>
                  <span className="font-bold">{orderDetailModal.order.seller_display_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-3 border-b">
                  <span className="text-sm text-[#9A9A9A]">Status</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                    orderDetailModal.order.status === 'fulfilled' || orderDetailModal.order.status === 'delivered' || orderDetailModal.order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' 
                    : orderDetailModal.order.status === 'cancelled' || orderDetailModal.order.status === 'Cancelled' ? 'bg-red-50 text-red-500' 
                    : 'bg-blue-50 text-blue-600'
                  }`}>{orderDetailModal.order.status || 'Pending'}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-sm text-[#9A9A9A]">Order Date</span>
                  <span className="font-bold">{orderDetailModal.order.created_at || orderDetailModal.order.date || 'N/A'}</span>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setOrderDetailModal({ visible: false })} className="px-4 py-2 rounded-xl border">Close</button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

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
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="What are you looking for?"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-[#EFEFE9] rounded-2xl outline-none focus:border-[#D4A373] focus:ring-4 focus:ring-[#D4A373]/5 shadow-sm transition-all"
                />
              </div>
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCreating(true)}
                className="w-full md:w-auto px-8 py-4 bg-[#4D5D53] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#4D5D53]/20 hover:bg-[#3D4D43] transition-all"
              >
                <Plus className="h-5 w-5" />
                Create Listing
              </motion.button>
            </div>
      {/* Categories */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat, idx) => (
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
              key={product.listing_id}
              initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
              transition={{ duration: 0.8, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="group cursor-pointer"
              onClick={() => { if (product.seller_id !== currentUser?.user_id) { setQuantityModal({ visible: true, listing: product }); setQuantityValue(1) } }}
            >
              <div className="bg-white rounded-[2.5rem] p-4 border border-[#F0F0EE] shadow-sm hover:border-[#D4A373]/30 hover:bg-[#FAF9F6]/50 transition-all duration-700 overflow-hidden relative hover:shadow-2xl hover:shadow-[#D4A373]/10">
                {/* Image Wrap */}
                <div className="aspect-[4/3] rounded-[1.75rem] overflow-hidden mb-5 relative bg-[#F4F4F2]">
                  <Image unoptimized 
                    src={`https://picsum.photos/seed/${product.listing_id}/400/300`}
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

                  {/* Stock Badge */}
                  <div className="absolute bottom-4 right-4 bg-[#4D5D53]/90 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold flex items-center gap-1 transform transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {product.quantity} left
                  </div>
                </div>

                <div className="px-2 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-bold text-[#4D5D53] tracking-tight line-clamp-1 group-hover:text-[#D4A373] transition-colors">{product.title}</h4>
                      <p className="text-[10px] text-[#9A9A9A] font-bold flex items-center gap-1.5 mt-0.5">
                        <Tag className="h-3 w-3" />
                        By {product.seller_display_name || 'Unknown'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-[#4D5D53] tracking-tighter">${product.price}</p>
                      {product.seller_id === currentUser?.user_id
                        ? <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest mt-0.5">Your Item</p>
                        : <p className="text-[9px] text-[#D4A373] font-black uppercase tracking-widest mt-0.5">{product.status}</p>
                      }
                    </div>
                  </div>

                  <div className="h-[1px] bg-emerald-900/5 w-full transition-all group-hover:bg-[#D4A373]/20" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] font-black text-[#79837C] group-hover:text-[#4D5D53] transition-colors uppercase tracking-widest">
                      <Clock className="h-3 w-3" />
                      Limited Stock
                    </div>
                    {product.seller_id !== currentUser?.user_id && (
                    <div
                      onClick={(e) => { e.stopPropagation(); setQuantityModal({ visible: true, listing: product }); setQuantityValue(1) }}
                      className="w-10 h-10 bg-[#FAF9F6] rounded-xl flex items-center justify-center text-[#BDBDBD] border border-[#EFEFE9] group-hover:bg-[#D4A373] group-hover:text-white group-hover:border-[#D4A373] group-hover:rotate-12 transition-all duration-500"
                    >
                      <ArrowUpRight className="h-5 w-5" />
                    </div>
                    )}
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
      ) : view === 'Listings' ? (
        <motion.div
          key="listings"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-6"
        >
          {listings.filter(l => l.seller_id === currentUser?.user_id).length === 0 ? (
            <div className="p-6 text-sm text-[#9A9A9A]">You have no active listings.</div>
          ) : (
            listings.filter(l => l.seller_id === currentUser?.user_id).map((listing, idx) => (
              <div key={listing.listing_id || idx} className="bg-white p-6 rounded-[2.5rem] border border-[#F0F0EE] shadow-sm flex items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden relative shrink-0 bg-[#F4F4F2]">
                    <Image
                      src={`https://picsum.photos/seed/${listing.listing_id}/400/300`}
                      alt={listing.title}
                      fill unoptimized
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest">{listing.category}</span>
                    <h4 className="font-bold text-[#4D5D53]">{listing.title}</h4>
                    <p className="text-[10px] text-[#9A9A9A] font-bold">${listing.price} • {listing.quantity} remaining</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600">
                    {listing.status}
                  </div>
                </div>
              </div>
            ))
          )}
          
          <div className="mt-10">
            <h4 className="text-sm font-black uppercase tracking-widest text-[#4D5D53] mb-4">
              Received Orders
            </h4>
            {receivedOrders.length === 0 ? (
              <div className="p-6 text-sm text-[#9A9A9A]">No orders received yet.</div>
            ) : (
              receivedOrders.map((order, idx) => (
                <div key={order.order_id || idx}
                  className="bg-white p-5 rounded-3xl border border-[#F0F0EE] shadow-sm flex items-center justify-between gap-4 mb-3"
                >
                  <div>
                    <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest">
                      Order #{order.order_id}
                    </span>
                    <h4 className="font-bold text-[#4D5D53]">{order.item_title}</h4>
                    <p className="text-[10px] text-[#9A9A9A] font-bold">
                      By {order.buyer_display_name} • Qty: {order.quantity} • ${order.total_price}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      order.status === 'fulfilled' || order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600'
                      : order.status === 'confirmed' ? 'bg-blue-50 text-blue-600'
                      : order.status === 'cancelled' ? 'bg-red-50 text-red-500'
                      : 'bg-orange-50 text-orange-500'
                    }`}>
                      {order.status}
                    </span>
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={async () => {
                            await marketplaceApi.updateOrderStatus(order.order_id, 'confirmed')
                            await loadMarketplace()
                            pushToast('Order confirmed — buyer notified', 'success')
                          }}
                          className="px-3 py-1.5 bg-[#4D5D53] text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={async () => {
                            await marketplaceApi.updateOrderStatus(order.order_id, 'cancelled')
                            await loadMarketplace()
                            pushToast('Order cancelled', 'error')
                          }}
                          className="px-3 py-1.5 border border-red-500 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {order.status === 'confirmed' && (
                      <>
                        <button
                          onClick={async () => {
                            await marketplaceApi.updateOrderStatus(order.order_id, 'delivered')
                            await loadMarketplace()
                            pushToast('Order marked as delivered', 'success')
                          }}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          Deliver
                        </button>
                        <button
                          onClick={async () => {
                            await marketplaceApi.updateOrderStatus(order.order_id, 'cancelled')
                            await loadMarketplace()
                            pushToast('Order cancelled', 'error')
                          }}
                          className="px-3 py-1.5 border border-red-500 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="orders"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-6"
        >
          {orders.length === 0 ? (
            <div className="p-6 text-sm text-[#9A9A9A]">No orders yet.</div>
          ) : (
            orders.map((order, idx) => (
              <div
                key={order.order_id || idx}
                onClick={() => setOrderDetailModal({ visible: true, order })}
                className="bg-white p-6 rounded-[2.5rem] border border-[#F0F0EE] shadow-sm flex items-center justify-between group hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-[#FAF9F6] rounded-2xl flex items-center justify-center text-[#D4A373] group-hover:rotate-6 transition-all">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest">
                      {order.order_number || order.order_id}
                    </span>
                    <h4 className="font-bold text-[#4D5D53] tracking-tight">
                      {order.item_title || order.listing_title || order.item_name}
                    </h4>
                    <p className="text-[10px] text-[#9A9A9A] font-bold">
                      {order.created_at || order.date} • ${order.total_price ?? order.price}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right hidden sm:block">
                    <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      order.status === 'fulfilled' || order.status === 'delivered'
                        ? 'text-emerald-500 bg-emerald-50'
                        : order.status === 'cancelled'
                        ? 'text-red-500 bg-red-50'
                        : 'text-blue-500 bg-blue-50'
                    }`}>
                      {order.status}
                    </div>
                  </div>
                  {(order.status === 'pending' || order.status === 'confirmed') && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        await marketplaceApi.updateOrderStatus(order.order_id, 'cancelled')
                        await loadMarketplace()
                        pushToast('Order cancelled', 'error')
                      }}
                      className="px-3 py-1.5 border border-red-500 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50"
                    >
                      Cancel
                    </button>
                  )}
                  <ArrowUpRight className="h-5 w-5 text-[#BDBDBD] group-hover:text-[#D4A373] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                </div>
              </div>
            ))
          )}
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
  )
}
