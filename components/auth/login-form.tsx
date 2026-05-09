'use client'

import { motion } from 'motion/react'
import { Building2, Mail, Lock, ArrowRight, Github } from 'lucide-react'
import { useState } from 'react'

interface LoginFormProps {
  onLogin: () => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('alex.rivers@hostel.edu')
  const [otp, setOtp] = useState(['4', '8', '', ''])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Logging in...', { email, otp: otp.join('') })
    onLogin()
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#FAF9F6] font-sans text-[#3D3D3D]">
      {/* LEFT PANEL: Brand & Community Splash */}
      <div className="relative hidden lg:flex w-3/5 h-full bg-[#E9EDC9] flex-col justify-center items-center p-16 overflow-hidden">
        {/* Abstract Organic Shapes */}
        <motion.div 
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#CCD5AE] rounded-full mix-blend-multiply filter blur-3xl opacity-40" 
        />
        <motion.div 
          animate={{
            x: [0, -50, 30, 0],
            y: [0, 40, -20, 0],
            scale: [1, 0.8, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-[5%] right-[-5%] w-[300px] h-[300px] bg-[#FEFAE0] rounded-full mix-blend-multiply filter blur-3xl opacity-60" 
        />
        
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          {/* Stylized Logo */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-20 h-20 bg-[#D4A373] rounded-[2rem] flex items-center justify-center shadow-lg transform rotate-3">
              <Building2 className="h-12 w-12 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold tracking-tight text-[#4D5D53]">
                Hostel<span className="text-[#D4A373]">Hub</span>
              </h1>
              <p className="text-[#79837C] font-semibold tracking-widest text-sm">
                COMMUNITY • COMMERCE • CARE
              </p>
            </div>
          </div>

          <div className="space-y-6 max-w-md">
            <h2 className="text-3xl font-semibold leading-tight text-[#4D5D53]">
              Your entire hostel ecosystem, in one digital pocket.
            </h2>
            <p className="text-lg text-[#79837C] leading-relaxed">
              Join 1,200+ students already managing maintenance, marketplace finds, and community events through Hostel-Hub.
            </p>
            
            {/* Social Proof Chips */}
            <div className="flex flex-wrap gap-3 pt-4">
              <div className="px-4 py-2 bg-white/50 backdrop-blur-md rounded-full border border-white/40 text-xs font-bold text-[#4D5D53]">✨ 14 Active Events</div>
              <div className="px-4 py-2 bg-white/50 backdrop-blur-md rounded-full border border-white/40 text-xs font-bold text-[#4D5D53]">🛠 98% Fix Rate</div>
              <div className="px-4 py-2 bg-white/50 backdrop-blur-md rounded-full border border-white/40 text-xs font-bold text-[#4D5D53]">📦 42 New Listings</div>
            </div>
          </div>
        </motion.div>

        {/* Bottom Branding */}
        <div className="absolute bottom-10 left-16 text-xs text-[#79837C] font-bold uppercase tracking-widest">
          © 2026 University Residential Services
        </div>
      </div>

      {/* RIGHT PANEL: Login Interface */}
      <div className="w-full lg:w-2/5 h-full bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.02)] flex flex-col justify-center px-8 sm:px-16 relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-sm mx-auto"
        >
          <div className="mb-10">
            <h3 className="text-2xl font-bold text-[#4D5D53] mb-2 uppercase tracking-tight">Welcome Back</h3>
            <p className="text-[#9A9A9A] text-sm">Please log in with your university credentials.</p>
          </div>

          <form className="space-y-10" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-[#BDBDBD] mb-4">University Email Address</label>
              <div className="relative group/field">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#BDBDBD] group-focus-within/field:text-[#D4A373] transition-colors" />
                <input 
                  type="email" 
                  placeholder="name@hostel.edu" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 rounded-3xl bg-[#FAF9F6] border-2 border-transparent focus:border-[#D4A373] focus:bg-white focus:ring-8 focus:ring-[#D4A373]/5 outline-none transition-all placeholder:text-[#BDBDBD] text-base font-bold tracking-tight hover:bg-[#FAF9F6]/50"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-4 text-[10px] font-black uppercase tracking-[0.25em] text-[#BDBDBD]">
                <label>Verification OTP</label>
                <button type="button" className="text-[#D4A373] hover:text-[#C49363] hover:underline underline-offset-4 cursor-pointer transition-colors">Resend Code</button>
              </div>
              <div className="flex gap-4">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const newOtp = [...otp]
                      newOtp[i] = e.target.value
                      setOtp(newOtp)
                    }}
                    placeholder="•"
                    className={`w-full h-16 bg-[#FAF9F6] rounded-2xl text-center font-black text-2xl outline-none border-2 transition-all hover:bg-[#FAF9F6]/50 ${digit ? 'border-[#D4A373] bg-white shadow-lg shadow-[#D4A373]/10' : 'border-transparent focus:border-[#D4A373] focus:ring-8 focus:ring-[#D4A373]/5'}`}
                  />
                ))}
              </div>
            </div>

            <motion.button 
              type="submit"
              whileHover={{ 
                backgroundColor: '#3D4D43',
                y: -1
              }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-[#404F46] text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-[#4D5D53]/20 transition-all flex items-center justify-center gap-3 group relative overflow-hidden text-sm uppercase tracking-widest"
            >
              <span className="relative z-10">Enter the Hub</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </motion.button>
          </form>

          <div className="mt-14 pt-10 border-t border-[#F0F0EE]">
            <div className="flex flex-col gap-6">
              <p className="text-[10px] text-[#BDBDBD] font-black text-center uppercase tracking-[0.25em]">Access External Portals</p>
              <div className="grid grid-cols-2 gap-4 text-center">
                <motion.button 
                  whileHover={{ backgroundColor: '#E9EDC9', scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center justify-center gap-3 py-5 px-4 border-2 border-[#E9EDC9] rounded-3xl text-[10px] font-black text-[#4D5D53] transition-all uppercase tracking-widest group"
                >
                  <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:rotate-12 transition-transform">
                    <Mail className="h-4 w-4 text-[#D4A373]" />
                  </div>
                  Digital Guide
                </motion.button>
                <motion.button 
                  whileHover={{ backgroundColor: '#FEFAE0', scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center justify-center gap-3 py-5 px-4 border-2 border-[#FEFAE0] rounded-3xl text-[10px] font-black text-[#4D5D53] transition-all uppercase tracking-widest group"
                >
                  <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:-rotate-12 transition-transform">
                    <Github className="h-4 w-4 text-emerald-600" />
                  </div>
                  Staff Access
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
