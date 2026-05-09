'use client'

import { motion, AnimatePresence } from 'motion/react'
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
  ChevronRight
} from 'lucide-react'
import Image from 'next/image'

const POSTS = [
  {
    id: 1,
    author: 'Alex Rivers',
    avatar: 'https://picsum.photos/seed/alex/100/100',
    content: 'Just moved into Block B! Anyone up for some badminton this weekend? Looking for a few more players for the finals. 🏸',
    time: '2h ago',
    likes: 12,
    comments: 4,
    tags: ['Sports', 'Social']
  },
  {
    id: 2,
    author: 'Sarah Jenkins',
    avatar: 'https://picsum.photos/seed/sarah/100/100',
    content: 'The new study area in Building C is amazing! Much quieter than the main lounge. Highly recommend checking it out if you have exams coming up.',
    time: '5h ago',
    likes: 24,
    comments: 8,
    tags: ['Study', 'Tips']
  },
  {
    id: 3,
    author: 'Resident Hub',
    avatar: 'https://picsum.photos/seed/hub/100/100',
    content: 'Reminder: Kitchen deep clean this Saturday at 2 PM. Please ensure all personal items are labeled! 🥘',
    time: 'Yesterday',
    likes: 45,
    comments: 12,
    tags: ['Announcement']
  }
]

const POLLS = [
  {
    id: 1,
    question: 'Favorite study hours in the library?',
    totalVotes: 156,
    options: [
      { text: 'Morning (8AM - 12PM)', votes: 45 },
      { text: 'Afternoon (1PM - 5PM)', votes: 32 },
      { text: 'Late Night (8PM - 2AM)', votes: 79 }
    ],
    deadline: '2h left'
  }
]

export function CommunityView() {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h3 className="text-2xl font-black text-[#4D5D53] tracking-tight">Community Feed</h3>
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Create Post */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-[#F0F0EE] shadow-sm">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#D4A373] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#D4A373]/20">
                <User className="h-6 w-6" />
              </div>
              <textarea 
                placeholder="What's on your mind, Alex?"
                className="w-full bg-[#FAF9F6] rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-[#D4A373]/10 border border-transparent focus:border-[#D4A373]/30 min-h-[100px] resize-none transition-all"
              />
            </div>
            <div className="flex items-center justify-between mt-4 pl-16">
              <div className="flex gap-4">
                <button className="text-[#79837C] hover:text-[#4D5D53] transition-colors flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Image</span>
                </button>
                <button className="text-[#79837C] hover:text-[#4D5D53] transition-colors flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Poll</span>
                </button>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-[#4D5D53] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#4D5D53]/20"
              >
                Post
              </motion.button>
            </div>
          </div>

          {/* Feed */}
          <div className="space-y-8">
            <AnimatePresence mode="popLayout">
              {POLLS.map(poll => (
                <motion.div
                  key={`poll-${poll.id}`}
                  initial={{ opacity: 0, x: -30, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white p-8 rounded-[3rem] border border-[#F0F0EE] shadow-sm group border-l-8 border-l-[#D4A373] hover:shadow-xl transition-all duration-500"
                >
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#D4A373] mb-6">
                    <BarChart3 className="h-4 w-4" /> Active Community Poll
                  </div>
                  <h4 className="text-2xl font-black text-[#4D5D53] tracking-tighter mb-8 leading-tight">{poll.question}</h4>
                  <div className="space-y-5">
                    {poll.options.map(option => {
                      const percentage = Math.round((option.votes / poll.totalVotes) * 100)
                      return (
                        <button key={option.text} className="w-full relative group/opt outline-none">
                          <div className="flex justify-between items-center mb-2 px-1">
                            <span className="text-sm font-black text-[#4D5D53] tracking-tight">{option.text}</span>
                            <span className="text-[10px] font-black text-[#D4A373] tabular-nums uppercase tracking-widest">{percentage}% ({option.votes} votes)</span>
                          </div>
                          <div className="h-4 bg-[#FAF9F6] rounded-full overflow-hidden border border-[#F0F0EE] relative">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                              className="h-full bg-[#E9EDC9] rounded-full group-hover/opt:bg-[#D4A373]/20 transition-colors z-10 relative"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-10 pt-8 border-t border-[#F0F0EE]">
                     <p className="text-[11px] text-[#9A9A9A] font-bold uppercase tracking-wide">{poll.totalVotes} student responses • {poll.deadline}</p>
                     <button className="text-[10px] font-black uppercase tracking-widest text-[#4D5D53] hover:text-[#D4A373] transition-colors flex items-center gap-2">
                       Vote Now <ChevronRight className="h-3 w-3" />
                     </button>
                  </div>
                </motion.div>
              ))}

              {POSTS.map((post, idx) => (
                <motion.div
                  key={`post-${post.id}`}
                  initial={{ opacity: 0, x: -30, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  transition={{ delay: 0.1 * (idx + 1), duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white p-8 rounded-[3rem] border border-[#F0F0EE] shadow-sm group hover:border-[#D4A373]/20 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg ring-4 ring-white group-hover:ring-[#D4A373]/20 transition-all duration-500 transform group-hover:rotate-3">
                        <Image 
                          src={post.avatar} 
                          alt={post.author}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-[#4D5D53] group-hover:text-[#D4A373] transition-colors tracking-tight">{post.author}</h4>
                        <p className="text-[10px] text-[#9A9A9A] font-black uppercase tracking-widest">{post.time}</p>
                      </div>
                    </div>
                    <button className="w-10 h-10 rounded-xl bg-[#FAF9F6] border border-[#F0F0EE] flex items-center justify-center text-[#BDBDBD] hover:text-[#4D5D53] hover:bg-[#FAF9F6] transition-all">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <p className="text-[#4D5D53] text-[15px] font-medium leading-relaxed mb-8 tracking-tight">
                    {post.content}
                  </p>

                  <div className="flex flex-wrap gap-2.5 mb-8">
                    {post.tags.map(tag => (
                      <span key={tag} className="px-4 py-1.5 bg-[#FAF9F6] border border-[#F0F0EE] rounded-full text-[9px] font-black uppercase tracking-[0.15em] text-[#79837C] group-hover:bg-[#FEFAE0] group-hover:text-[#D4A373] transition-all cursor-pointer">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="h-[1px] bg-[#F0F0EE] w-full mb-8 group-hover:bg-[#D4A373]/10 transition-colors" />

                  <div className="flex items-center gap-10">
                    <button className="flex items-center gap-3 text-[#79837C] hover:text-red-500 transition-all font-black uppercase tracking-widest text-[10px] group/btn">
                      <div className="p-2.5 bg-[#FAF9F6] rounded-xl group-hover/btn:bg-red-50 transition-colors">
                        <Heart className="h-5 w-5 transition-transform group-hover/btn:scale-125" />
                      </div>
                      {post.likes}
                    </button>
                    <button className="flex items-center gap-3 text-[#79837C] hover:text-[#D4A373] transition-all font-black uppercase tracking-widest text-[10px] group/btn">
                       <div className="p-2.5 bg-[#FAF9F6] rounded-xl group-hover/btn:bg-[#FEFAE0] transition-colors">
                        <MessageSquare className="h-5 w-5 transition-transform group-hover/btn:scale-125" />
                      </div>
                      {post.comments}
                    </button>
                    <button className="flex items-center gap-3 text-[#79837C] hover:text-[#4D5D53] transition-all font-black uppercase tracking-widest text-[10px] group/btn ml-auto">
                      <Share2 className="h-5 w-5 transition-transform group-hover/btn:scale-125" />
                      Share
                    </button>
                  </div>
                </motion.div>
              ))}
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
              {['#HostelFinals', '#KitchenRules', '#BlockB_Party', '#StudySessions'].map(topic => (
                <button key={topic} className="w-full text-left px-4 py-2 hover:bg-white rounded-xl text-xs font-bold text-[#79837C] hover:text-[#D4A373] transition-all">
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#F0F0EE] rounded-[2rem] p-6 shadow-sm">
             <h4 className="font-bold text-[#4D5D53] mb-4">Community Guidelines</h4>
             <p className="text-[10px] text-[#9A9A9A] leading-relaxed mb-4">
               Keep it respectful, supportive, and hub-friendly. No spam or commercial posts outside Marketplace.
             </p>
             <button className="text-[10px] font-black uppercase tracking-widest text-[#D4A373] hover:underline underline-offset-8">
               Read Full Rules
             </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
