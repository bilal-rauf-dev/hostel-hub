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
  ToggleLeft,
  ChevronRight
} from 'lucide-react'
import { useState } from 'react'

export function AdminSettingsView() {
  const [toggles, setToggles] = useState({
    registration: true,
    marketplace: true,
    maintenance: true,
    panicButton: true
  })

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
        <button className="px-8 py-3 bg-[#4D5D53] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#3D4D43] transition-all shadow-xl shadow-[#4D5D53]/20">
           <Save className="h-4 w-4" />
           Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-2 space-y-8">
           {/* Feature Flags */}
           <div className="bg-white p-10 rounded-[3rem] border border-[#F0F0EE] shadow-sm">
              <div className="flex items-center justify-between mb-10">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A]">Feature Switches</h4>
                 <RefreshCcw className="h-4 w-4 text-[#BDBDBD] cursor-pointer hover:rotate-180 transition-transform duration-500" />
              </div>
              
              <div className="divide-y divide-black/5">
                {[
                  { id: 'registration', label: 'Resident Registration', desc: 'Allow new students to sign up via SSO.', icon: UserPlus },
                  { id: 'marketplace', label: 'Marketplace Operations', desc: 'Enable listing and messaging features.', icon: Database },
                  { id: 'maintenance', label: 'Ticket System', desc: 'Allow residents to submit maintenance requests.', icon: Settings },
                  { id: 'panicButton', label: 'Emergency Panic Button', desc: 'Direct link to hostel security response.', icon: Lock },
                ].map((item) => (
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
                      onClick={() => setToggles(prev => ({ ...prev, [item.id as keyof typeof toggles]: !prev[item.id as keyof typeof toggles] }))}
                      className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${toggles[item.id as keyof typeof toggles] ? 'bg-emerald-500' : 'bg-[#EFEFE9]'}`}
                    >
                       <motion.div 
                          animate={{ x: toggles[item.id as keyof typeof toggles] ? 24 : 4 }}
                          className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm"
                       />
                    </button>
                  </div>
                ))}
              </div>
           </div>

           {/* Access Management */}
           <div className="bg-white p-10 rounded-[3rem] border border-[#F0F0EE] shadow-sm">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#9A9A9A] mb-8">Role Management</h4>
              <div className="space-y-4">
                 {[
                   { role: 'Super Admin', users: 2, icon: ShieldCheck, color: 'text-purple-500' },
                   { role: 'Staff Member', users: 8, icon: Settings, color: 'text-blue-500' },
                   { role: 'Security Post', users: 15, icon: Lock, color: 'text-orange-500' },
                 ].map((r) => (
                   <div key={r.role} className="p-6 bg-[#FAF9F6] rounded-[2rem] flex items-center justify-between cursor-pointer hover:bg-white border border-transparent hover:border-[#F0F0EE] transition-all group">
                      <div className="flex items-center gap-6">
                        <div className={`p-3 bg-white rounded-xl shadow-sm ${r.color} group-hover:scale-110 transition-transform`}>
                           <r.icon className="h-5 w-5" />
                        </div>
                        <div>
                           <p className="text-sm font-black text-[#4D5D53]">{r.role}</p>
                           <p className="text-[10px] font-bold text-[#9A9A9A]">{r.users} assigned users</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-[#BDBDBD] group-hover:text-[#4D5D53] transition-colors" />
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-8">
           <div className="bg-[#4D5D53] p-10 rounded-[3rem] text-white space-y-8">
              <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">System Information</h4>
              <div className="space-y-6">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#E9EDC9] mb-1">Environment</p>
                    <p className="text-sm font-bold">Production (Hostel Cluster)</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#E9EDC9] mb-1">Last Deployment</p>
                    <div className="flex items-center gap-2">
                       <p className="text-sm font-bold">Oct 29, 2024</p>
                       <span className="text-[8px] font-black px-1.5 py-0.5 bg-white/20 rounded">STABLE</span>
                    </div>
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#E9EDC9] mb-1">API Status</p>
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                       <p className="text-sm font-bold">All services operational</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="p-10 bg-white border border-[#F0F0EE] rounded-[3rem] shadow-sm flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-[#FAF9F6] rounded-2xl text-orange-500">
                 <Bell className="h-6 w-6" />
              </div>
              <h5 className="text-sm font-black text-[#4D5D53]">Maintenance Mode</h5>
              <p className="text-xs text-[#9A9A9A] font-medium leading-relaxed">
                Putting the system in maintenance mode will disable all public student login interfaces.
              </p>
              <button className="w-full py-4 border border-orange-200 text-orange-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-50 transition-all">
                Trigger Maintenance
              </button>
           </div>
        </div>
      </div>
    </motion.div>
  )
}
