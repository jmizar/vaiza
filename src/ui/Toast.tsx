import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { create } from 'zustand'
import { spring } from '@/lib/motion'

/* Short confirmation at the top of the device ("Link copied"). Not in Figma; minimal, glass,
   announced politely to screen readers. Sits above everything except the device chrome. */
interface ToastState {
  message: string | null
  id: number
  show: (message: string) => void
  clear: () => void
}
export const useToast = create<ToastState>((set) => ({
  message: null,
  id: 0,
  show: (message) => set((s) => ({ message, id: s.id + 1 })),
  clear: () => set({ message: null }),
}))
export const toast = (message: string) => useToast.getState().show(message)

export function Toaster() {
  const { message, id, clear } = useToast()
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(clear, 2400)
    return () => clearTimeout(timer)
  }, [message, id, clear])
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 flex justify-center px-4"
      style={{ top: 'calc(var(--safe-top) + 8px)', zIndex: 'var(--z-toast)' as unknown as number }}
    >
      <AnimatePresence>
        {message && (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: spring }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
            className="glass rounded-full px-4 py-2.5 text-sm font-medium text-ink"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
