import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Check } from '@untitledui/icons'
import { cn } from '@/lib/cn'
import { pop, press } from '@/lib/motion'

/* Selected state in Figma = 2px brand-gradient border. We add a small check mark so the
   selection doesn't rely on colour alone (flagged in the audit, visual otherwise unchanged). */
const selectedRing =
  'before:absolute before:inset-0 before:rounded-[inherit] before:p-[2px] before:[background:var(--gradient-best)] before:[mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)]'

/* ------------------------------------------------------------------ ToggleChip
   Figma: "Pill" (activities, trip-name presets). 34px, border line-input, text xs medium. */
export function ToggleChip({ selected, onToggle, children }: { selected: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      {...press}
      variants={pop}
      animate={selected ? 'pop' : 'rest'}
      className={cn(
        'relative inline-flex h-[34px] items-center gap-1 rounded-full border bg-surface px-3 text-xs font-medium text-ink hit-44',
        selected ? `border-transparent ${selectedRing}` : 'border-line-input',
      )}
    >
      {children}
    </motion.button>
  )
}

/* ------------------------------------------------------------------ OptionCard
   Figma: daily budget cards (Budget / Moderate / Premium / No limit). Radio semantics. */
export function OptionCard({
  selected,
  onSelect,
  symbol,
  title,
  caption,
}: {
  selected: boolean
  onSelect: () => void
  symbol: string
  title: string
  caption: string
}) {
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      {...press}
      className={cn(
        'relative flex min-h-[104px] flex-col items-center justify-center gap-0.5 rounded-3xl bg-surface p-4 text-center shadow-card',
        selected && selectedRing,
      )}
    >
      <span aria-hidden className="text-md font-semibold text-ink">
        {symbol}
      </span>
      <span className="text-md font-semibold text-ink">{title}</span>
      <span className="text-sm text-ink-muted">{caption}</span>
      {selected && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute right-2.5 top-2.5 grid size-4 place-items-center rounded-full bg-brand-gradient text-on-brand"
        >
          <Check aria-hidden width={10} height={10} strokeWidth={3} />
        </motion.span>
      )}
    </motion.button>
  )
}
