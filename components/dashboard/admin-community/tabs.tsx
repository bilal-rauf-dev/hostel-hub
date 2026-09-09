'use client'

import { motion } from 'motion/react'
import { Plus, Trash2 } from 'lucide-react'
import type {
  CommunityPost,
  GuidebookEntry,
  HostelEvent,
  Poll,
} from '@/lib/types'

const CARD =
  'bg-white p-6 rounded-3xl border border-[#F0F0EE] shadow-sm cursor-pointer hover:shadow-md transition-shadow'
const COUNT =
  'text-[10px] font-black uppercase tracking-widest text-[#9A9A9A]'
const EMPTY =
  'p-8 text-sm text-[#9A9A9A] bg-white rounded-3xl border border-[#F0F0EE]'

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex items-center gap-2 px-5 py-2.5 bg-[#4D5D53] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4D5D53] focus-visible:ring-offset-2"
    >
      <Plus className="h-3.5 w-3.5" aria-hidden="true" /> {label}
    </motion.button>
  )
}

function DeleteButton({
  label,
  onClick,
}: {
  label: string
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-label={label}
      className="p-2.5 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
    </motion.button>
  )
}

export function PostsTab({
  posts,
  onSelect,
  onDelete,
}: {
  posts: CommunityPost[]
  onSelect: (post: CommunityPost) => void
  onDelete: (postId: number) => void
}) {
  return (
    <div className="space-y-4">
      <p className={COUNT}>{posts.length} total posts</p>

      {posts.length === 0 ? (
        <div className={EMPTY}>No posts yet.</div>
      ) : (
        posts.map((post) => (
          <div
            key={post.post_id}
            onClick={() => onSelect(post)}
            className={`${CARD} flex items-start justify-between gap-4`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest">
                  {post.author_name ?? post.display_name}
                </span>
                <span className="text-[10px] text-[#9A9A9A]">
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
                <span className="text-[10px] text-[#9A9A9A]">
                  • {post.like_count ?? 0} likes
                </span>
              </div>
              <p className="text-sm text-[#4D5D53] line-clamp-2">
                {post.content}
              </p>
            </div>
            <DeleteButton
              label="Delete post"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(post.post_id)
              }}
            />
          </div>
        ))
      )}
    </div>
  )
}

export function PollsTab({
  polls,
  onSelect,
  onCreate,
}: {
  polls: Poll[]
  onSelect: (poll: Poll) => void
  onCreate: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className={COUNT}>{polls.length} active polls</p>
        <AddButton label="Create Poll" onClick={onCreate} />
      </div>

      {polls.length === 0 ? (
        <div className={EMPTY}>No active polls.</div>
      ) : (
        polls.map((poll) => (
          <div key={poll.poll_id} onClick={() => onSelect(poll)} className={CARD}>
            <p className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest mb-1">
              Poll #{poll.poll_id}
            </p>
            <h4 className="font-black text-[#4D5D53] mb-3">{poll.question}</h4>
            <div className="flex flex-wrap gap-2">
              {(poll.options ?? []).map((opt) => (
                <span
                  key={opt.option_id}
                  className="px-3 py-1 bg-[#FAF9F6] border border-[#F0F0EE] rounded-full text-[10px] font-bold text-[#79837C]"
                >
                  {opt.option_text}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-[#9A9A9A] mt-3">
              Deadline:{' '}
              {poll.deadline
                ? new Date(poll.deadline).toLocaleDateString()
                : 'None'}
            </p>
          </div>
        ))
      )}
    </div>
  )
}

export function EventsTab({
  events,
  onSelect,
  onCreate,
}: {
  events: HostelEvent[]
  onSelect: (event: HostelEvent) => void
  onCreate: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className={COUNT}>{events.length} upcoming events</p>
        <AddButton label="Create Event" onClick={onCreate} />
      </div>

      {events.length === 0 ? (
        <div className={EMPTY}>No upcoming events.</div>
      ) : (
        events.map((event) => (
          <div
            key={event.event_id}
            onClick={() => onSelect(event)}
            className={`${CARD} flex items-center justify-between`}
          >
            <div>
              <p className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest mb-1">
                {new Date(event.event_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <h4 className="font-black text-[#4D5D53]">{event.title}</h4>
              <p className="text-[10px] text-[#9A9A9A] mt-1">{event.location}</p>
            </div>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">
              {event.attendees ?? 0} going
            </span>
          </div>
        ))
      )}
    </div>
  )
}

export function GuidebookTab({
  entries,
  onSelect,
  onCreate,
  onDelete,
}: {
  entries: GuidebookEntry[]
  onSelect: (entry: GuidebookEntry) => void
  onCreate: () => void
  onDelete: (entryId: number) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className={COUNT}>{entries.length} entries</p>
        <AddButton label="Add Entry" onClick={onCreate} />
      </div>

      {entries.length === 0 ? (
        <div className={EMPTY}>No guidebook entries.</div>
      ) : (
        entries.map((entry) => (
          <div
            key={entry.entry_id}
            onClick={() => onSelect(entry)}
            className={`${CARD} flex items-start justify-between gap-4`}
          >
            <div>
              <p className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest mb-1">
                {entry.category}
              </p>
              <h4 className="font-black text-[#4D5D53]">{entry.title}</h4>
              <p className="text-xs text-[#9A9A9A] mt-1 line-clamp-2">
                {entry.content}
              </p>
            </div>
            <DeleteButton
              label="Delete entry"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(entry.entry_id)
              }}
            />
          </div>
        ))
      )}
    </div>
  )
}
