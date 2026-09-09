'use client'

import { motion } from 'motion/react'
import { useState } from 'react'
import { marketplaceApi } from '@/lib/api'

const CATEGORIES = ['Electronics', 'Books', 'Clothing', 'Food', 'Other']

export function CreateListingForm({
  onDone,
  onCancel,
}: {
  onDone: (success: boolean, message?: string) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    try {
      setLoading(true)
      setError(null)
      const res = await marketplaceApi.createListing(
        title,
        description,
        category,
        parseFloat(price || '0'),
        parseInt(quantity || '1', 10),
      )
      if (res.data?.success) {
        onDone(true, res.data?.message || 'Listing created successfully')
      } else {
        const message = res.data?.message || 'Failed to create'
        setError(message)
        onDone(false, message)
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Network error'
      setError(message)
      onDone(false, message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="listing-title" className="text-sm font-black">
          Title
        </label>
        <input
          id="listing-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 rounded-xl border focus:border-[#D4A373] outline-none"
          placeholder="Item Name"
          required
        />
      </div>

      <div>
        <label htmlFor="listing-description" className="text-sm font-black">
          Description
        </label>
        <textarea
          id="listing-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 rounded-xl border focus:border-[#D4A373] outline-none"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <select
          aria-label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="p-3 rounded-xl border focus:border-[#D4A373] outline-none"
          required
        >
          <option value="">Select category</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          aria-label="Price in rupees"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price (Rs)"
          type="number"
          min="0"
          className="p-3 rounded-xl border focus:border-[#D4A373] outline-none"
          required
        />
      </div>

      <div>
        <label htmlFor="listing-quantity" className="text-sm font-black">
          Quantity
        </label>
        <input
          id="listing-quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          type="number"
          min="1"
          className="w-full p-3 rounded-xl border focus:border-[#D4A373] outline-none"
          required
        />
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="flex justify-end gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border"
        >
          Cancel
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-[#4D5D53] text-white rounded-xl disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create'}
        </motion.button>
      </div>
    </form>
  )
}
