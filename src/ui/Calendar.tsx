import { useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight } from '@untitledui/icons'
import { cn } from '@/lib/cn'
import { pop } from '@/lib/motion'
import { addDays, toDay, fromDay, type ISODate } from '@/engine'

/* Figma: "_Date picker menu" (Untitled UI) inside a Card. Month header with chevrons,
   Mo–Su labels, 40px day cells. Two modes:
   - select: tap or drag across days to toggle them (your availability, custom dates)
   - group:  read-only overlap; green = everyone free, light green = some, dots = who */
export interface GroupDayInfo {
  /** Colours of the members free that day (dots). */
  dots: string[]
  everyone: boolean
  /** Screen-reader text, e.g. "John, Gabriel free". */
  label: string
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const monthName = (y: number, m: number) => new Date(Date.UTC(y, m, 1)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })

export function monthDays(year: number, month: number): Array<ISODate | null> {
  const first = new Date(Date.UTC(year, month, 1))
  const lead = (first.getUTCDay() + 6) % 7 // Monday-first
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const cells: Array<ISODate | null> = Array(lead).fill(null)
  for (let d = 1; d <= count; d++) cells.push(fromDay(toDay(`${year}-${String(month + 1).padStart(2, '0')}-01`) + d - 1))
  while (cells.length % 7) cells.push(null)
  return cells
}

export function Calendar({
  month,
  onMonthChange,
  today,
  selected,
  onChange,
  group,
  readOnly,
}: {
  month: { year: number; month: number }
  onMonthChange: (m: { year: number; month: number }) => void
  today: ISODate
  selected?: Set<ISODate>
  onChange?: (next: Set<ISODate>) => void
  group?: Map<ISODate, GroupDayInfo>
  readOnly?: boolean
}) {
  const cells = useMemo(() => monthDays(month.year, month.month), [month])
  const drag = useRef<{ mode: 'add' | 'remove'; touched: Set<ISODate> } | null>(null)
  const [lastPopped, setLastPopped] = useState<ISODate | null>(null)
  const isPast = (d: ISODate) => toDay(d) < toDay(today)
  const interactive = !readOnly && !!onChange && !!selected

  const apply = (d: ISODate) => {
    if (!interactive || !drag.current || drag.current.touched.has(d) || isPast(d)) return
    drag.current.touched.add(d)
    const next = new Set(selected)
    if (drag.current.mode === 'add') next.add(d)
    else next.delete(d)
    setLastPopped(d)
    onChange!(next)
  }

  const dayAt = (x: number, y: number) => (document.elementFromPoint(x, y) as HTMLElement | null)?.closest<HTMLElement>('[data-day]')?.dataset.day

  const shift = (delta: number) => {
    const m = month.month + delta
    onMonthChange({ year: month.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-8 items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label="Previous month"
          className="hit-44 grid size-8 place-items-center rounded-sm text-ink-subtle"
        >
          <ChevronLeft aria-hidden width={20} height={20} />
        </button>
        <h3 className="text-sm font-semibold text-ink-secondary" aria-live="polite">
          {monthName(month.year, month.month)}
        </h3>
        <button type="button" onClick={() => shift(1)} aria-label="Next month" className="hit-44 grid size-8 place-items-center rounded-sm text-ink-subtle">
          <ChevronRight aria-hidden width={20} height={20} />
        </button>
      </div>

      <div
        role="grid"
        aria-label={monthName(month.year, month.month)}
        className="grid touch-none grid-cols-7 gap-y-1"
        onPointerMove={(e) => {
          if (!drag.current) return
          const d = dayAt(e.clientX, e.clientY)
          if (d) apply(d)
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onPointerLeave={() => (drag.current = null)}
      >
        <div role="row" className="contents">
          {WEEKDAYS.map((w) => (
            <div key={w} role="columnheader" aria-label={w} className="grid h-10 place-items-center text-sm font-medium text-ink-secondary">
              {w}
            </div>
          ))}
        </div>
        {/* Rows use display:contents so the 7-column CSS grid still lays out the cells. */}
        {Array.from({ length: cells.length / 7 }, (_, r) => (
          <div key={r} role="row" className="contents">
            {cells.slice(r * 7, r * 7 + 7).map((d, c) => {
              const i = r * 7 + c
              if (!d) return <div key={`e${i}`} role="gridcell" aria-hidden className="h-10" />
              const day = Number(d.slice(8))
              const past = isPast(d)
              const isToday = d === today
              const on = selected?.has(d)
              const g = group?.get(d)
              const label = new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' })
              return (
                <div key={d} role="gridcell" className="grid place-items-center">
                  <motion.button
                    type="button"
                    data-day={d}
                    disabled={past || (!interactive && !g)}
                    aria-pressed={interactive ? !!on : undefined}
                    aria-label={`${label}${on ? ', selected' : ''}${g ? `, ${g.label}` : ''}`}
                    variants={pop}
                    animate={lastPopped === d && on ? 'pop' : 'rest'}
                    onPointerDown={(e) => {
                      if (!interactive || past) return
                      ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
                      drag.current = { mode: on ? 'remove' : 'add', touched: new Set() }
                      apply(d)
                    }}
                    onKeyDown={(e) => {
                      if (!interactive || past || (e.key !== 'Enter' && e.key !== ' ')) return
                      e.preventDefault()
                      drag.current = { mode: on ? 'remove' : 'add', touched: new Set() }
                      apply(d)
                      drag.current = null
                    }}
                    className={cn(
                      'relative grid size-10 place-items-center rounded-full text-sm',
                      past && 'text-line',
                      !past && !on && !g && 'text-ink-secondary',
                      isToday && !on && !g?.everyone && 'bg-day-today font-medium',
                      on && 'bg-day-selected font-medium text-on-brand',
                      g?.everyone && 'bg-day-everyone font-medium text-on-brand',
                      g && !g.everyone && 'bg-day-some text-ink-secondary',
                    )}
                  >
                    {day}
                    {g && !g.everyone && g.dots.length > 0 && (
                      <span aria-hidden className="absolute bottom-1 flex -space-x-px">
                        {g.dots.slice(0, 4).map((c, j) => (
                          <span key={j} className="size-[5px] rounded-full ring-1 ring-day-some" style={{ background: c }} />
                        ))}
                      </span>
                    )}
                  </motion.button>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Every date of a month (for "Select all August"). */
export function allDaysOfMonth(year: number, month: number, from: ISODate): ISODate[] {
  return monthDays(year, month).filter((d): d is ISODate => !!d && toDay(d) >= toDay(from))
}

export { addDays }
