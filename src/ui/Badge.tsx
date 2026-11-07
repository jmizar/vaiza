import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/* Figma: Badge (Untitled UI "Pill color"). Trip status chips use size md; the travel-window
   "Provisional" uses size sm with a border; "Best" uses the peach tint. */
export type BadgeTone = 'ready' | 'voting' | 'draft' | 'provisional' | 'best'

const tone: Record<BadgeTone, string> = {
  ready: 'bg-success-tint text-success-ink',
  voting: 'bg-info-tint text-info-ink',
  draft: 'bg-neutral-tint text-neutral-ink',
  provisional: 'bg-provisional-tint text-provisional-ink border border-provisional-line',
  best: 'bg-tint-best text-ink-brand',
}

export function Badge({ tone: t, size = 'md', children, className }: { tone: BadgeTone; size?: 'md' | 'sm'; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full font-medium',
        size === 'md' ? 'px-2.5 py-0.5 text-sm' : 'px-2 py-0.5 text-xs',
        tone[t],
        className,
      )}
    >
      {children}
    </span>
  )
}
