'use client'

import { motion, AnimatePresence } from 'motion/react'
import { 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Smartphone, 
  Globe, 
  ChevronRight,
  LogOut,
  Moon,
  Volume2
} from 'lucide-react'

import { useState, useEffect } from 'react'
import { usersApi, authApi } from '../../lib/api'
import { clearTokens } from '../../lib/auth'

const SETTINGS_SECTIONS = [
  {
    title: 'Account Settings',
    items: [
      { id: 'profile', icon: User, label: 'Profile Information', desc: 'Update your name, bio and profile picture' },
      { id: 'security', icon: Shield, label: 'Password & Security', desc: 'Manage your password and 2FA' },
      { id: 'billing', icon: CreditCard, label: 'Billing & Payments', desc: 'View invoices and manage payment methods' }
    ]
  },
  {
    title: 'App Preferences',
    items: [
      { id: 'notifications', icon: Bell, label: 'Notifications', desc: 'Personalize your alert preferences' },
      { id: 'display', icon: Moon, label: 'Display & Mode', desc: 'Toggle dark mode and interface scaling' },
      { id: 'device', icon: Smartphone, label: 'Device Management', desc: 'View active sessions and logged-in devices' }
    ]
  }
]

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<'General' | 'Profile'>('General')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [studentId, setStudentId] = useState('')

  const pushToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await usersApi.getMe()
        console.log('User data:', res.data)
        if (res.data?.success) {
          const d = res.data.data
          if (!mounted) return
          setDisplayName(d.display_name || '')
          setEmail(d.email || '')
          setContactNumber(d.contact_number || '')
          setRoomNumber(d.room_number || d.room_assignment || '')
          setStudentId(d.student_id || '')
        } else {
          setError(res.data?.message || 'Failed to load profile')
        }
      } catch (err: any) {
        setError(err?.message || 'Network error')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      const res = await usersApi.updateMe(displayName, contactNumber, undefined, roomNumber)
      if (!res.data?.success) {
        setError(res.data?.message || 'Failed to save')
        pushToast(res.data?.message || 'Failed to save', 'error')
      } else {
        pushToast('Settings saved', 'success')
      }
    } catch (err: any) {
      setError(err?.message || 'Network error')
      pushToast(err?.message || 'Network error', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await authApi.logout()
    } catch (_) {
      // ignore errors on logout
    }
    clearTokens()
    if (typeof window !== 'undefined') window.location.href = '/'
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8 pb-20"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h3 className="text-2xl font-black text-[#4D5D53] tracking-tight">System Settings</h3>
        <div className="flex bg-white p-1 rounded-xl border border-[#F0F0EE]">
           <button 
             onClick={() => setActiveTab('General')}
             className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'General' ? 'bg-[#4D5D53] text-white' : 'text-[#9A9A9A]'}`}
           >
             General
           </button>
           <button 
             onClick={() => setActiveTab('Profile')}
             className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'Profile' ? 'bg-[#4D5D53] text-white' : 'text-[#9A9A9A]'}`}
           >
             Profile
           </button>
        </div>
      </div>

      {toast && (
        <div className={`p-3 rounded-lg text-sm ${toast.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {toast.message}
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === 'General' ? (
          <motion.div
            key="general"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between px-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A]">Preferences & Security</p>
              <button onClick={handleSignOut} className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 rounded-xl px-4 py-2 transition-all">
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {SETTINGS_SECTIONS.map((section, idx) => (
                <div key={section.title} className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A] ml-2">
                    {section.title}
                  </h4>
                  <div className="space-y-3">
                    {section.items.map((item, i) => (
                      <motion.div
                        key={`item-${item.id}`}
                        initial={{ opacity: 0, x: -20, filter: 'blur(8px)' }}
                        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                        transition={{ delay: 0.1 * i + (idx * 0.3), duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        whileHover={{ backgroundColor: '#FAF9F6', borderColor: '#D4A373' }}
                        className="bg-white p-6 rounded-[2rem] border border-[#F0F0EE] group cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-[#FAF9F6] border border-[#F0F0EE] rounded-2xl flex items-center justify-center text-[#BDBDBD] group-hover:bg-white group-hover:text-[#D4A373] group-hover:shadow-md transition-all duration-500 transform group-hover:rotate-6">
                            <item.icon className="h-6 w-6" />
                          </div>
                          <div>
                            <h5 className="text-lg font-black text-[#4D5D53] tracking-tighter group-hover:text-[#D4A373] transition-colors">{item.label}</h5>
                            <p className="text-[10px] text-[#9A9A9A] font-black uppercase tracking-[0.15em] mt-1">{item.desc}</p>
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] border border-[#F0F0EE] flex items-center justify-center text-[#BDBDBD] group-hover:bg-[#4D5D53] group-hover:text-white transition-all duration-500 group-hover:translate-x-1">
                          <ChevronRight className="h-5 w-5" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="bg-white p-10 rounded-[2.5rem] border border-[#F0F0EE] shadow-sm">
               <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-[2rem] bg-[#F4F4F2] flex items-center justify-center text-[#D4A373] overflow-hidden border-4 border-white shadow-xl">
                       <User className="h-16 w-16 opacity-20" />
                    </div>
                    <button className="absolute -bottom-2 -right-2 p-3 bg-[#4D5D53] text-white rounded-2xl shadow-lg border-4 border-white group-hover:scale-110 transition-transform">
                       <Smartphone className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-center md:text-left">
                     <h4 className="text-2xl font-black text-[#4D5D53] tracking-tight">Alex Rivers</h4>
                     <p className="text-sm text-[#9A9A9A] font-bold">alex.rivers@university.edu</p>
                     <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                        <span className="px-3 py-1 bg-[#E9EDC9] text-[#4D5D53] rounded-full text-[8px] font-black uppercase tracking-widest">Resident</span>
                        <span className="px-3 py-1 bg-[#FAF9F6] border border-[#F0F0EE] text-[#9A9A9A] rounded-full text-[8px] font-black uppercase tracking-widest">Block B • Room 402</span>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A] ml-2">Display Name</label>
                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full p-4 bg-[#FAF9F6] border border-transparent rounded-2xl text-sm focus:border-[#D4A373] outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A] ml-2">Contact Number</label>
                    <input type="text" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} className="w-full p-4 bg-[#FAF9F6] border border-transparent rounded-2xl text-sm focus:border-[#D4A373] outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A] ml-2">Room Number</label>
                    <input type="text" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} className="w-full p-4 bg-[#FAF9F6] border border-transparent rounded-2xl text-sm focus:border-[#D4A373] outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A] ml-2">Student ID</label>
                    <input type="text" value={studentId} disabled className="w-full p-4 bg-[#F4F4F2] border border-transparent rounded-2xl text-sm text-[#9A9A9A] outline-none cursor-not-allowed" />
                  </div>
               </div>

               <div className="mt-10 flex justify-end">
                  <button onClick={handleSave} disabled={saving} className="px-8 py-4 bg-[#4D5D53] text-white rounded-2xl font-bold shadow-lg shadow-[#4D5D53]/20 hover:bg-[#3D4D43] transition-all">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-[#4D5D53] border border-[#3D4D43] p-10 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl shadow-[#4D5D53]/20">
         <div className="relative z-10">
           <h4 className="text-xl font-bold mb-2">Need help?</h4>
           <p className="text-emerald-50/50 text-sm mb-6 max-w-sm leading-relaxed">
             If you&apos;re having trouble with your account or have feedback, our support team is ready to help at any time.
           </p>
           <button className="px-6 py-3 bg-[#D4A373] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#C39262] transition-all">
             Contact Support
           </button>
         </div>
         <Globe className="absolute -right-10 -bottom-10 h-64 w-64 text-white/5" />
      </div>
    </motion.div>
  )
}
