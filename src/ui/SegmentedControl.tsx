import { useId } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { spring } from '@/lib/motion'

/* Figma: Horizontal tabs (white pill, 44px, two equal tabs). The selected background slides
   between tabs (Liquid Glass "morph"). Tab semantics for screen readers. */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (v: T) => void
  options: Array<{ value: T; label: string }>
  label: string
}) {
  const id = useId()
  return (
    <div role="tablist" aria-label={label} className="flex h-11 items-center gap-1 rounded-full bg-surface p-1 shadow-segment">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative flex h-9 flex-1 items-center justify-center rounded-full px-3 text-sm font-semibold',
              on ? 'text-ink' : 'text-ink-secondary',
            )}
          >
            {on && <motion.span layoutId={`seg-${id}`} transition={spring} className="absolute inset-0 rounded-full bg-surface-selected" />}
            <span className="relative">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
