'use client'

import { motion, AnimatePresence } from 'motion/react'
import { Building2, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false)
      setTimeout(onComplete, 1000) // Give time for exit animation
    }, 3000)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAF9F6] text-[#4D5D53]"
        >
          <div className="relative">
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{
                duration: 1.2,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.2
              }}
              className="relative z-10"
            >
              <div className="flex items-center justify-center w-24 h-24 bg-[#D4A373] rounded-3xl shadow-2xl shadow-[#D4A373]/20">
                <Building2 className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="absolute -top-4 -right-4 text-[#D4A373]"
            >
              <Sparkles className="w-8 h-8" />
            </motion.div>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-8 text-center"
          >
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl text-[#4D5D53]">
              Hostel<span className="text-[#D4A373]">Hub</span>
            </h1>
            <p className="mt-2 text-[#79837C] font-semibold tracking-widest uppercase text-xs">
              COMMUNITY • COMMERCE • CARE
            </p>
          </motion.div>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 200 }}
            transition={{ delay: 1.5, duration: 1.5, ease: "easeInOut" }}
            className="absolute bottom-20 h-0.5 bg-gradient-to-r from-transparent via-[#D4A373] to-transparent"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
