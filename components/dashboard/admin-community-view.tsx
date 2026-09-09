'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'
import { BarChart3, BookOpen, Calendar, MessageSquare } from 'lucide-react'

import { communityApi, eventsApi, guidebookApi, pollsApi } from '@/lib/api'
import { useAdminCommunityData } from '@/hooks/use-admin-community-data'
import { useWriteGuard } from '@/lib/session/session-context'
import {
  ErrorState,
  LoadingState,
  StaleMarker,
} from '@/components/offline/resource-states'
import type {
  CommunityPost,
  GuidebookEntry,
  HostelEvent,
  Poll,
} from '@/lib/types'

import { EventsTab, GuidebookTab, PollsTab, PostsTab } from './admin-community/tabs'
import {
  CreateEventModal,
  CreateGuidebookModal,
  CreatePollModal,
} from './admin-community/create-modals'
import {
  EntryDetailModal,
  EventDetailModal,
  PollDetailModal,
  PostDetailModal,
} from './admin-community/detail-modals'

type Tab = 'Posts' | 'Polls' | 'Events' | 'Guidebook'

const TABS: { id: Tab; icon: typeof MessageSquare; label: string }[] = [
  { id: 'Posts', icon: MessageSquare, label: 'Posts' },
  { id: 'Polls', icon: BarChart3, label: 'Polls' },
  { id: 'Events', icon: Calendar, label: 'Events' },
  { id: 'Guidebook', icon: BookOpen, label: 'Guidebook' },
]

interface Props {
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void
}

export function AdminCommunityView({ onToast }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Posts')

  const [showPollModal, setShowPollModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showGuideModal, setShowGuideModal] = useState(false)

  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null)
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<HostelEvent | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<GuidebookEntry | null>(null)

  const guardWrite = useWriteGuard()
  const { posts, polls, events, entries, reload } = useAdminCommunityData()

  const active =
    activeTab === 'Posts'
      ? posts
      : activeTab === 'Polls'
        ? polls
        : activeTab === 'Events'
          ? events
          : entries

  /** Every delete goes through here so the guard and the reload are not forgotten. */
  const remove = async (
    action: string,
    run: () => Promise<unknown>,
    successMessage: string,
    afterSuccess?: () => void,
  ) => {
    if (!guardWrite(action)) return
    try {
      await run()
      await reload()
      afterSuccess?.()
      onToast(successMessage, 'success')
    } catch {
      onToast(`Could not ${action}`, 'error')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div>
        <h3 className="text-2xl font-black text-[#4D5D53] tracking-tight">
          Community Management
        </h3>
        <p className="text-sm text-[#9A9A9A] font-medium mt-1">
          Manage posts, polls, events and guidebook entries.
        </p>
      </div>

      <div className="flex bg-white p-1.5 rounded-2xl border border-[#F0F0EE] shadow-sm w-fit gap-1">
        {TABS.map((tab) => (
          <motion.button
            whileTap={{ scale: 0.95 }}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            aria-pressed={activeTab === tab.id}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? 'bg-[#4D5D53] text-white shadow-lg'
                : 'text-[#9A9A9A] hover:bg-[#FAF9F6]'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" aria-hidden="true" />
            {tab.label}
          </motion.button>
        ))}
      </div>

      {active.isStale && (
        <div className="flex justify-end">
          <StaleMarker fetchedAt={active.fetchedAt} />
        </div>
      )}

      {active.status === 'loading' && <LoadingState label="Loading" />}

      {active.status === 'error' && (
        <ErrorState
          message={active.error ?? 'Unknown error'}
          onRetry={active.refresh}
        />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {activeTab === 'Posts' && (
            <PostsTab
              posts={posts.data ?? []}
              onSelect={setSelectedPost}
              onDelete={(id) =>
                remove('delete a post', () => communityApi.deletePost(id), 'Post deleted')
              }
            />
          )}

          {activeTab === 'Polls' && (
            <PollsTab
              polls={polls.data?.polls ?? []}
              onSelect={setSelectedPoll}
              onCreate={() => guardWrite('create a poll') && setShowPollModal(true)}
            />
          )}

          {activeTab === 'Events' && (
            <EventsTab
              events={events.data ?? []}
              onSelect={setSelectedEvent}
              onCreate={() => guardWrite('create an event') && setShowEventModal(true)}
            />
          )}

          {activeTab === 'Guidebook' && (
            <GuidebookTab
              entries={entries.data ?? []}
              onSelect={setSelectedEntry}
              onCreate={() => guardWrite('add a guidebook entry') && setShowGuideModal(true)}
              onDelete={(id) =>
                remove(
                  'delete an entry',
                  () => guidebookApi.deleteEntry(id),
                  'Entry deleted',
                )
              }
            />
          )}
        </motion.div>
      </AnimatePresence>

      <CreatePollModal
        open={showPollModal}
        onClose={() => setShowPollModal(false)}
        onCreated={reload}
        onToast={onToast}
      />
      <CreateEventModal
        open={showEventModal}
        onClose={() => setShowEventModal(false)}
        onCreated={reload}
        onToast={onToast}
      />
      <CreateGuidebookModal
        open={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onCreated={reload}
        onToast={onToast}
      />

      <PostDetailModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onDelete={(id) =>
          remove(
            'delete a post',
            () => communityApi.deletePost(id),
            'Post deleted',
            () => setSelectedPost(null),
          )
        }
      />
      <PollDetailModal
        poll={selectedPoll}
        results={polls.data?.results ?? {}}
        onClose={() => setSelectedPoll(null)}
        onDelete={(id) =>
          remove(
            'delete a poll',
            () => pollsApi.deletePoll(id),
            'Poll deleted',
            () => setSelectedPoll(null),
          )
        }
      />
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onDelete={(id) =>
          remove(
            'delete an event',
            () => eventsApi.deleteEvent(id),
            'Event deleted',
            () => setSelectedEvent(null),
          )
        }
      />
      <EntryDetailModal
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
        onDelete={(id) =>
          remove(
            'delete an entry',
            () => guidebookApi.deleteEntry(id),
            'Entry deleted',
            () => setSelectedEntry(null),
          )
        }
      />
    </motion.div>
  )
}
