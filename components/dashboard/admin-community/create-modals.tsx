'use client'

import { useState } from 'react'
import { eventsApi, guidebookApi, pollsApi } from '@/lib/api'
import { ModalShell } from '@/components/ui/modal-shell'

const INPUT = 'w-full p-3 border rounded-xl text-sm'
const CANCEL = 'px-4 py-2 border rounded-xl text-sm'
const SUBMIT =
  'px-4 py-2 bg-[#4D5D53] text-white rounded-xl text-sm font-bold disabled:opacity-50'

type Toast = (msg: string, type: 'success' | 'error' | 'info') => void

export function CreatePollModal({
  open,
  onClose,
  onCreated,
  onToast,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => Promise<void>
  onToast: Toast
}) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setQuestion('')
    setOptions(['', ''])
    setDeadline('')
  }

  const submit = async () => {
    const opts = options.filter((o) => o.trim())
    if (!question.trim() || opts.length < 2 || !deadline) {
      onToast('Fill in all fields and at least 2 options', 'error')
      return
    }
    try {
      setSaving(true)
      const res = await pollsApi.createPoll(question, opts, deadline)
      if (res.data?.success) {
        await onCreated()
        reset()
        onClose()
        onToast('Poll created', 'success')
      } else {
        onToast(res.data?.message || 'Could not create the poll', 'error')
      }
    } catch (e: any) {
      onToast(e?.message || 'Could not create the poll', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} labelledBy="create-poll-title" className="max-w-lg p-6 rounded-2xl">
      <h4 id="create-poll-title" className="text-lg font-black mb-4">
        Create Poll
      </h4>

      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Poll question"
        aria-label="Poll question"
        className={`${INPUT} mb-3`}
      />

      <div className="space-y-2 mb-3">
        {options.map((opt, idx) => (
          <div key={idx} className="flex gap-2">
            <input
              value={opt}
              onChange={(e) =>
                setOptions((prev) =>
                  prev.map((o, i) => (i === idx ? e.target.value : o)),
                )
              }
              placeholder={`Option ${idx + 1}`}
              aria-label={`Option ${idx + 1}`}
              className="flex-1 p-2.5 border rounded-xl text-sm"
            />
            <button
              type="button"
              onClick={() =>
                setOptions((prev) =>
                  prev.length > 2 ? prev.filter((_, i) => i !== idx) : prev,
                )
              }
              disabled={options.length <= 2}
              aria-label={`Remove option ${idx + 1}`}
              className="px-3 bg-red-50 text-red-500 rounded-xl text-sm disabled:opacity-30"
            >
              &minus;
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setOptions((prev) => (prev.length < 5 ? [...prev, ''] : prev))}
          disabled={options.length >= 5}
          className="px-3 py-1.5 bg-[#FAF9F6] rounded-xl text-xs font-bold disabled:opacity-30"
        >
          + Add option
        </button>
      </div>

      <label
        htmlFor="poll-deadline"
        className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A]"
      >
        Deadline
      </label>
      <input
        id="poll-deadline"
        type="datetime-local"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        className="w-full p-2.5 border rounded-xl mt-1 mb-4 text-sm"
      />

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className={CANCEL}>
          Cancel
        </button>
        <button type="button" disabled={saving} onClick={submit} className={SUBMIT}>
          {saving ? 'Creating...' : 'Create'}
        </button>
      </div>
    </ModalShell>
  )
}

export function CreateEventModal({
  open,
  onClose,
  onCreated,
  onToast,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => Promise<void>
  onToast: Toast
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!title.trim() || !location.trim() || !date) {
      onToast('Fill in title, location and date', 'error')
      return
    }
    try {
      setSaving(true)
      const when = time ? `${date}T${time}` : `${date}T00:00`
      const res = await eventsApi.createEvent(title, description, location, when)
      if (res.data?.success) {
        await onCreated()
        setTitle('')
        setDescription('')
        setLocation('')
        setDate('')
        setTime('')
        onClose()
        onToast('Event created', 'success')
      } else {
        onToast(res.data?.message || 'Could not create the event', 'error')
      }
    } catch (e: any) {
      onToast(
        e?.response?.data?.detail || e?.message || 'Could not create the event',
        'error',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} labelledBy="create-event-title" className="max-w-lg p-6 rounded-2xl">
      <h4 id="create-event-title" className="text-lg font-black mb-4">
        Create Event
      </h4>

      <div className="space-y-3 mb-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          aria-label="Event title"
          className={INPUT}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          aria-label="Description"
          className={`${INPUT} h-20 resize-none`}
        />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          aria-label="Location"
          className={INPUT}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Date"
            className="p-3 border rounded-xl text-sm"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            aria-label="Time"
            className="p-3 border rounded-xl text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className={CANCEL}>
          Cancel
        </button>
        <button type="button" disabled={saving} onClick={submit} className={SUBMIT}>
          {saving ? 'Creating...' : 'Create'}
        </button>
      </div>
    </ModalShell>
  )
}

export function CreateGuidebookModal({
  open,
  onClose,
  onCreated,
  onToast,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => Promise<void>
  onToast: Toast
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!title.trim() || !content.trim() || !category) {
      onToast('Fill in title, content and category', 'error')
      return
    }
    try {
      setSaving(true)
      const res = await guidebookApi.createEntry(title, content, category)
      if (res.data?.success) {
        await onCreated()
        setTitle('')
        setContent('')
        setCategory('')
        onClose()
        onToast('Entry added', 'success')
      } else {
        onToast(res.data?.message || 'Could not add the entry', 'error')
      }
    } catch (e: any) {
      onToast(e?.message || 'Could not add the entry', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} labelledBy="create-guide-title" className="max-w-lg p-6 rounded-2xl">
      <h4 id="create-guide-title" className="text-lg font-black mb-4">
        Add Guidebook Entry
      </h4>

      <div className="space-y-3 mb-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Entry title"
          aria-label="Entry title"
          className={INPUT}
        />
        {/* guidebook_category is an enum in the schema, so this is a select. */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Category"
          className={INPUT}
        >
          <option value="">Select category</option>
          <option value="rules">Rules</option>
          <option value="faqs">FAQs</option>
          <option value="emergency_contacts">Emergency contacts</option>
        </select>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Content"
          aria-label="Content"
          className={`${INPUT} h-32 resize-none`}
        />
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className={CANCEL}>
          Cancel
        </button>
        <button type="button" disabled={saving} onClick={submit} className={SUBMIT}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </ModalShell>
  )
}
