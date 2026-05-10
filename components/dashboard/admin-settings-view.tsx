'use client'

import { motion } from 'motion/react'
import {
  Settings,
  Database,
  ShieldCheck,
  Lock,
  UserPlus,
  Bell,
  Save,
  RefreshCcw,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { settingsApi, usersApi } from '@/lib/api'

interface AdminSettingsViewProps {
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void
}

export function AdminSettingsView({ onToast }: AdminSettingsViewProps) {
  const [toggles, setToggles] = useState({
    registration_enabled: true,
    marketplace_enabled: true,
    maintenance_enabled: true,
    panic_button_enabled: true,
    maintenance_mode: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [roleCounts, setRoleCounts] = useState({ admin: 0, student: 0 })

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [settingsRes, usersRes, maintenanceRes] = await Promise.allSettled([
          settingsApi.getSettings(),
          usersApi.getAllUsers(),
          settingsApi.getMaintenance()
        ])

        let isMaintenance = false
        if (maintenanceRes.status === 'fulfilled' && maintenanceRes.value.data?.success) {
          isMaintenance = maintenanceRes.value.data.data.enabled
        }

        if (settingsRes.status === 'fulfilled' && settingsRes.value.data?.success) {
          const s = settingsRes.value.data.data
          setToggles({
            registration_enabled: s.registration_enabled === 'true',
            marketplace_enabled: s.marketplace_enabled === 'true',
            maintenance_enabled: s.maintenance_enabled === 'true',
            panic_button_enabled: s.panic_button_enabled === 'true',
            maintenance_mode: isMaintenance,
          })
        }

        if (usersRes.status === 'fulfilled' && usersRes.value.data?.success) {
          const users = usersRes.value.data.data || []
          setRoleCounts({
            admin: users.filter((u: any) => u.role === 'admin').length,
            student: users.filter((u: any) => u.role === 'student').length,
          })
        }
      } catch (e) {
        onToast('Failed to load settings', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      const settings: Record<string, string> = {}
      for (const [key, value] of Object.entries(toggles)) {
        if (key !== 'maintenance_mode') {
          settings[key] = String(value)
        }
      }
      
      const [settingsRes, maintenanceRes] = await Promise.all([
        settingsApi.updateSettings(settings),
        settingsApi.toggleMaintenance(toggles.maintenance_mode)
      ])

      if (settingsRes.data?.success && maintenanceRes.data?.success) {
        onToast('Settings saved successfully', 'success')
      } else {
        onToast('Failed to save some settings', 'error')
      }
    } catch (e: any) {
      onToast(e?.message || 'Network error', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleRefresh = async () => {
    try {
      const [res, maintRes] = await Promise.all([
        settingsApi.getSettings(),
        settingsApi.getMaintenance()
      ])
      
      if (res.data?.success && maintRes.data?.success) {
        const s = res.data.data
        setToggles({
          registration_enabled: s.registration_enabled === 'true',
          marketplace_enabled: s.marketplace_enabled === 'true',
          maintenance_enabled: s.maintenance_enabled === 'true',
          panic_button_enabled: s.panic_button_enabled === 'true',
          maintenance_mode: maintRes.data.data.enabled,
        })
        onToast('Settings refreshed', 'info')
      }
    } catch (e) {
      onToast('Failed to refresh', 'error')
    }
  }

  const featureItems = [
    { id: 'registration_enabled' as const, label: 'Resident Registration', desc: 'Allow new students to sign up.', icon: UserPlus },
    { id: 'marketplace_enabled' as const, label: 'Marketplace Operations', desc: 'Enable listing and ordering features.', icon: Database },
    { id: 'maintenance_enabled' as const, label: 'Ticket System', desc: 'Allow residents to submit maintenance requests.', icon: Settings },
    { id: 'panic_button_enabled' as const, label: 'Emergency Panic Button', desc: 'Direct link to hostel security response.', icon: Lock },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-3xl font-black text-[#4D5D53] tracking-tighter">System Controls</h3>
          <p className="text-sm text-[#9A9A9A] font-medium mt-1">Global feature flags and backend configuration.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="px-8 py-3 bg-[#4D5D53] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#3D4D43] transition-all shadow-xl shadow-[#4D5D53]/20 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-sm text-[#9A9A9A]">Loading settings...</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          <div className="xl:col-span-2 space-y-8">
            {/* Feature Flags */}
            <div className="bg-white p-10 rounded-[3rem] border border-[#F0F0EE] shadow-sm">
              <div className="flex items-center justify-between mb-10">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A]">Feature Switches</h4>
                <button onClick={handleRefresh}>
                  <RefreshCcw className="h-4 w-4 text-[#BDBDBD] cursor-pointer hover:rotate-180 transition-transform duration-500" />
                </button>
              </div>

              <div className="divide-y divide-black/5">
                {featureItems.map((item) => (
                  <div key={item.id} className="py-8 first:pt-0 last:pb-0 flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                      <div className="p-4 bg-[#FAF9F6] rounded-2xl text-[#BDBDBD] group-hover:bg-[#FEFAE0] group-hover:text-[#D4A373] transition-all">
                        <item.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h5 className="text-sm font-black text-[#4D5D53]">{item.label}</h5>
                        <p className="text-xs text-[#9A9A9A] font-medium mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setToggles(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                      className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${toggles[item.id] ? 'bg-emerald-500' : 'bg-[#EFEFE9]'}`}
                    >
                      <motion.div
                        animate={{ x: toggles[item.id] ? 24 : 4 }}
                        className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm"
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Role Management */}
            <div className="bg-white p-10 rounded-[3rem] border border-[#F0F0EE] shadow-sm">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A] mb-8">Role Overview</h4>
              <div className="space-y-4">
                {[
                  { role: 'Admin', count: roleCounts.admin, icon: ShieldCheck, color: 'text-purple-500' },
                  { role: 'Student', count: roleCounts.student, icon: UserPlus, color: 'text-blue-500' },
                ].map((r) => (
                  <div key={r.role} className="p-6 bg-[#FAF9F6] rounded-[2rem] flex items-center justify-between border border-transparent hover:border-[#F0F0EE] hover:bg-white transition-all group">
                    <div className="flex items-center gap-6">
                      <div className={`p-3 bg-white rounded-xl shadow-sm ${r.color} group-hover:scale-110 transition-transform`}>
                        <r.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#4D5D53]">{r.role}</p>
                        <p className="text-[10px] font-bold text-[#9A9A9A]">{r.count} registered users</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-[#4D5D53] p-10 rounded-[3rem] text-white space-y-8">
              <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">System Information</h4>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#E9EDC9] mb-1">Environment</p>
                  <p className="text-sm font-bold">Production (Hostel Cluster)</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#E9EDC9] mb-1">API Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                    <p className="text-sm font-bold">All services operational</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#E9EDC9] mb-1">Maintenance Mode</p>
                  <p className={`text-sm font-bold ${toggles.maintenance_mode ? 'text-orange-300' : 'text-emerald-300'}`}>
                    {toggles.maintenance_mode ? 'ACTIVE' : 'Inactive'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-10 bg-white border border-[#F0F0EE] rounded-[3rem] shadow-sm flex flex-col items-center text-center space-y-4">
              <div className={`p-4 rounded-2xl ${toggles.maintenance_mode ? 'bg-orange-100 text-orange-600' : 'bg-[#FAF9F6] text-orange-500'}`}>
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h5 className="text-sm font-black text-[#4D5D53]">Maintenance Mode</h5>
              <p className="text-xs text-[#9A9A9A] font-medium leading-relaxed">
                {toggles.maintenance_mode
                  ? 'System is currently in maintenance mode. Student logins are disabled.'
                  : 'Enabling this will disable all public student login interfaces.'}
              </p>
              <button
                onClick={() => {
                  setToggles(prev => ({ ...prev, maintenance_mode: !prev.maintenance_mode }))
                  onToast(
                    toggles.maintenance_mode ? 'Maintenance mode will be disabled on save' : 'Maintenance mode will be enabled on save',
                    'info'
                  )
                }}
                className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  toggles.maintenance_mode
                    ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600'
                    : 'border-orange-200 text-orange-600 hover:bg-orange-50'
                }`}
              >
                {toggles.maintenance_mode ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
