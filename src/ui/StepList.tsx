import { motion } from 'motion/react'
import { Check } from '@untitledui/icons'
import { cn } from '@/lib/cn'
import { fadeUp, stagger } from '@/lib/motion'

/* Figma: "Trip status - Journey A/B" = Untitled UI Progress steps (icons with text, size sm).
   complete = green check · current = brand dot with focus ring · upcoming = grey dot.
   Connector between steps: grey line (darker under completed steps). */
export type StepStatus = 'complete' | 'current' | 'upcoming'
export interface Step {
  id: string
  title: string
  detail: string
  status: StepStatus
}

export function StepList({ steps, label }: { steps: Step[]; label: string }) {
  return (
    <motion.ol aria-label={label} variants={stagger} initial="hidden" animate="show" className="flex flex-col">
      {steps.map((s, i) => {
        const last = i === steps.length - 1
        return (
          <motion.li key={s.id} variants={fadeUp} className="flex gap-3" aria-current={s.status === 'current' ? 'step' : undefined}>
            <div className={cn('flex w-6 flex-col items-center gap-1', !last && 'pb-1')}>
              <span
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-full',
                  s.status === 'complete' && 'bg-success text-on-brand',
                  s.status === 'current' && 'bg-brand-gradient shadow-focus',
                  s.status === 'upcoming' && 'border-[1.5px] border-line-subtle bg-surface',
                )}
              >
                {s.status === 'complete' && <Check aria-hidden width={12} height={12} strokeWidth={3} />}
                {s.status === 'current' && <span className="size-2 rounded-full bg-surface" />}
                {s.status === 'upcoming' && <span className="size-2 rounded-full bg-line" />}
              </span>
              {!last && <span className={cn('w-0.5 flex-1 rounded-full', s.status === 'complete' ? 'bg-line' : 'bg-line-subtle')} />}
            </div>
            <div className={cn('flex flex-col pt-0.5', !last && 'pb-6')}>
              <span
                className={cn(
                  'text-sm',
                  s.status === 'current' ? 'font-semibold text-ink-title' : s.status === 'complete' ? 'font-medium text-ink' : 'font-medium text-ink-muted',
                )}
              >
                {s.title}
                <span className="sr-only">{`, ${s.status === 'complete' ? 'done' : s.status === 'current' ? 'in progress' : 'not started'}`}</span>
              </span>
              <span className={cn('text-xs', s.status === 'current' ? 'text-ink-title' : s.status === 'complete' ? 'text-ink-muted' : 'text-ink-subtle')}>
                {s.detail}
              </span>
            </div>
          </motion.li>
        )
      })}
    </motion.ol>
  )
}
