import { useEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { XClose } from '@untitledui/icons'
import { cn } from '@/lib/cn'
import { durations, sheet } from '@/lib/motion'

/* Bottom sheet: dimmed scrim (Figma "Background overlay", 10% ink) + spring panel.
   Figma (Trip_Window_Hint_User): full width, radius 24 on top, padding 20, close on its own row.
   Accessibility: role=dialog, aria-modal, focus moves in on open and back on close, Escape closes.
   Rendered inside the device frame so it respects the 440px column on desktop. */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  variant = 'sheet',
  className,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  children: ReactNode
  /** sheet = full-width panel from the bottom · menu = floating glass card above the FAB */
  variant?: 'sheet' | 'menu'
  className?: string
}) {
  const panel = useRef<HTMLDivElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    returnTo.current = document.activeElement as HTMLElement
    const t = setTimeout(() => panel.current?.querySelector<HTMLElement>('button, a, input, [tabindex]')?.focus(), 50)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      returnTo.current?.focus?.()
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0" style={{ zIndex: 'var(--z-sheet)' as unknown as number }}>
          <motion.div
            className="absolute inset-0 bg-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: durations.base }}
            onClick={onClose}
            aria-hidden
          />
          {variant === 'sheet' ? (
            <motion.div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              variants={sheet}
              initial="hidden"
              animate="show"
              exit="exit"
              className={cn(
                'absolute inset-x-0 bottom-0 flex max-h-[calc(100%-var(--safe-top)-16px)] flex-col gap-4 overflow-y-auto rounded-t-4xl border border-surface bg-surface p-5 pb-[max(var(--safe-bottom),20px)]',
                className,
              )}
            >
              <div className="flex justify-end">
                <button type="button" onClick={onClose} aria-label="Close" className="hit-44 grid size-5 place-items-center text-ink-subtle">
                  <XClose aria-hidden width={20} height={20} />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <h2 className="text-xl font-medium text-ink-secondary">{title}</h2>
                {description && <div className="text-sm text-ink-muted">{description}</div>}
              </div>
              {children}
            </motion.div>
          ) : (
            <motion.div
              ref={panel}
              role="menu"
              aria-label={title}
              initial={{ opacity: 0, scale: 0.6, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.6, y: 24 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              style={{ transformOrigin: 'calc(100% - 30px) 100%' }}
              className={cn('glass absolute inset-x-5 bottom-[max(calc(var(--safe-bottom)-14px),16px)] rounded-3xl p-2.5', className)}
            >
              {children}
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  )
}
