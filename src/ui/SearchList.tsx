import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { SearchLg, XClose } from '@untitledui/icons'
import { cn } from '@/lib/cn'
import { fadeUp, stagger } from '@/lib/motion'
import { Screen } from './Screen'

/* Figma: city / destination search (User_Details, Profile_From, New_trip_Destination, Dates_Origin,
   List_Admin_Custom_Search). Pill search field + close, then rows: country code (xs, muted) + name.
   Accent-insensitive matching ("Malaga" finds "Málaga"). */
export interface SearchItem {
  id: string
  name: string
  code: string
  detail?: string
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function SearchScreen({
  placeholder,
  items,
  onPick,
  onClose,
  label,
  initialQuery = '',
  emptyText = 'No matches. Try the nearest city with an airport.',
}: {
  placeholder: string
  items: SearchItem[]
  onPick: (item: SearchItem) => void
  onClose: () => void
  label: string
  initialQuery?: string
  emptyText?: string
}) {
  const [q, setQ] = useState(initialQuery)
  const input = useRef<HTMLInputElement>(null)
  // Focus once the modal has arrived (focusing mid-animation makes iOS scroll the page).
  useEffect(() => {
    const timer = setTimeout(() => input.current?.focus({ preventScroll: true }), 450)
    return () => clearTimeout(timer)
  }, [])
  const results = useMemo(() => {
    const n = norm(q.trim())
    const list = n ? items.filter((i) => norm(i.name).includes(n) || norm(i.detail ?? '').includes(n)) : items
    return list.slice(0, 60)
  }, [q, items])

  return (
    <Screen
      label={label}
      top={
        <div className="flex h-14 items-end gap-2 px-4">
          <label className="flex h-11 flex-1 items-center gap-2 rounded-full bg-surface-search px-3.5">
            <SearchLg aria-hidden width={20} height={20} className="shrink-0 text-ink-subtle" />
            <span className="sr-only">{label}</span>
            <input
              ref={input}
              type="search"
              enterKeyHint="go"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && results[0] && onPick(results[0])}
              placeholder={placeholder}
              className="h-full w-full bg-transparent text-md text-ink outline-none placeholder:text-ink-placeholder"
            />
          </label>
          <button type="button" onClick={onClose} aria-label="Close" className="hit-44 grid size-11 place-items-center text-ink-subtle">
            <XClose aria-hidden width={20} height={20} />
          </button>
        </div>
      }
    >
      <motion.ul variants={stagger} initial="hidden" animate="show" className="px-4 pt-3" aria-live="polite">
        {results.map((it) => (
          <motion.li key={it.id} variants={fadeUp}>
            <button
              type="button"
              onClick={() => onPick(it)}
              className={cn('flex min-h-12 w-full items-center gap-3 border-b border-line-divider text-left active:bg-surface-pressed')}
            >
              <span className="w-5 text-[10px] font-medium uppercase text-ink-subtle">{it.code}</span>
              <span className="flex-1 text-md font-medium text-ink">
                {it.name}
                {it.detail && <span className="ml-1 text-sm font-normal text-ink-muted">{it.detail}</span>}
              </span>
            </button>
          </motion.li>
        ))}
        {results.length === 0 && <li className="py-6 text-sm text-ink-muted">{emptyText}</li>}
      </motion.ul>
    </Screen>
  )
}
