import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate, useParams } from 'react-router'
import { AlertCircle, ChevronLeft, ChevronRight, Clock, Lightbulb04, Lock03 } from '@untitledui/icons'
import { t } from '@/copy'
import { addDays, availabilityByDay, type ISODate, type TravelWindow as Window } from '@/engine'
import { formatRange, ME, toEngineMember, todayISO, tripHintsOf, tripWindowsOf } from '@/domain/trip'
import { cn } from '@/lib/cn'
import { fadeUp, press, stagger } from '@/lib/motion'
import { useBack } from '@/app/stack'
import { useApp, useIsOrganizer, useTrip, type Trip } from '@/store/app'
import { Badge } from '@/ui/Badge'
import { Button, IconButton } from '@/ui/Button'
import { Calendar, type GroupDayInfo } from '@/ui/Calendar'
import { Avatar } from '@/ui/Media'
import { BottomBar, NavBar, Screen } from '@/ui/Screen'
import { SegmentedControl } from '@/ui/SegmentedControl'
import { Sheet } from '@/ui/Sheet'
import { Card, Divider, OrDivider, PageHeader, SectionHeader } from '@/ui/Surface'
import { toast } from '@/ui/Toast'

/* Figma: Trip window (1:58706 user · 1:58767 in progress · 1:59227 hint · 1:58834/1:58962 group
   calendar · 1:59087/1:59154 organiser). Windows and hints come from the engine. */
type TabId = 'best' | 'calendar'
const MEMBER_COLOURS = ['member-1', 'member-2', 'member-3', 'member-4', 'member-5', 'member-6'] as const
const colourVar = (i: number) => `var(--color-${MEMBER_COLOURS[i % MEMBER_COLOURS.length]})`

export function TravelWindow({ initialTab = 'best' }: { initialTab?: TabId }) {
  const { id = '' } = useParams()
  const trip = useTrip(id)
  if (!trip) return null
  return <TravelWindowView trip={trip} initialTab={initialTab} />
}

function TravelWindowView({ trip, initialTab }: { trip: Trip; initialTab: TabId }) {
  const navigate = useNavigate()
  const back = useBack(`/trip/${trip.id}`)
  const isOrganizer = useIsOrganizer(trip)
  const lockDates = useApp((s) => s.lockDates)
  const [tab, setTab] = useState<TabId>(initialTab)
  const [hint, setHint] = useState(false)
  const [picked, setPicked] = useState(0)
  const [locking, setLocking] = useState(false)

  const { windows, respondedIds, pendingIds } = useMemo(() => tripWindowsOf(trip), [trip])
  const hints = useMemo(() => tripHintsOf(trip), [trip])
  const total = trip.members.length
  const locked = trip.locked
  const canLock = isOrganizer && !locked && windows.length > 0
  const choice = windows[picked]

  const lock = () => {
    if (!choice) return
    setLocking(true)
    setTimeout(() => {
      lockDates(trip.id, choice.start, addDays(choice.start, choice.tripDays - 1))
      toast(`${t.window.lockedNote} 🔒`)
      back()
    }, 400)
  }

  return (
    <Screen
      label={t.window.title}
      top={
        <NavBar
          left={<IconButton icon={ChevronLeft} label={t.common.back} onClick={() => back()} />}
          right={
            !locked && (
              <IconButton icon={Lightbulb04} label={t.window.hint} onClick={() => setHint(true)} className="text-md font-medium">
                {t.window.hint}
              </IconButton>
            )
          }
        />
      }
      bottom={
        canLock && (
          <BottomBar>
            <Button fullWidth iconRight={Lock03} loading={locking} onClick={lock}>
              {t.window.lock}
            </Button>
          </BottomBar>
        )
      }
      overlay={
        <HintSheet
          trip={trip}
          open={hint}
          hints={hints}
          onClose={() => setHint(false)}
          onCalendar={() => {
            setHint(false)
            setTab('calendar')
          }}
        />
      }
    >
      <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-6 px-4 pt-5">
        <motion.div variants={fadeUp} className="flex flex-col gap-4">
          <PageHeader size="md" title={t.window.title} subtitle={t.window.subtitle} />
          <SegmentedControl
            label={t.window.title}
            value={tab}
            onChange={setTab}
            options={[
              { value: 'best', label: t.window.tabs.best },
              { value: 'calendar', label: t.window.tabs.calendar },
            ]}
          />
        </motion.div>

        <AnimatePresence mode="wait" initial={false}>
          {tab === 'best' ? (
            <motion.div key="best" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="flex flex-col gap-6">
              {pendingIds.length > 0 && !locked && respondedIds.length > 0 && <Notice n={respondedIds.length} total={total} />}
              <section aria-labelledby="windows" className="flex flex-col gap-3">
                <motion.div variants={fadeUp}>
                  <SectionHeader id="windows" title={canLock ? t.window.select : t.window.optimal} />
                </motion.div>
                {locked ? (
                  <WindowCard
                    label={t.window.option(formatRange(locked.start, locked.end), dayCount(locked.start, locked.end))}
                    members={t.window.membersOf(total, total)}
                    highlighted
                    badge={t.window.lockedNote}
                  />
                ) : windows.length === 0 ? (
                  <motion.p variants={fadeUp} className="text-sm text-ink-muted">
                    {t.window.noWindows}
                  </motion.p>
                ) : (
                  <div role={canLock ? 'radiogroup' : 'list'} aria-labelledby="windows" className="flex flex-col gap-3">
                    {windows.map((w, i) => (
                      <WindowCard
                        key={`${w.start}-${w.memberIds.join()}`}
                        label={t.window.option(formatRange(w.start, addDays(w.start, w.tripDays - 1)), w.tripDays)}
                        members={t.window.membersOf(w.memberIds.length, total)}
                        best={i === 0}
                        highlighted={canLock ? picked === i : i === 0}
                        selectable={canLock}
                        selected={picked === i}
                        onSelect={() => setPicked(i)}
                      />
                    ))}
                  </div>
                )}
                {canLock && (
                  <>
                    <OrDivider label={t.common.or} />
                    <motion.div variants={fadeUp} {...press}>
                      <button
                        type="button"
                        onClick={() => void navigate(`/trip/${trip.id}/window/custom`)}
                        className="flex w-full items-center gap-3 rounded-3xl bg-surface p-4 text-left shadow-card"
                      >
                        <span className="flex flex-1 flex-col">
                          <span className="text-sm text-ink-muted">{t.window.custom.eyebrow}</span>
                          <span className="text-md font-medium text-ink">{t.window.custom.title}</span>
                        </span>
                        <ChevronRight aria-hidden width={20} height={20} className="text-ink-subtle" />
                      </button>
                    </motion.div>
                  </>
                )}
              </section>
              {!isOrganizer && !locked && <Waiting />}
            </motion.div>
          ) : (
            <motion.div key="calendar" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="flex flex-col gap-6">
              <GroupCalendar trip={trip} windows={windows} />
              {!isOrganizer && !locked && <Waiting />}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Screen>
  )
}

const dayCount = (a: ISODate, b: ISODate) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000) + 1

function Notice({ n, total }: { n: number; total: number }) {
  const c = t.window.notice(n, total)
  return (
    <motion.div variants={fadeUp} role="note" className="flex gap-2 rounded-xl border border-notice-line bg-notice-tint p-4">
      <AlertCircle aria-hidden width={16} height={16} className="mt-0.5 shrink-0 text-ink-warning" />
      <p className="text-sm text-ink-secondary">
        <strong className="font-semibold">{c.strong}</strong> {c.body}
      </p>
    </motion.div>
  )
}

function Waiting() {
  return (
    <motion.p variants={fadeUp} className="flex items-center justify-center gap-2 text-sm text-ink-muted">
      <Clock aria-hidden width={20} height={20} />
      {t.window.waiting}
    </motion.p>
  )
}

/* Figma window card: radius 20, padding 16. Best/selected = 2px gradient border.
   Organiser view adds a radio (top-right); the radio also carries the selection for colour-blind users. */
function WindowCard({
  label,
  members,
  best,
  badge,
  highlighted,
  selectable,
  selected,
  onSelect,
}: {
  label: string
  members: string
  best?: boolean
  badge?: string
  highlighted?: boolean
  selectable?: boolean
  selected?: boolean
  onSelect?: () => void
}) {
  const ring =
    'before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:p-[2px] before:[background:var(--gradient-best)] before:[mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)]'
  const body = (
    <>
      <span className="flex items-center gap-2">
        {(best || badge) && <Badge tone="best">{badge ?? t.window.best}</Badge>}
        <span className="text-sm text-ink-muted">{members}</span>
      </span>
      <span className="text-md font-semibold text-ink">{label}</span>
      {selectable && (
        <span
          aria-hidden
          className={cn(
            'absolute right-4 top-4 grid size-4 place-items-center rounded-full border',
            selected ? 'border-brand bg-brand' : 'border-line bg-surface',
          )}
        >
          {selected && <span className="size-1.5 rounded-full bg-surface" />}
        </span>
      )}
    </>
  )
  const cls = cn('relative flex w-full flex-col items-start gap-1 rounded-3xl bg-surface p-4 text-left shadow-card', highlighted && ring)
  return selectable ? (
    <motion.button variants={fadeUp} type="button" role="radio" aria-checked={!!selected} onClick={onSelect} {...press} className={cls}>
      {body}
    </motion.button>
  ) : (
    <motion.div variants={fadeUp} role="listitem" className={cls}>
      {body}
    </motion.div>
  )
}

function GroupCalendar({ trip, windows }: { trip: Trip; windows: Window[] }) {
  const members = useMemo(() => [...trip.members].sort((a, b) => (a.id === ME ? -1 : b.id === ME ? 1 : 0)), [trip.members])
  const colour = useMemo(() => new Map(members.map((m, i) => [m.id, colourVar(i)])), [members])
  const responded = members.filter((m) => m.dates.length > 0)
  const byDay = useMemo(() => availabilityByDay(trip.members.map(toEngineMember)), [trip.members])
  const group = useMemo(() => {
    const map = new Map<ISODate, GroupDayInfo>()
    for (const [day, ids] of byDay) {
      const names = members.filter((m) => ids.includes(m.id)).map((m) => m.name.split(' ')[0])
      map.set(day, {
        dots: members.filter((m) => ids.includes(m.id)).map((m) => colour.get(m.id)!),
        everyone: responded.length >= 2 && ids.length === responded.length,
        label: `${names.join(', ')} free`,
      })
    }
    return map
  }, [byDay, members, colour, responded.length])

  const start = trip.locked?.start ?? windows[0]?.start ?? [...byDay.keys()].sort()[0] ?? todayISO()
  const [month, setMonth] = useState({ year: Number(start.slice(0, 4)), month: Number(start.slice(5, 7)) - 1 })

  return (
    <section aria-labelledby="group-window" className="flex flex-col gap-3">
      <motion.div variants={fadeUp}>
        <SectionHeader id="group-window" title={t.window.groupWindow} />
      </motion.div>
      <motion.div variants={fadeUp}>
        <Card className="flex flex-col gap-4 p-4">
          <Calendar month={month} onMonthChange={setMonth} today={todayISO()} group={group} readOnly />
          <Divider />
          <ul aria-label="Members" className="flex flex-wrap gap-2">
            {members.map((m) => (
              <li key={m.id} className="flex h-7 items-center gap-1.5 rounded-full border border-line-subtle bg-surface px-2.5 text-sm text-ink-secondary">
                <span aria-hidden className="size-1.5 rounded-full" style={{ background: colour.get(m.id) }} />
                {m.name.split(' ')[0]}
              </li>
            ))}
          </ul>
        </Card>
      </motion.div>
    </section>
  )
}

function HintSheet({
  trip,
  open,
  hints,
  onClose,
  onCalendar,
}: {
  trip: Trip
  open: boolean
  hints: ReturnType<typeof tripHintsOf>
  onClose: () => void
  onCalendar: () => void
}) {
  const nameOf = (id: string) => (id === ME ? t.window.hintSheet.you : (trip.members.find((m) => m.id === id)?.name ?? id))
  return (
    <Sheet open={open} onClose={onClose} title={t.window.hintSheet.title} description={t.window.hintSheet.body}>
      <Divider />
      {hints.length === 0 ? (
        <p className="text-sm text-ink-muted">{t.window.hintSheet.none}</p>
      ) : (
        <ul className="flex flex-col gap-5">
          {hints.map((h) => {
            const names = h.memberIds.map(nameOf)
            const both = names.length > 1
            return (
              <li key={h.memberIds.join() + h.newWindow.start} className="flex gap-3">
                {both ? (
                  <span aria-hidden className="relative size-10 shrink-0">
                    <Avatar name={names[0]!} size={25} tone="navy" className="absolute left-0 top-0" />
                    <Avatar name={names[1]!} size={25} tone="navy" className="absolute bottom-0 right-0 ring-1 ring-surface" />
                  </span>
                ) : (
                  <Avatar name={names[0]!} tone="navy" />
                )}
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-ink">{both ? names.map((n) => n.split(' ')[0]).join(' & ') : names[0]}</span>
                  <span className="text-xs text-ink-tertiary">
                    {(() => {
                      const c = t.window.hintSheet
                      const mine = h.memberIds.includes(ME)
                      if (both) return (mine ? c.bothYou : c.both)(h.extraDays, h.newWindow.lengthDays)
                      return (mine ? c.oneYou : c.one)(h.extraDays, h.newWindow.lengthDays)
                    })()}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      )}
      <Button variant="secondary" size="md" fullWidth iconRight={ChevronRight} onClick={onCalendar}>
        {t.window.hintSheet.cta}
      </Button>
    </Sheet>
  )
}
