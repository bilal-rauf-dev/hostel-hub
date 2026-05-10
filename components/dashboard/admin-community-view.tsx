"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { communityApi, pollsApi, eventsApi, guidebookApi } from "@/lib/api";
import {
  MessageSquare,
  BarChart3,
  Calendar,
  BookOpen,
  Trash2,
  Plus,
} from "lucide-react";

type Tab = "Posts" | "Polls" | "Events" | "Guidebook";

interface Props { onToast: (msg: string, type: 'success' | 'error' | 'info') => void }

export function AdminCommunityView({ onToast }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Posts");
  
  // Posts
  const [posts, setPosts] = useState<any[]>([]);

  // Polls
  const [polls, setPolls] = useState<any[]>([]);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollDeadline, setPollDeadline] = useState("");
  const [creatingPoll, setCreatingPoll] = useState(false);

  // Events
  const [events, setEvents] = useState<any[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [creatingEvent, setCreatingEvent] = useState(false);

  // Guidebook
  const [entries, setEntries] = useState<any[]>([]);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideTitle, setGuideTitle] = useState("");
  const [guideContent, setGuideContent] = useState("");
  const [guideCategory, setGuideCategory] = useState("");
  const [creatingGuide, setCreatingGuide] = useState(false);

  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [selectedPoll, setSelectedPoll] = useState<any | null>(null);
  const [pollResultsMap, setPollResultsMap] = useState<{ [key: number]: any[] }>({});
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);

  const loadAll = async () => {
    const [postsRes, pollsRes, eventsRes, guideRes] = await Promise.allSettled([
      communityApi.getPosts(),
      pollsApi.getPolls(),
      eventsApi.getEvents(),
      guidebookApi.getEntries(),
    ]);
    if (postsRes.status === "fulfilled" && postsRes.value.data?.success)
      setPosts(postsRes.value.data.data || []);
    if (pollsRes.status === "fulfilled" && pollsRes.value.data?.success) {
      const pollData = pollsRes.value.data.data || [];
      setPolls(pollData);
      const results: { [key: number]: any[] } = {};
      for (const poll of pollData) {
        try {
          const r = await pollsApi.getPollResults(poll.poll_id);
          if (r.data?.success) results[poll.poll_id] = r.data.data;
        } catch (_) {}
      }
      setPollResultsMap(results);
    }
    if (eventsRes.status === "fulfilled" && eventsRes.value.data?.success)
      setEvents(eventsRes.value.data.data || []);
    if (guideRes.status === "fulfilled" && guideRes.value.data?.success)
      setEntries(guideRes.value.data.data || []);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const tabs: { id: Tab; icon: any; label: string }[] = [
    { id: "Posts", icon: MessageSquare, label: "Posts" },
    { id: "Polls", icon: BarChart3, label: "Polls" },
    { id: "Events", icon: Calendar, label: "Events" },
    { id: "Guidebook", icon: BookOpen, label: "Guidebook" },
  ];

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

      {/* Tab Bar */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-[#F0F0EE] shadow-sm w-fit gap-1">
        {tabs.map((tab) => (
          <motion.button
            whileTap={{ scale: 0.95 }}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? "bg-[#4D5D53] text-white shadow-lg"
                : "text-[#9A9A9A] hover:bg-[#FAF9F6]"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* POSTS TAB */}
        {activeTab === "Posts" && (
          <motion.div
            key="posts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A]">
              {posts.length} total posts
            </p>
            {posts.length === 0 ? (
              <div className="p-8 text-sm text-[#9A9A9A] bg-white rounded-3xl border border-[#F0F0EE]">
                No posts yet.
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.post_id}
                  onClick={() => setSelectedPost(post)}
                  className="bg-white p-6 rounded-3xl border border-[#F0F0EE] shadow-sm flex items-start justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest">
                        {post.author_name}
                      </span>
                      <span className="text-[10px] text-[#9A9A9A]">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] text-[#9A9A9A]">
                        • {post.like_count} likes
                      </span>
                    </div>
                    <p className="text-sm text-[#4D5D53] line-clamp-2">{post.content}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={async (e) => {
                      e.stopPropagation();
                      await communityApi.deletePost(post.post_id);
                      await loadAll();
                      onToast("Post deleted", "success");
                    }}
                    className="p-2.5 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </motion.button>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* POLLS TAB */}
        {activeTab === "Polls" && (
          <motion.div
            key="polls"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A]">
                {polls.length} active polls
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPollModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#4D5D53] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg"
              >
                <Plus className="h-3.5 w-3.5" /> Create Poll
              </motion.button>
            </div>
            {polls.length === 0 ? (
              <div className="p-8 text-sm text-[#9A9A9A] bg-white rounded-3xl border border-[#F0F0EE]">
                No active polls.
              </div>
            ) : (
              polls.map((poll) => (
                <div
                  key={poll.poll_id}
                  onClick={() => setSelectedPoll(poll)}
                  className="bg-white p-6 rounded-3xl border border-[#F0F0EE] shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <p className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest mb-1">
                    Poll #{poll.poll_id}
                  </p>
                  <h4 className="font-black text-[#4D5D53] mb-3">
                    {poll.question}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(poll.options || []).map((opt: any) => (
                      <span
                        key={opt.option_id}
                        className="px-3 py-1 bg-[#FAF9F6] border border-[#F0F0EE] rounded-full text-[10px] font-bold text-[#79837C]"
                      >
                        {opt.option_text}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#9A9A9A] mt-3">
                    Deadline: {new Date(poll.deadline).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* EVENTS TAB */}
        {activeTab === "Events" && (
          <motion.div
            key="events"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A]">
                {events.length} upcoming events
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowEventModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#4D5D53] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg"
              >
                <Plus className="h-3.5 w-3.5" /> Create Event
              </motion.button>
            </div>
            {events.length === 0 ? (
              <div className="p-8 text-sm text-[#9A9A9A] bg-white rounded-3xl border border-[#F0F0EE]">
                No upcoming events.
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.event_id}
                  onClick={() => setSelectedEvent(event)}
                  className="bg-white p-6 rounded-3xl border border-[#F0F0EE] shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div>
                    <p className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest mb-1">
                      {new Date(event.event_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <h4 className="font-black text-[#4D5D53]">{event.title}</h4>
                    <p className="text-[10px] text-[#9A9A9A] mt-1">
                      {event.location}
                    </p>
                  </div>
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                    {event.attendees ?? 0} going
                  </span>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* GUIDEBOOK TAB */}
        {activeTab === "Guidebook" && (
          <motion.div
            key="guidebook"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A]">
                {entries.length} entries
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowGuideModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#4D5D53] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg"
              >
                <Plus className="h-3.5 w-3.5" /> Add Entry
              </motion.button>
            </div>
            {entries.length === 0 ? (
              <div className="p-8 text-sm text-[#9A9A9A] bg-white rounded-3xl border border-[#F0F0EE]">
                No guidebook entries.
              </div>
            ) : (
              entries.map((entry: any) => (
                <div
                  key={entry.entry_id}
                  onClick={() => setSelectedEntry(entry)}
                  className="bg-white p-6 rounded-3xl border border-[#F0F0EE] shadow-sm flex items-start justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow"
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
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={async (e) => {
                      e.stopPropagation();
                      await guidebookApi.deleteEntry(entry.entry_id);
                      await loadAll();
                      onToast("Entry deleted", "success");
                    }}
                    className="p-2.5 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </motion.button>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE POLL MODAL */}
      {showPollModal &&
        createPortal(
          <AnimatePresence>
            <motion.div
              key="poll-overlay"
              className="fixed inset-0 z-[9999] flex items-center justify-center"
            >
              <motion.div
                key="poll-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowPollModal(false)}
              />
              <motion.div
                key="poll-content"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative bg-white p-6 rounded-2xl w-full max-w-lg mx-4 shadow-2xl z-10"
              >
                <h4 className="text-lg font-black mb-4">Create Poll</h4>
                <input
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Poll question"
                  className="w-full p-3 border rounded-xl mb-3 text-sm"
                />
                <div className="space-y-2 mb-3">
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        value={opt}
                        onChange={(e) =>
                          setPollOptions((prev) =>
                            prev.map((o, i) =>
                              i === idx ? e.target.value : o,
                            ),
                          )
                        }
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 p-2.5 border rounded-xl text-sm"
                      />
                      <button
                        onClick={() => {
                          if (pollOptions.length > 2)
                            setPollOptions((prev) =>
                              prev.filter((_, i) => i !== idx),
                            );
                        }}
                        disabled={pollOptions.length <= 2}
                        className="px-3 bg-red-50 text-red-500 rounded-xl text-sm disabled:opacity-30"
                      >
                        −
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      if (pollOptions.length < 5)
                        setPollOptions((prev) => [...prev, ""]);
                    }}
                    disabled={pollOptions.length >= 5}
                    className="px-3 py-1.5 bg-[#FAF9F6] rounded-xl text-xs font-bold disabled:opacity-30"
                  >
                    + Add option
                  </button>
                </div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A]">
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  value={pollDeadline}
                  onChange={(e) => setPollDeadline(e.target.value)}
                  className="w-full p-2.5 border rounded-xl mt-1 mb-4 text-sm"
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowPollModal(false)}
                    className="px-4 py-2 border rounded-xl text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={creatingPoll}
                    onClick={async () => {
                      const opts = pollOptions.filter((o) => o.trim());
                      if (
                        !pollQuestion.trim() ||
                        opts.length < 2 ||
                        !pollDeadline
                      ) {
                        onToast(
                          "Fill in all fields and at least 2 options",
                          "error",
                        );
                        return;
                      }
                      try {
                        setCreatingPoll(true);
                        const res = await pollsApi.createPoll(
                          pollQuestion,
                          opts,
                          pollDeadline,
                        );
                        if (res.data?.success) {
                          await loadAll();
                          setShowPollModal(false);
                          setPollQuestion("");
                          setPollOptions(["", ""]);
                          setPollDeadline("");
                          onToast("Poll created", "success");
                        } else
                          onToast(res.data?.message || "Failed", "error");
                      } catch (e: any) {
                        onToast(e?.message || "Error", "error");
                      } finally {
                        setCreatingPoll(false);
                      }
                    }}
                    className="px-4 py-2 bg-[#4D5D53] text-white rounded-xl text-sm font-bold disabled:opacity-50"
                  >
                    {creatingPoll ? "Creating..." : "Create"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}

      {/* CREATE EVENT MODAL */}
      {showEventModal &&
        createPortal(
          <AnimatePresence>
            <motion.div
              key="event-overlay"
              className="fixed inset-0 z-[9999] flex items-center justify-center"
            >
              <motion.div
                key="event-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowEventModal(false)}
              />
              <motion.div
                key="event-content"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative bg-white p-6 rounded-2xl w-full max-w-lg mx-4 shadow-2xl z-10"
              >
                <h4 className="text-lg font-black mb-4">Create Event</h4>
                <div className="space-y-3 mb-4">
                  <input
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Event title"
                    className="w-full p-3 border rounded-xl text-sm"
                  />
                  <textarea
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    placeholder="Description"
                    className="w-full p-3 border rounded-xl text-sm h-20 resize-none"
                  />
                  <input
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="Location"
                    className="w-full p-3 border rounded-xl text-sm"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="p-3 border rounded-xl text-sm"
                    />
                    <input
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="p-3 border rounded-xl text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowEventModal(false)}
                    className="px-4 py-2 border rounded-xl text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={creatingEvent}
                    onClick={async () => {
                      if (
                        !eventTitle.trim() ||
                        !eventLocation.trim() ||
                        !eventDate
                      ) {
                        onToast("Fill in title, location and date", "error");
                        return;
                      }
                      try {
                        setCreatingEvent(true);
                        const eventDateTime = eventTime
                          ? `${eventDate}T${eventTime}`
                          : `${eventDate}T00:00`;
                        const res = await eventsApi.createEvent(
                          eventTitle,
                          eventDesc,
                          eventLocation,
                          eventDateTime,
                        );
                        if (res.data?.success) {
                          await loadAll();
                          setShowEventModal(false);
                          setEventTitle("");
                          setEventDesc("");
                          setEventLocation("");
                          setEventDate("");
                          setEventTime("");
                          onToast("Event created", "success");
                        } else
                          onToast(res.data?.message || "Failed", "error");
                      } catch (e: any) {
                        onToast(
                          e?.response?.data?.detail || e?.message || "Error",
                          "error",
                        );
                      } finally {
                        setCreatingEvent(false);
                      }
                    }}
                    className="px-4 py-2 bg-[#4D5D53] text-white rounded-xl text-sm font-bold disabled:opacity-50"
                  >
                    {creatingEvent ? "Creating..." : "Create"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}

      {/* CREATE GUIDEBOOK MODAL */}
      {showGuideModal &&
        createPortal(
          <AnimatePresence>
            <motion.div
              key="guide-overlay"
              className="fixed inset-0 z-[9999] flex items-center justify-center"
            >
              <motion.div
                key="guide-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowGuideModal(false)}
              />
              <motion.div
                key="guide-content"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative bg-white p-6 rounded-2xl w-full max-w-lg mx-4 shadow-2xl z-10"
              >
                <h4 className="text-lg font-black mb-4">Add Guidebook Entry</h4>
                <div className="space-y-3 mb-4">
                  <input
                    value={guideTitle}
                    onChange={(e) => setGuideTitle(e.target.value)}
                    placeholder="Title"
                    className="w-full p-3 border rounded-xl text-sm"
                  />
                  <input
                    value={guideCategory}
                    onChange={(e) => setGuideCategory(e.target.value)}
                    placeholder="Category (e.g. Rules, Facilities)"
                    className="w-full p-3 border rounded-xl text-sm"
                  />
                  <textarea
                    value={guideContent}
                    onChange={(e) => setGuideContent(e.target.value)}
                    placeholder="Content"
                    className="w-full p-3 border rounded-xl text-sm h-28 resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowGuideModal(false)}
                    className="px-4 py-2 border rounded-xl text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={creatingGuide}
                    onClick={async () => {
                      if (
                        !guideTitle.trim() ||
                        !guideContent.trim() ||
                        !guideCategory.trim()
                      ) {
                        onToast("Fill in all fields", "error");
                        return;
                      }
                      try {
                        setCreatingGuide(true);
                        const res = await guidebookApi.createEntry(
                          guideTitle,
                          guideContent,
                          guideCategory,
                        );
                        if (res.data?.success) {
                          await loadAll();
                          setShowGuideModal(false);
                          setGuideTitle("");
                          setGuideContent("");
                          setGuideCategory("");
                          onToast("Entry added", "success");
                        } else
                          onToast(res.data?.message || "Failed", "error");
                      } catch (e: any) {
                        onToast(e?.message || "Error", "error");
                      } finally {
                        setCreatingGuide(false);
                      }
                    }}
                    className="px-4 py-2 bg-[#4D5D53] text-white rounded-xl text-sm font-bold disabled:opacity-50"
                  >
                    {creatingGuide ? "Saving..." : "Save"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}

      {/* POST DETAIL MODAL */}
      {selectedPost &&
        createPortal(
          <AnimatePresence>
            <motion.div
              key="post-detail-overlay"
              className="fixed inset-0 z-[9999] flex items-center justify-center"
            >
              <motion.div
                key="post-detail-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setSelectedPost(null)}
              />
              <motion.div
                key="post-detail-content"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative bg-white p-8 rounded-3xl w-full max-w-lg mx-4 shadow-2xl z-10"
              >
                <button
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#FAF9F6] text-[#9A9A9A] hover:bg-[#F0F0EE]"
                >
                  ✕
                </button>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#E9EDC9] flex items-center justify-center text-[#4D5D53]">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#4D5D53]">
                      {selectedPost.author_name}
                    </p>
                    <p className="text-[10px] text-[#9A9A9A]">
                      {new Date(selectedPost.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-[#4D5D53] leading-relaxed mb-6">
                  {selectedPost.content}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-[#F0F0EE]">
                  <span className="text-[10px] font-black text-[#9A9A9A] uppercase tracking-widest">
                    {selectedPost.like_count} likes
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                      await communityApi.deletePost(selectedPost.post_id);
                      await loadAll();
                      setSelectedPost(null);
                      onToast("Post deleted", "success");
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete Post
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}

      {/* POLL DETAIL MODAL */}
      {selectedPoll &&
        createPortal(
          <AnimatePresence>
            <motion.div
              key="poll-detail-overlay"
              className="fixed inset-0 z-[9999] flex items-center justify-center"
            >
              <motion.div
                key="poll-detail-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setSelectedPoll(null)}
              />
              <motion.div
                key="poll-detail-content"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative bg-white p-8 rounded-3xl w-full max-w-lg mx-4 shadow-2xl z-10 max-h-[80vh] overflow-y-auto"
              >
                <button
                  onClick={() => setSelectedPoll(null)}
                  className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#FAF9F6] text-[#9A9A9A] hover:bg-[#F0F0EE]"
                >
                  ✕
                </button>
                <p className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest mb-1">
                  Poll #{selectedPoll.poll_id}
                </p>
                <h4 className="text-xl font-black text-[#4D5D53] mb-2 pr-8">
                  {selectedPoll.question}
                </h4>
                <p className="text-[10px] text-[#9A9A9A] mb-6">
                  Deadline: {new Date(selectedPoll.deadline).toLocaleString()}
                </p>
                <div className="space-y-4">
                  {(pollResultsMap[selectedPoll.poll_id] || []).map(
                    (result: any) => (
                      <div key={result.option_id}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-black text-[#4D5D53]">
                            {result.option_text}
                          </span>
                          <span className="text-[10px] font-black text-[#D4A373]">
                            {Math.round(result.percentage || 0)}% ·{" "}
                            {result.vote_count} votes
                          </span>
                        </div>
                        <div className="h-3 bg-[#FAF9F6] rounded-full overflow-hidden border border-[#F0F0EE]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${result.percentage || 0}%` }}
                            transition={{
                              duration: 1,
                              ease: [0.16, 1, 0.3, 1],
                            }}
                            className="h-full bg-[#D4A373] rounded-full"
                          />
                        </div>
                      </div>
                    ),
                  )}
                  {(pollResultsMap[selectedPoll.poll_id] || []).length ===
                    0 && (
                    <p className="text-sm text-[#9A9A9A]">No votes yet.</p>
                  )}
                </div>
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#F0F0EE]">
                   <p className="text-[10px] text-[#9A9A9A] font-bold uppercase tracking-widest">
                     Total votes:{" "}
                     {(pollResultsMap[selectedPoll.poll_id] || []).reduce(
                       (sum: number, r: any) => sum + (r.vote_count || 0),
                       0,
                     )}
                   </p>
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={async () => {
                       await pollsApi.deletePoll(selectedPoll.poll_id);
                       await loadAll();
                       setSelectedPoll(null);
                       onToast("Poll deleted", "success");
                     }}
                     className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors"
                   >
                     <Trash2 className="h-3.5 w-3.5" /> Delete Poll
                   </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}

      {/* EVENT DETAIL MODAL */}
      {selectedEvent &&
        createPortal(
          <AnimatePresence>
            <motion.div
              key="event-detail-overlay"
              className="fixed inset-0 z-[9999] flex items-center justify-center"
            >
              <motion.div
                key="event-detail-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setSelectedEvent(null)}
              />
              <motion.div
                key="event-detail-content"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative bg-white p-8 rounded-3xl w-full max-w-lg mx-4 shadow-2xl z-10"
              >
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#FAF9F6] text-[#9A9A9A] hover:bg-[#F0F0EE]"
                >
                  ✕
                </button>
                <p className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest mb-1">
                  {new Date(selectedEvent.event_date).toLocaleDateString(
                    "en-US",
                    { weekday: "long", month: "long", day: "numeric", year: "numeric" },
                  )}
                </p>
                <h4 className="text-xl font-black text-[#4D5D53] mb-1 pr-8">
                  {selectedEvent.title}
                </h4>
                <p className="text-[10px] text-[#9A9A9A] mb-4">
                  📍 {selectedEvent.location}
                </p>
                {selectedEvent.description && (
                  <p className="text-sm text-[#4D5D53] leading-relaxed mb-6 bg-[#FAF9F6] p-4 rounded-2xl">
                    {selectedEvent.description}
                  </p>
                )}
                <div className="flex items-center justify-between pt-4 border-t border-[#F0F0EE]">
                  <span className="text-[10px] font-black text-[#9A9A9A] uppercase tracking-widest">
                    {selectedEvent.attendees ?? 0} attending
                  </span>
                  <div className="flex items-center gap-4">
                     <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                       {new Date(selectedEvent.event_date).toLocaleTimeString(
                         "en-US",
                         { hour: "2-digit", minute: "2-digit" },
                       )}
                     </span>
                     <motion.button
                       whileHover={{ scale: 1.05 }}
                       whileTap={{ scale: 0.95 }}
                       onClick={async () => {
                         await eventsApi.deleteEvent(selectedEvent.event_id);
                         await loadAll();
                         setSelectedEvent(null);
                         onToast("Event deleted", "success");
                       }}
                       className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors"
                     >
                       <Trash2 className="h-3.5 w-3.5" /> Delete
                     </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}

      {/* GUIDEBOOK DETAIL MODAL */}
      {selectedEntry &&
        createPortal(
          <AnimatePresence>
            <motion.div
              key="entry-detail-overlay"
              className="fixed inset-0 z-[9999] flex items-center justify-center"
            >
              <motion.div
                key="entry-detail-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setSelectedEntry(null)}
              />
              <motion.div
                key="entry-detail-content"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative bg-white p-8 rounded-3xl w-full max-w-lg mx-4 shadow-2xl z-10 max-h-[80vh] overflow-y-auto"
              >
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#FAF9F6] text-[#9A9A9A] hover:bg-[#F0F0EE]"
                >
                  ✕
                </button>
                <p className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest mb-1">
                  {selectedEntry.category}
                </p>
                <h4 className="text-xl font-black text-[#4D5D53] mb-4 pr-8">
                  {selectedEntry.title}
                </h4>
                <p className="text-sm text-[#4D5D53] leading-relaxed whitespace-pre-wrap">
                  {selectedEntry.content}
                </p>
                <div className="flex justify-end mt-6 pt-4 border-t border-[#F0F0EE]">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                      await guidebookApi.deleteEntry(selectedEntry.entry_id);
                      await loadAll();
                      setSelectedEntry(null);
                      onToast("Entry deleted", "success");
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete Entry
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </motion.div>
  );
}
