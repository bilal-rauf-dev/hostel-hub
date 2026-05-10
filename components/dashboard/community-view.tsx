"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare,
  Heart,
  Share2,
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Image as ImageIcon,
  User,
  TrendingUp,
  BarChart3,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { pollsApi, communityApi } from "@/lib/api";
import { isAdmin, getCurrentUser } from "@/lib/auth";

interface Props {
  onToast: (msg: string, type: "success" | "error" | "info") => void;
}

export function CommunityView({ onToast }: Props) {
  const currentUser = getCurrentUser();
  const [posts, setPosts] = useState<any[]>([]);
  const [postContent, setPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [deadline, setDeadline] = useState("");
  const [userVotes, setUserVotes] = useState<{ [key: number]: number }>({}); // poll_id -> option_id
  const [pollResults, setPollResults] = useState<{ [key: number]: any[] }>({}); // poll_id -> results

  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await pollsApi.getPolls();
      if (res.data?.success) {
        setPolls(res.data.data || []);
        // Load results for each poll
        const allResults: { [key: number]: any[] } = {};
        for (const poll of res.data.data || []) {
          try {
            const resultsRes = await pollsApi.getPollResults(poll.poll_id);
            if (resultsRes.data?.success) {
              allResults[poll.poll_id] = resultsRes.data.data;
            }
          } catch (e) {
            // silently fail on individual poll result loads
          }
        }
        setPollResults(allResults);
      } else {
        setError(res.data?.message || "Failed to load polls");
      }

      const postsRes = await communityApi.getPosts();
      if (postsRes.data?.success) setPosts(postsRes.data.data || []);
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, [load]);

  const handleOpenCreate = () => setShowCreate(true);

  const handleCreatePoll = async () => {
    try {
      setLoading(true);
      const opts = options.filter((o) => o.trim() !== "");
      if (!question.trim() || opts.length < 2) {
        onToast("Provide a question and at least 2 options", "error");
        return;
      }
      const res = await pollsApi.createPoll(question, opts, deadline);
      if (res.data?.success) {
        const r = await pollsApi.getPolls();
        if (r.data?.success) setPolls(r.data.data || []);
        setShowCreate(false);
        setQuestion("");
        setOptions(["", ""]);
        setDeadline("");
        onToast("Poll created", "success");
      } else {
        onToast(res.data?.message || "Failed to create poll", "error");
      }
    } catch (e: any) {
      onToast(e?.message || "Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateOption = (idx: number, val: string) => {
    setOptions((prev) => prev.map((o, i) => (i === idx ? val : o)));
  };

  const addOption = () => {
    if (options.length < 5) setOptions((prev) => [...prev, ""]);
  };
  const removeOption = (idx: number) => {
    if (options.length > 2)
      setOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-2xl font-black text-[#4D5D53] tracking-tight">
            Community Feed
          </h3>
          <motion.button
            onClick={handleRefresh}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={refreshing}
            className="p-2.5 bg-white border border-[#F0F0EE] rounded-xl text-[#79837C] hover:bg-[#FAF9F6] transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </motion.button>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#BDBDBD]" />
            <input
              type="text"
              placeholder="Search posts..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#F0F0EE] rounded-xl text-sm outline-none focus:border-[#D4A373] shadow-sm"
            />
          </div>
          <button className="p-2.5 bg-white border border-[#F0F0EE] rounded-xl text-[#79837C] hover:bg-[#FAF9F6] transition-colors shadow-sm">
            <Filter className="h-5 w-5" />
          </button>
          {isAdmin() && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-[#4D5D53] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg ml-2"
            >
              Create Poll
            </button>
          )}
        </div>
      </div>

      {/* Create Poll Modal */}
      {showCreate &&
        createPortal(
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
                onClick={() => setShowCreate(false)}
              />
              <motion.div
                key="modal-content"
                initial={{
                  opacity: 0,
                  y: 20,
                  scale: 0.95,
                  filter: "blur(10px)",
                }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative bg-white p-6 rounded-2xl w-full max-w-xl mx-4 shadow-2xl z-10"
              >
                <h4 className="text-lg font-black mb-4">Create Poll</h4>
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Question"
                  className="w-full p-3 border rounded-md mb-3"
                />
                <div className="space-y-2 mb-3">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        value={opt}
                        onChange={(e) => updateOption(idx, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 p-2 border rounded-md"
                      />
                      <button
                        onClick={() => removeOption(idx)}
                        disabled={options.length <= 2}
                        className="px-3 bg-red-50 text-red-600 rounded-md"
                      >
                        -
                      </button>
                    </div>
                  ))}
                  <div>
                    <button
                      onClick={addOption}
                      disabled={options.length >= 5}
                      className="px-3 py-1 bg-[#FAF9F6] rounded-md"
                    >
                      Add option
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-xs font-bold">Deadline</label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full p-2 border rounded-md mt-1"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowCreate(false)}
                    className="px-4 py-2 border rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePoll}
                    className="px-4 py-2 bg-[#4D5D53] text-white rounded-md"
                  >
                    Create
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Create Post */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-[#F0F0EE] shadow-sm">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#D4A373] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#D4A373]/20">
                <User className="h-6 w-6" />
              </div>
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-[#FAF9F6] rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-[#D4A373]/10 border border-transparent focus:border-[#D4A373]/30 min-h-[100px] resize-none transition-all"
              />
            </div>
            <div className="flex items-center justify-between mt-4 pl-16">
              <div className="flex gap-4">
                <button className="text-[#79837C] hover:text-[#4D5D53] transition-colors flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Image
                  </span>
                </button>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  if (!postContent.trim()) return;
                  try {
                    setPosting(true);
                    const res = await communityApi.createPost(postContent);
                    if (res.data?.success) {
                      setPostContent("");
                      const postsRes = await communityApi.getPosts();
                      if (postsRes.data?.success)
                        setPosts(postsRes.data.data || []);
                      onToast("Post shared!", "success");
                    } else {
                      onToast(res.data?.message || "Failed to post", "error");
                    }
                  } catch (e: any) {
                    onToast(e?.message || "Network error", "error");
                  } finally {
                    setPosting(false);
                  }
                }}
                className="px-6 py-2 bg-[#4D5D53] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#4D5D53]/20"
              >
                {posting ? "Posting..." : "Post"}
              </motion.button>
            </div>
          </div>

          {/* Feed */}
          <div className="space-y-8">
            <AnimatePresence mode="popLayout">
              {[
                ...posts.map((p) => ({ ...p, type: "post" as const })),
                ...polls.map((p) => ({ ...p, type: "poll" as const })),
              ]
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime(),
                )
                .map((item) => {
                  if (item.type === "post") {
                    const post = item;
                    return (
                      <motion.div
                        key={`post-${post.post_id}`}
                        initial={{ opacity: 0, x: -30, filter: "blur(10px)" }}
                        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="bg-white p-8 rounded-[3rem] border border-[#F0F0EE] shadow-sm hover:shadow-xl transition-all duration-500 mb-8"
                      >
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#E9EDC9] flex items-center justify-center text-[#4D5D53]">
                              <User className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-[#4D5D53]">
                                {post.author_name}
                              </p>
                              <p className="text-[10px] text-[#9A9A9A] font-bold">
                                {new Date(post.created_at).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                          {post.user_id === currentUser?.user_id && (
                            <button
                              onClick={async () => {
                                await communityApi.deletePost(post.post_id);
                                const postsRes = await communityApi.getPosts();
                                if (postsRes.data?.success)
                                  setPosts(postsRes.data.data || []);
                                onToast("Post deleted", "success");
                              }}
                              className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-[#4D5D53] leading-relaxed mb-6">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-4 pt-6 border-t border-[#F0F0EE]">
                          <button
                            onClick={async () => {
                              await communityApi.toggleLike(post.post_id);
                              const postsRes = await communityApi.getPosts();
                              if (postsRes.data?.success)
                                setPosts(postsRes.data.data || []);
                            }}
                            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
                              post.liked_by_me
                                ? "text-[#D4A373]"
                                : "text-[#9A9A9A] hover:text-[#D4A373]"
                            }`}
                          >
                            <Heart
                              className={`h-4 w-4 ${post.liked_by_me ? "fill-[#D4A373] text-[#D4A373]" : ""}`}
                            />
                            {post.like_count}{" "}
                            {post.like_count === 1 ? "Like" : "Likes"}
                          </button>
                        </div>
                      </motion.div>
                    );
                  } else {
                    const poll = item;
                    return (
                      <motion.div
                        key={`poll-${poll.poll_id}`}
                        initial={{ opacity: 0, x: -30, filter: "blur(10px)" }}
                        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="bg-white p-8 rounded-[3rem] border border-[#F0F0EE] shadow-sm group border-l-8 border-l-[#D4A373] hover:shadow-xl transition-all duration-500 mb-8"
                      >
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#D4A373] mb-6">
                          <BarChart3 className="h-4 w-4" /> Active Community
                          Poll
                        </div>
                        <h4 className="text-2xl font-black text-[#4D5D53] tracking-tighter mb-8 leading-tight">
                          {poll.question}
                        </h4>
                        {(poll.options || []).length === 0 ? (
                          <div className="text-center py-4 text-sm text-[#9A9A9A]">
                            No options available
                          </div>
                        ) : (
                          <div className="space-y-5">
                            {(poll.options || []).map((option: any) => {
                              const results = pollResults[poll.poll_id] || [];
                              const optionResult = results.find(
                                (r: any) => r.option_id === option.option_id,
                              );
                              const percentage = optionResult?.percentage || 0;
                              const votes = optionResult?.vote_count || 0;
                              const userVoted =
                                userVotes[poll.poll_id] === option.option_id;

                              return (
                                <button
                                  key={option.option_id}
                                  onClick={async () => {
                                    try {
                                      const res = await pollsApi.castVote(
                                        poll.poll_id,
                                        option.option_id,
                                      );
                                      if (res.data?.success) {
                                        setUserVotes((prev) => ({
                                          ...prev,
                                          [poll.poll_id]: option.option_id,
                                        }));
                                        const resultsRes =
                                          await pollsApi.getPollResults(
                                            poll.poll_id,
                                          );
                                        if (resultsRes.data?.success) {
                                          setPollResults((prev) => ({
                                            ...prev,
                                            [poll.poll_id]:
                                              resultsRes.data.data,
                                          }));
                                        }
                                        onToast("Vote recorded", "success");
                                      } else {
                                        const msg = res.data?.message || "";
                                        if (
                                          msg
                                            .toLowerCase()
                                            .includes("already voted")
                                        ) {
                                          setUserVotes((prev) => ({
                                            ...prev,
                                            [poll.poll_id]: option.option_id,
                                          }));
                                          onToast(
                                            "You have already voted in this poll",
                                            "error",
                                          );
                                        } else {
                                          onToast(
                                            msg || "Failed to vote",
                                            "error",
                                          );
                                        }
                                      }
                                    } catch (e: any) {
                                      const msg =
                                        e?.response?.data?.message ||
                                        e?.message ||
                                        "Failed to vote";
                                      if (
                                        msg
                                          .toLowerCase()
                                          .includes("already voted")
                                      ) {
                                        setUserVotes((prev) => ({
                                          ...prev,
                                          [poll.poll_id]: option.option_id,
                                        }));
                                        onToast(
                                          "You have already voted in this poll",
                                          "error",
                                        );
                                      } else {
                                        onToast(msg, "error");
                                      }
                                    }
                                  }}
                                  className="w-full relative group/opt outline-none"
                                >
                                  <div className="flex justify-between items-center mb-2 px-1">
                                    <span
                                      className={`text-sm font-black tracking-tight ${userVoted ? "text-[#4D5D53]" : "text-[#4D5D53]"}`}
                                    >
                                      {option.option_text}
                                    </span>
                                    <span className="text-[10px] font-black text-[#D4A373] tabular-nums uppercase tracking-widest">
                                      {Math.round(percentage)}% ({votes} votes)
                                    </span>
                                  </div>
                                  <div className="h-4 bg-[#FAF9F6] rounded-full overflow-hidden border border-[#F0F0EE] relative">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${percentage}%` }}
                                      transition={{
                                        duration: 1.5,
                                        ease: [0.16, 1, 0.3, 1],
                                        delay: 0.2,
                                      }}
                                      className={`h-full rounded-full group-hover/opt:opacity-80 transition-all z-10 relative ${userVoted ? "bg-[#D4A373]" : "bg-[#E9EDC9]"}`}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-10 pt-8 border-t border-[#F0F0EE]">
                          <p className="text-[11px] text-[#9A9A9A] font-bold uppercase tracking-wide">
                            {poll.total_votes || poll.totalVotes || 0} student
                            responses •{" "}
                            {poll.deadline
                              ? new Date(poll.deadline).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )
                              : ""}
                          </p>
                          {!userVotes[poll.poll_id] && (
                            <button className="text-[10px] font-black uppercase tracking-widest text-[#4D5D53] hover:text-[#D4A373] transition-colors flex items-center gap-2">
                              Vote Now <ChevronRight className="h-3 w-3" />
                            </button>
                          )}
                          {userVotes[poll.poll_id] && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                              ✓ Voted
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  }
                })}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-[#FEFAE0]/30 border border-[#E9EDC9] rounded-[2rem] p-6">
            <h4 className="font-bold text-[#4D5D53] mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#D4A373]" />
              Trending Topics
            </h4>
            <div className="space-y-3">
              {[
                "#HostelFinals",
                "#KitchenRules",
                "#BlockB_Party",
                "#StudySessions",
              ].map((topic) => (
                <button
                  key={topic}
                  className="w-full text-left px-4 py-2 hover:bg-white rounded-xl text-xs font-bold text-[#79837C] hover:text-[#D4A373] transition-all"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#F0F0EE] rounded-[2rem] p-6 shadow-sm">
            <h4 className="font-bold text-[#4D5D53] mb-4">
              Community Guidelines
            </h4>
            <p className="text-[10px] text-[#9A9A9A] leading-relaxed mb-4">
              Keep it respectful, supportive, and hub-friendly. No spam or
              commercial posts outside Marketplace.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
