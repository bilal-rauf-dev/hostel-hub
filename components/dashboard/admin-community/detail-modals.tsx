'use client'

import { motion } from 'motion/react'
import { Trash2 } from 'lucide-react'
import { ModalShell } from '@/components/ui/modal-shell'
import type {
  CommunityPost,
  GuidebookEntry,
  HostelEvent,
  Poll,
} from '@/lib/types'
import type { PollResults } from '@/hooks/use-admin-community-data'

function DeleteAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
    >
      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> {label}
    </motion.button>
  )
}

const PANEL = 'max-w-lg p-8 rounded-[2.5rem]'

export function PostDetailModal({
  post,
  onClose,
  onDelete,
}: {
  post: CommunityPost | null
  onClose: () => void
  onDelete: (postId: number) => void
}) {
  return (
    <ModalShell open={!!post} onClose={onClose} labelledBy="post-detail-title" className={PANEL}>
      {post && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest">
              {post.author_name ?? post.display_name}
            </span>
            <span className="text-[10px] text-[#9A9A9A]">
              {new Date(post.created_at).toLocaleString()}
            </span>
          </div>

          <h4 id="post-detail-title" className="sr-only">
            Post detail
          </h4>
          <p className="text-sm text-[#4D5D53] whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>

          <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#F0F0EE]">
            <p className="text-[10px] text-[#9A9A9A] font-bold uppercase tracking-widest">
              {post.like_count ?? 0} likes
            </p>
            <DeleteAction label="Delete Post" onClick={() => onDelete(post.post_id)} />
          </div>
        </>
      )}
    </ModalShell>
  )
}

export function PollDetailModal({
  poll,
  results,
  onClose,
  onDelete,
}: {
  poll: Poll | null
  results: PollResults
  onClose: () => void
  onDelete: (pollId: number) => void
}) {
  const rows = poll ? (results[poll.poll_id] ?? []) : []
  const totalVotes = rows.reduce(
    (sum: number, r: any) => sum + (r.vote_count || 0),
    0,
  )

  return (
    <ModalShell open={!!poll} onClose={onClose} labelledBy="poll-detail-title" className={PANEL}>
      {poll && (
        <>
          <p className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest mb-1">
            Poll #{poll.poll_id}
          </p>
          <h4 id="poll-detail-title" className="text-xl font-black text-[#4D5D53] mb-2">
            {poll.question}
          </h4>
          <p className="text-[10px] text-[#9A9A9A] mb-6">
            Deadline:{' '}
            {poll.deadline ? new Date(poll.deadline).toLocaleString() : 'None'}
          </p>

          <div className="space-y-4">
            {rows.map((result: any) => (
              <div key={result.option_id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-black text-[#4D5D53]">
                    {result.option_text}
                  </span>
                  <span className="text-[10px] font-black text-[#D4A373]">
                    {Math.round(result.percentage || 0)}% · {result.vote_count} votes
                  </span>
                </div>
                <div className="h-3 bg-[#FAF9F6] rounded-full overflow-hidden border border-[#F0F0EE]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${result.percentage || 0}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full bg-[#D4A373] rounded-full"
                  />
                </div>
              </div>
            ))}
            {rows.length === 0 && (
              <p className="text-sm text-[#9A9A9A]">No votes yet.</p>
            )}
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#F0F0EE]">
            <p className="text-[10px] text-[#9A9A9A] font-bold uppercase tracking-widest">
              Total votes: {totalVotes}
            </p>
            <DeleteAction label="Delete Poll" onClick={() => onDelete(poll.poll_id)} />
          </div>
        </>
      )}
    </ModalShell>
  )
}

export function EventDetailModal({
  event,
  onClose,
  onDelete,
}: {
  event: HostelEvent | null
  onClose: () => void
  onDelete: (eventId: number) => void
}) {
  return (
    <ModalShell open={!!event} onClose={onClose} labelledBy="event-detail-title" className={PANEL}>
      {event && (
        <>
          <p className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest mb-1">
            {new Date(event.event_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <h4 id="event-detail-title" className="text-xl font-black text-[#4D5D53]">
            {event.title}
          </h4>
          <p className="text-[10px] text-[#9A9A9A] mt-1 mb-4">{event.location}</p>

          {event.description && (
            <p className="text-sm text-[#4D5D53] whitespace-pre-wrap leading-relaxed">
              {event.description}
            </p>
          )}

          <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#F0F0EE]">
            <div>
              <p className="text-[10px] text-[#9A9A9A] font-bold uppercase tracking-widest">
                {event.attendees ?? 0} attending
              </p>
              <p className="text-[10px] text-[#9A9A9A] font-bold uppercase tracking-widest">
                {new Date(event.event_date).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <DeleteAction
              label="Delete Event"
              onClick={() => onDelete(event.event_id)}
            />
          </div>
        </>
      )}
    </ModalShell>
  )
}

export function EntryDetailModal({
  entry,
  onClose,
  onDelete,
}: {
  entry: GuidebookEntry | null
  onClose: () => void
  onDelete: (entryId: number) => void
}) {
  return (
    <ModalShell open={!!entry} onClose={onClose} labelledBy="entry-detail-title" className={PANEL}>
      {entry && (
        <>
          <p className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest mb-1">
            {entry.category}
          </p>
          <h4 id="entry-detail-title" className="text-xl font-black text-[#4D5D53] mb-4">
            {entry.title}
          </h4>
          <p className="text-sm text-[#4D5D53] whitespace-pre-wrap leading-relaxed">
            {entry.content}
          </p>

          <div className="flex justify-end mt-6 pt-4 border-t border-[#F0F0EE]">
            <DeleteAction
              label="Delete Entry"
              onClick={() => onDelete(entry.entry_id)}
            />
          </div>
        </>
      )}
    </ModalShell>
  )
}
