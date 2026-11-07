import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { useNavigate, useParams } from 'react-router'
import { ArrowRight, CalendarPlus01, Check, ChevronLeft, X, XClose } from '@untitledui/icons'
import { t } from '@/copy'
import { cityLabel, me, todayISO } from '@/domain/trip'
import { cn } from '@/lib/cn'
import { fadeUp, pop, press, stagger } from '@/lib/motion'
import { useBack } from '@/app/stack'
import { useTrip, useApp } from '@/store/app'
import { useDrafts } from '@/store/drafts'
import { Button, IconButton } from '@/ui/Button'
import { Calendar, allDaysOfMonth } from '@/ui/Calendar'
import { SelectRow } from '@/ui/Field'
import { BottomBar, NavBar, Screen } from '@/ui/Screen'
import { Sheet } from '@/ui/Sheet'
import { Card, Divider, PageHeader } from '@/ui/Surface'

/* Figma: Dates (1:48000 empty · 1:48129 selected · 1:48242 all month · 1:53555 from the trip).
   Inside the create flow it's a modal step (close + Skip); from the trip screen it's a push (back).
   Unsaved picks live in a draft so opening the city search doesn't lose them. */
const DURATIONS = [undefined, 3, 5, 7, 10, 12, 14, 21] as const
const monthLong = (y: number, m: number) => new Date(Date.UTC(y, m, 1)).toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' })

export function Dates({ flow }: { flow?: 'new' }) {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const back = useBack(`/trip/${id}`)
  const trip = useTrip(id)
  const setMyDates = useApp((s) => s.setMyDates)
  const draft = useDrafts((s) => s.dates[id])
  const setDraft = useDrafts((s) => s.setDates)
  const clearDraft = useDrafts((s) => s.clearDates)
  const [durationOpen, setDurationOpen] = useState(false)
  const today = todayISO()
  const mine = trip ? me(trip) : undefined

  // First open: start the draft from what you saved before.
  useEffect(() => {
    if (draft || !mine) return
    const first = mine.dates[0] ?? today
    setDraft(id, {
      dates: mine.dates,
      cityId: mine.cityId,
      maxTripDays: mine.maxTripDays,
      month: { year: Number(first.slice(0, 4)), month: Number(first.slice(5, 7)) - 1 },
    })
  }, [draft, mine, id, setDraft, today])

  const selected = useMemo(() => new Set(draft?.dates ?? []), [draft?.dates])
  const month = draft?.month ?? { year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 }
  const monthDays = allDaysOfMonth(month.year, month.month, today)
  const allSelected = monthDays.length > 0 && monthDays.every((d) => selected.has(d))
  const name = monthLong(month.year, month.month)

  const setSelected = (next: Set<string>) => setDraft(id, { dates: [...next].sort() })
  const toggleMonth = () => {
    const next = new Set(selected)
    for (const d of monthDays) {
      if (allSelected) next.delete(d)
      else next.add(d)
    }
    setSelected(next)
  }

  const prefsPath = `/trip/${id}/preferences${flow === 'new' ? '/new' : ''}`
  const submit = () => {
    if (!draft || selected.size === 0) return
    setMyDates(id, draft.dates, { maxTripDays: draft.maxTripDays, cityId: draft.cityId })
    clearDraft(id)
    void navigate(prefsPath)
  }

  if (!trip) return null

  return (
    <Screen
      label={t.dates.title}
      top={
        <NavBar
          left={
            flow === 'new' ? (
              <IconButton icon={XClose} label={t.common.close} onClick={() => back()} />
            ) : (
              <IconButton icon={ChevronLeft} label={t.common.back} onClick={() => back()} />
            )
          }
          right={
            flow === 'new' && (
              <Button variant="tertiary" size="sm" onClick={() => void navigate(prefsPath)}>
                {t.dates.skip}
              </Button>
            )
          }
        />
      }
      bottom={
        <BottomBar>
          <Button fullWidth disabled={selected.size === 0} iconRight={ArrowRight} onClick={submit}>
            {t.dates.next}
          </Button>
        </BottomBar>
      }
      overlay={
        <Sheet open={durationOpen} onClose={() => setDurationOpen(false)} title={t.dates.durationSheet} description={t.dates.durationHint}>
          <div role="radiogroup" aria-label={t.dates.durationSheet} className="flex flex-col">
            {DURATIONS.map((d, i) => {
              const on = draft?.maxTripDays === d
              return (
                <div key={d ?? 'none'}>
                  {i > 0 && <Divider />}
                  <motion.button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    {...press}
                    onClick={() => {
                      setDraft(id, { maxTripDays: d })
                      setDurationOpen(false)
                    }}
                    className="flex h-12 w-full items-center justify-between text-left text-md text-ink"
                  >
                    {d ? t.dates.count(d) : t.dates.noLimit}
                    {on && <Check aria-hidden width={20} height={20} className="text-brand" />}
                  </motion.button>
                </div>
              )
            })}
          </div>
        </Sheet>
      }
    >
      <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-4 px-4 pt-5">
        <motion.div variants={fadeUp} className="pb-2">
          <PageHeader size="md" title={t.dates.title} subtitle={t.dates.subtitle} />
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="px-4 py-1">
            <SelectRow label={t.dates.from} value={cityLabel(draft?.cityId)} onPress={() => void navigate(`/trip/${id}/dates/origin`)} />
            <Divider />
            <SelectRow
              label={t.dates.maxDuration}
              value={draft?.maxTripDays ? t.dates.count(draft.maxTripDays) : undefined}
              placeholder={t.dates.select}
              onPress={() => setDurationOpen(true)}
            />
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="flex flex-col gap-4 p-4">
            <Calendar month={month} onMonthChange={(m) => setDraft(id, { month: m })} today={today} selected={selected} onChange={setSelected} />
            <div className="flex min-h-9 items-center justify-between gap-2">
              <Button variant="secondary" size="sm" onClick={toggleMonth} disabled={monthDays.length === 0}>
                {allSelected ? t.dates.deselectAll(name) : t.dates.selectAll(name)}
              </Button>
              {selected.size > 0 && <CountChip count={selected.size} onClear={() => setSelected(new Set())} />}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </Screen>
  )
}

/** "9 days" chip with a clear button (Figma: calendar-plus-01 + count + x). */
export function CountChip({ count, onClear }: { count: number; onClear: () => void }) {
  return (
    <motion.span
      variants={pop}
      initial="rest"
      animate="pop"
      key={count}
      className="flex h-9 items-center gap-1.5 rounded-full border border-line-subtle bg-surface pl-3 pr-1 text-sm font-semibold text-ink-secondary"
      aria-live="polite"
    >
      <CalendarPlus01 aria-hidden width={16} height={16} className="text-brand" />
      {t.dates.count(count)}
      <button type="button" onClick={onClear} aria-label={t.dates.clear} className={cn('hit-44 grid size-7 place-items-center text-ink-subtle')}>
        <X aria-hidden width={14} height={14} />
      </button>
    </motion.span>
  )
}
