'use client'

import { motion, AnimatePresence } from 'motion/react'
import { 
  Building2, 
  LayoutDashboard, 
  ShoppingBag, 
  Wrench, 
  Users, 
  Calendar, 
  BookOpen, 
  Bell, 
  Search,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  MessageSquare,
  Settings,
  LogOut,
  User,
  ShieldCheck,
  AlertCircle,
  Phone,
  ArrowUpRight,
  Menu,
  X
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { OverviewView } from './overview-view'
import { MarketplaceView } from './marketplace-view'
import { TicketsView } from './tickets-view'
import { GuidebookView } from './guidebook-view'
import { CommunityView } from './community-view'
import { EventsView } from './events-view'
import { SettingsView } from './settings-view'
import { LostAndFoundView } from './lost-found-view'
import { AdminDashboardView } from './admin-dashboard-view'
import { StaffTicketsView } from './staff-tickets-view'
import { VerificationView } from './verification-view'
import { SafetyAlertsView } from './safety-alerts-view'
import { AdminSettingsView } from './admin-settings-view'
import { notificationsApi, authApi } from '@/lib/api'
import { clearTokens } from '@/lib/auth'

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: 'Overview' },
  { icon: ShoppingBag, label: 'Marketplace' },
  { icon: Search, label: 'Lost & Found' },
  { icon: Wrench, label: 'Tickets' },
  { icon: Calendar, label: 'Events' },
  { icon: MessageSquare, label: 'Community' },
  { icon: BookOpen, label: 'Guidebook' },
  { icon: Settings, label: 'Settings' },
]

interface DashboardViewProps {
  userRole: 'student' | 'admin'
  onLogout: () => void
}

export function DashboardView({ userRole, onLogout }: DashboardViewProps) {
  const isAdminMode = userRole === 'admin'
  const [activeTab, setActiveTab] = useState('Overview')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showAccount, setShowAccount] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [toasts, setToasts] = useState<{id: number, msg: string}[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsLoading, setNotificationsLoading] = useState(true)

  const addToast = (msg: string) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, msg }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }

  // Load notifications on mount
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setNotificationsLoading(true)
        const response = await notificationsApi.getNotifications()
        if (response.data.success) {
          setNotifications(response.data.data.notifications || [])
          setUnreadCount(response.data.data.unread_count || 0)
        }
      } catch (error) {
        console.error('Failed to load notifications:', error)
      } finally {
        setNotificationsLoading(false)
      }
    }

    loadNotifications()
    // Reload notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleMarkAsRead = async (notification_id: number) => {
    try {
      await notificationsApi.markAsRead(notification_id)
      setNotifications((prev) => prev.filter(n => n.id !== notification_id))
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch (err) {
      console.error('Failed to mark as read', err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      setUnreadCount(0)
      setNotifications([])
    } catch (err) {
      console.error('Failed to mark all as read', err)
    }
  }

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch (_) {
      // ignore
    }
    clearTokens()
    onLogout()
  }

  // Simulate a welcome toast
  useEffect(() => {
    setTimeout(() => addToast(`Welcome back to the Hostel Hub!`), 1500)
  }, [])

  // notifications state is loaded from API (see useEffect above)

  return (
    <div className="flex h-screen bg-[#FAF9F6] text-[#4D5D53] overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-[#4D5D53]/40 backdrop-blur-md z-[60] lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 left-0 h-full w-4/5 max-w-sm bg-white z-[70] p-8 flex flex-col shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#4D5D53] rounded-xl flex items-center justify-center text-white">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tighter">Hostel</h1>
                    <p className="text-[8px] font-black text-[#D4A373] uppercase tracking-[0.2em] -mt-1">Resident Hub</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 bg-[#FAF9F6] rounded-xl text-[#9A9A9A] hover:text-[#4D5D53] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1">
                {(!isAdminMode ? MENU_ITEMS : [
                  { icon: LayoutDashboard, label: 'Overview' },
                  { icon: Wrench, label: 'Staff Tickets' },
                  { icon: Users, label: 'Verification' },
                  { icon: AlertCircle, label: 'Safety alerts' },
                  { icon: Settings, label: 'Controls' },
                ]).map((item) => (
                  <motion.button
                    key={item.label}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setActiveTab(item.label)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
                      activeTab === item.label 
                        ? 'bg-[#E9EDC9] text-[#414D45] font-bold shadow-sm' 
                        : 'text-[#9A9A9A] hover:bg-[#FAF9F6] hover:text-[#4D5D53]'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm tracking-tight">{item.label}</span>
                  </motion.button>
                ))}
              </nav>

              <div className="mt-auto space-y-4 pt-4 border-t border-[#F0F0EE]">
                <div className="bg-[#FEFAE0] p-6 rounded-3xl border border-[#E9EDC9]/30">
                  <p className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest mb-1">Emergency</p>
                  <h4 className="text-sm font-black text-[#4D5D53]">Hostel Warden</h4>
                  <div className="flex items-center gap-2 mt-4">
                    <button className="flex-1 py-3 bg-[#4D5D53] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                      <Phone className="h-3 w-3" /> Call Now
                    </button>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-[#F0F0EE] p-8">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 bg-[#4D5D53] rounded-[1.5rem] flex items-center justify-center text-white shadow-lg shadow-[#4D5D53]/20">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter">Hostel</h1>
            <p className="text-[10px] font-black text-[#D4A373] uppercase tracking-[0.2em] -mt-1">Resident Hub</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {(!isAdminMode ? MENU_ITEMS : [
            { icon: LayoutDashboard, label: 'Overview' },
            { icon: Wrench, label: 'Staff Tickets' },
            { icon: Users, label: 'Verification' },
            { icon: AlertCircle, label: 'Safety alerts' },
            { icon: Settings, label: 'Controls' },
          ]).map((item) => (
            <motion.button
              key={item.label}
              whileHover={{ x: 6 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(item.label)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-[1.5rem] transition-all group ${
                activeTab === item.label 
                  ? 'bg-[#E9EDC9] text-[#414D45] shadow-sm font-bold' 
                  : 'text-[#9A9A9A] hover:bg-[#FAF9F6] hover:text-[#4D5D53]'
              }`}
            >
              <item.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${activeTab === item.label ? 'text-[#414D45]' : 'text-[#BDBDBD]'}`} />
              <span className="text-sm tracking-tight">{item.label}</span>
              {activeTab === item.label && (
                <motion.div 
                  layoutId="active-pill"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-[#414D45]"
                />
              )}
            </motion.button>
          ))}
        </nav>

        <div className="mt-auto space-y-4 pt-4 border-t border-[#F0F0EE]">
           <div className="bg-[#FEFAE0] p-6 rounded-[2rem] relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all border border-[#E9EDC9]/30">
              <div className="relative z-10">
                 <p className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest mb-1">Emergency</p>
                 <h4 className="text-sm font-black text-[#4D5D53]">Hostel Warden</h4>
                 <p className="text-[10px] text-[#79837C] font-bold mt-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Available Now
                 </p>
              </div>
              <Phone className="absolute bottom-[-10px] right-[-10px] h-20 w-20 text-[#D4A373] opacity-10 group-hover:rotate-12 transition-transform" />
           </div>
           
           <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-lg bg-[#F4F4F2] flex items-center justify-center text-[#BDBDBD] text-[10px] font-black">V1</div>
              <p className="text-[10px] text-[#BDBDBD] font-bold uppercase tracking-widest">Build 2024.1</p>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto scrollbar-hide relative">
        {/* Background shapes for depth */}
        <div className="fixed top-0 right-0 w-[50%] h-[50%] bg-[#E9EDC9]/10 blur-[120px] rounded-full -z-10 translate-x-1/4 -translate-y-1/4 pointer-events-none" />

        {/* Header */}
        <motion.header 
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="h-24 bg-white/70 backdrop-blur-xl border-b border-[#F0F0EE] px-6 lg:px-10 flex items-center justify-between sticky top-0 z-40"
        >
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2.5 bg-white border border-[#F0F0EE] rounded-xl text-[#79837C] hover:bg-[#FAF9F6] transition-all shadow-sm"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex flex-col">
              <h2 className="text-lg font-black text-[#4D5D53] tracking-tighter leading-tight">
                {isAdminMode ? 'Staff Panel' : activeTab}
              </h2>
              <p className="text-[11px] text-[#9A9A9A] font-bold uppercase tracking-widest mt-0.5">Welcome, Alex Rivers</p>
            </div>
          </div>

          <div className="flex items-center gap-6 relative">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#BDBDBD]" />
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="pl-10 pr-4 py-2 bg-[#FAF9F6] border-2 border-transparent rounded-xl text-xs focus:border-[#D4A373] focus:bg-white outline-none transition-all w-56 hover:bg-[#EFEFE9]"
              />
            </div>
            
            {/* Notifications Popout */}
            <div className="relative">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowNotifications(!showNotifications)
                  setShowAccount(false)
                }}
                className={`p-2.5 relative rounded-xl border transition-all group shadow-sm ${showNotifications ? 'bg-[#4D5D53] text-white border-[#4D5D53]' : 'bg-white border-[#EFEFE9] text-[#79837C] hover:bg-[#F4F4F2]'}`}
              >
                <Bell className="h-5 w-5 transition-transform group-hover:rotate-12" />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[8px] font-black border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </motion.button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(10px)' }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className="absolute right-0 mt-3 w-80 bg-white/80 backdrop-blur-xl border border-white/50 rounded-[2.5rem] shadow-2xl shadow-black/5 overflow-hidden z-50 p-2"
                  >
                    <div className="p-5 flex items-center justify-between border-b border-black/5 mb-2">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-[#4D5D53]">Notifications</h4>
                       <button onClick={handleMarkAllRead} className="text-[8px] font-black uppercase tracking-tighter text-[#D4A373] hover:underline">Mark all read</button>
                    </div>
                    <div className="space-y-1 p-1">
                      {notificationsLoading ? (
                        <div className="p-4 text-sm text-[#9A9A9A]">Loading...</div>
                      ) : notifications.length === 0 ? (
                        <div className="p-4 text-sm text-[#9A9A9A]">No notifications</div>
                      ) : (
                        notifications.map((notif) => (
                          <motion.button
                            key={notif.id}
                            whileHover={{ x: 4, backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="w-full text-left p-3 rounded-2xl flex gap-3 transition-colors group/item"
                          >
                            <div className={`p-2.5 rounded-xl ${notif.color} shrink-0 group-hover/item:scale-110 transition-transform`}>
                              <notif.icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-[#4D5D53]">{notif.title}</p>
                                <span className="text-[8px] font-medium text-[#9A9A9A]">{notif.time}</span>
                              </div>
                              <p className="text-[10px] text-[#79837C] mt-0.5 line-clamp-1">{notif.desc}</p>
                            </div>
                          </motion.button>
                        ))
                      )}
                    </div>
                    <button className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-center text-[#9A9A9A] hover:text-[#4D5D53] hover:bg-white/50 transition-all">
                      View all activities
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Account Popout */}
            <div className="relative">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setShowAccount(!showAccount)
                  setShowNotifications(false)
                }}
                className={`w-10 h-10 rounded-xl border-2 shadow-sm overflow-hidden flex items-center justify-center font-bold text-sm text-[10px] font-black tracking-widest cursor-pointer transition-all ${showAccount ? 'bg-[#4D5D53] border-[#4D5D53] text-white' : 'bg-[#D4A373] border-white text-white'}`}
              >
                AR
              </motion.div>

              <AnimatePresence>
                {showAccount && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(10px)' }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className="absolute right-0 mt-3 w-64 bg-white/80 backdrop-blur-xl border border-white/50 rounded-[2.5rem] shadow-2xl shadow-black/5 overflow-hidden z-50 p-2"
                  >
                    <div className="p-5 flex items-center gap-4 border-b border-black/5 mb-2">
                       <div className="w-10 h-10 rounded-xl bg-[#D4A373] flex items-center justify-center text-white font-black text-xs">AR</div>
                       <div>
                         <p className="text-sm font-black text-[#4D5D53]">Alex Rivers</p>
                         <p className="text-[8px] font-bold text-[#9A9A9A] tracking-wider uppercase">Resident • Block B</p>
                         <p className="text-[8px] font-black text-[#D4A373] tracking-wider uppercase mt-1">Role • {userRole}</p>
                       </div>
                    </div>
                    <div className="space-y-1 px-1">
                      {[
                        { label: 'My Profile', icon: User, tab: 'Settings' },
                        { label: 'Orders', icon: ShoppingBag, tab: 'Marketplace' },
                        { label: 'Security', icon: ShieldCheck, tab: 'Settings' },
                      ].map((item) => (
                        <motion.button
                          key={item.label}
                          whileHover={{ x: 4, backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
                          onClick={() => {
                            setActiveTab(item.tab)
                            setShowAccount(false)
                          }}
                          className="w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-colors group/item"
                        >
                          <div className="p-2 rounded-lg bg-[#FAF9F6] text-[#BDBDBD] group-hover/item:text-[#D4A373] group-hover/item:bg-[#FEFAE0] transition-colors">
                            <item.icon className="h-4 w-4" />
                          </div>
                          <p className="text-xs font-bold text-[#4D5D53]">{item.label}</p>
                        </motion.button>
                      ))}

                      </div>

                      <div className="h-[1px] bg-black/5 my-2 mx-2" />

                    <button 
                      onClick={handleLogout}
                      className="w-full p-3 rounded-2xl flex items-center gap-3 text-red-500 hover:bg-red-50 transition-colors"
                    >
                       <div className="p-2 rounded-lg bg-red-50 ml-1">
                         <LogOut className="h-4 w-4" />
                       </div>
                       <p className="text-xs font-bold">Sign Out</p>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.header>

        {/* Dashboard Content Area */}
        <div className="px-6 py-10 lg:px-12 lg:py-14">
          <AnimatePresence mode="wait">
            {!isAdminMode ? (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 30, filter: 'blur(10px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: -30, filter: 'blur(10px)' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                {activeTab === 'Overview' && <OverviewView />}
                {activeTab === 'Marketplace' && <MarketplaceView />}
                {activeTab === 'Tickets' && <TicketsView />}
                {activeTab === 'Events' && <EventsView />}
                {activeTab === 'Community' && <CommunityView />}
                {activeTab === 'Guidebook' && <GuidebookView />}
                {activeTab === 'Settings' && <SettingsView />}
                {activeTab === 'Lost & Found' && <LostAndFoundView />}
              </motion.div>
            ) : (
              <motion.div
                key="admin-panes"
                initial={{ opacity: 0, x: 30, filter: 'blur(10px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: -30, filter: 'blur(10px)' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                {activeTab === 'Overview' && <AdminDashboardView />}
                {activeTab === 'Staff Tickets' && <StaffTicketsView />}
                {activeTab === 'Verification' && <VerificationView />}
                {activeTab === 'Safety alerts' && <SafetyAlertsView />}
                {activeTab === 'Controls' && <AdminSettingsView />}
              </motion.div>
            )}
            
            {/* Generic Catch-all Placeholder */}
            {!MENU_ITEMS.some(item => item.label === activeTab) && !isAdminMode && (
              <motion.div 
                key="soon"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center p-20 text-center space-y-4"
              >
                <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-[#D4A373] shadow-xl shadow-black/5">
                   <Clock className="h-10 w-10 opacity-20" />
                </div>
                <h3 className="text-2xl font-black text-[#4D5D53]">Feature Unlocked Soon</h3>
                <p className="text-sm text-[#9A9A9A] max-w-xs mx-auto">This module is currently in beta. Staff are working to finalize the protocols.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Action Button (Mobile Only / Global) */}
        {!isAdminMode && (
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-8 right-8 w-14 h-14 bg-[#4D5D53] text-white rounded-[1.5rem] shadow-2xl flex items-center justify-center lg:hidden z-50"
            onClick={() => addToast('Universal search triggered')}
          >
            <Plus className="h-6 w-6" />
          </motion.button>
        )}

        {/* Global Toasts */}
        <div className="fixed bottom-8 left-8 lg:left-80 z-[100] space-y-3 pointer-events-none">
          <AnimatePresence>
            {toasts.map(toast => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                className="bg-[#4D5D53]/95 backdrop-blur-xl text-white px-6 py-4 rounded-[1.5rem] shadow-2xl flex items-center gap-4 border border-white/10 pointer-events-auto min-w-[300px]"
              >
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                   <Bell className="h-4 w-4 text-[#E9EDC9]" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-[#E9EDC9]">New Activity</p>
                   <p className="text-xs font-bold">{toast.msg}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
