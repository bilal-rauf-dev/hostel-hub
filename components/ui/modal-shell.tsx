'use client'

import { motion, AnimatePresence } from 'motion/react'
import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'

/**
 * The three marketplace modals all repeated the same portal, backdrop and
 * entrance animation. This holds it once, and adds the keyboard and focus
 * behaviour they were all missing.
 */
export function ModalShell({
  open,
  onClose,
  labelledBy,
  className = 'max-w-lg p-6 rounded-[2rem]',
  children,
}: {
  open: boolean
  onClose: () => void
  labelledBy: string
  className?: string
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<Element | null>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement
    panelRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)

    return () => {
      document.removeEventListener('keydown', onKey)
      ;(previouslyFocused.current as HTMLElement | null)?.focus?.()
    }
  }, [open, onClose])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-overlay"
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
        >
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="modal-content"
            ref={panelRef}
            tabIndex={-1}
            initial={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`relative bg-white w-full mx-4 shadow-2xl z-10 outline-none ${className}`}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
