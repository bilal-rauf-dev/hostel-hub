'use client'

import { useState } from 'react'
import { SplashScreen } from '@/components/splash-screen'
import { LoginForm } from '@/components/auth/login-form'
import { DashboardView } from '@/components/dashboard/dashboard-view'
import { motion, AnimatePresence } from 'motion/react'

type AppView = 'splash' | 'login' | 'dashboard'

export default function Home() {
  const [view, setView] = useState<AppView>('splash')

  return (
    <main className="min-h-screen bg-[#FAF9F6] overflow-hidden">
      <AnimatePresence mode="wait">
        {view === 'splash' && (
          <SplashScreen key="splash" onComplete={() => setView('login')} />
        )}
        
        {view === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.05 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            <LoginForm onLogin={() => setView('dashboard')} />
          </motion.div>
        )}

        {view === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ 
              duration: 1, 
              ease: [0.16, 1, 0.3, 1], // Custom cubic-bezier for professional feel
              delay: 0.2
            }}
            className="w-full h-full"
          >
            <DashboardView />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
