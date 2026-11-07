import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { useNavigate, useParams } from 'react-router'
import { ChevronLeft, ChevronRight, DotsHorizontal } from '@untitledui/icons'
import { t } from '@/copy'
import { destShort, tripProgress } from '@/domain/trip'
import { cn } from '@/lib/cn'
import { durations, fadeUp, stagger } from '@/lib/motion'
import { useBack } from '@/app/stack'
import { useIsOrganizer, useTrip, type Trip } from '@/store/app'
import { Button, IconButton } from '@/ui/Button'
import { BottomBar, NavBar, Screen } from '@/ui/Screen'
import { StepList } from '@/ui/StepList'
import { Card, SectionHeader } from '@/ui/Surface'
import { toast } from '@/ui/Toast'
import { DecideSheet } from './DecideSheet'
import { InviteSheet, MembersSection, TravelWindowSection, TripMeta } from './parts'
import { TripHub } from './TripHub'

/* Figma: Trip Screen_User / _Admin (1:52071 … 1:53474). Navy header + light main sheet that
   scrolls up under the floating nav buttons. Once the title scrolls away, the nav area turns
   solid navy and shows the trip name (iOS large-title collapse; filled, not in Figma).
   Booking phase renders the trip hub instead (WIP board). */
export function TripScreen() {
  const { id = '' } = useParams()
  const trip = useTrip(id)
  if (!trip) return <MissingTrip />
  return trip.phase === 'booking' ? <TripHub trip={trip} /> : <TripPlanning trip={trip} />
}

function TripPlanning({ trip }: { trip: Trip }) {
  const navigate = useNavigate()
  const isOrganizer = useIsOrganizer(trip)
  const progress = tripProgress(trip, isOrganizer)
  const [invite, setInvite] = useState(false)
  const [decide, setDecide] = useState(false)
  const dest = trip.journey === 'B' ? destShort(trip.destinationId) : undefined

  return (
    <TripFrame
      trip={trip}
      header={
        <>
          <h1 className="text-display-xs font-medium text-ink-on-dark">{trip.name}</h1>
          <TripMeta trip={trip} dest={dest} />
        </>
      }
      bottom={
        progress.cta && (
          <BottomBar>
            <Button fullWidth iconRight={ChevronRight} onClick={() => (progress.cta!.to === 'decide' ? setDecide(true) : void navigate(progress.cta!.to))}>
              {progress.cta.label}
            </Button>
          </BottomBar>
        )
      }
      overlay={
        <>
          <InviteSheet trip={trip} open={invite} onClose={() => setInvite(false)} />
          <DecideSheet trip={trip} open={decide} onClose={() => setDecide(false)} />
        </>
      }
    >
      <TravelWindowSection trip={trip} />
      <motion.section variants={fadeUp} aria-labelledby="status" className="flex flex-col gap-3">
        <SectionHeader id="status" title={t.trip.sections.status} />
        <Card className="p-4">
          <StepList steps={progress.steps} label={t.trip.sections.status} />
        </Card>
      </motion.section>
      <MembersSection trip={trip} onInvite={() => setInvite(true)} />
    </TripFrame>
  )
}

/** Navy header + main sheet + collapsing nav. Shared by planning and the hub. */
export function TripFrame({
  trip,
  header,
  hero,
  bottom,
  overlay,
  children,
}: {
  trip: Trip
  header: ReactNode
  /** Optional artwork behind the header (hub: destination flag). */
  hero?: ReactNode
  bottom?: ReactNode
  overlay?: ReactNode
  children: ReactNode
}) {
  const back = useBack('/home')
  const scroll = useRef<HTMLDivElement>(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const el = scroll.current
    if (!el) return
    const on = () => setCollapsed(el.scrollTop > 64)
    el.addEventListener('scroll', on, { passive: true })
    return () => el.removeEventListener('scroll', on)
  }, [])

  return (
    <Screen
      tone="navy"
      label={trip.name}
      scrollRef={scroll}
      className="screen-scroll--split"
      top={
        <div className="relative">
          <motion.div
            aria-hidden
            className="absolute inset-x-0 bottom-0 bg-navy"
            style={{ top: 'calc(-1 * var(--safe-top))' }}
            initial={false}
            animate={{ opacity: collapsed ? 1 : 0 }}
            transition={{ duration: durations.fast }}
          />
          <NavBar
            className="pb-2"
            left={<IconButton tone="dark" icon={ChevronLeft} label={t.common.back} onClick={() => back()} />}
            center={
              <motion.span
                aria-hidden={!collapsed}
                initial={false}
                animate={{ opacity: collapsed ? 1 : 0, y: collapsed ? 0 : 6 }}
                transition={{ duration: durations.fast }}
                className="truncate text-md font-semibold text-ink-on-dark"
              >
                {trip.name}
              </motion.span>
            }
            right={<IconButton tone="dark" icon={DotsHorizontal} label={t.trip.more} onClick={() => toast(t.hub.soon)} />}
          />
        </div>
      }
      bottom={bottom}
      overlay={overlay}
    >
      {hero}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="relative flex flex-col gap-1 px-4 pb-6 pt-5">
        {header}
      </motion.div>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className={cn('relative flex min-h-full flex-col gap-6 rounded-t-4xl bg-canvas px-4 pb-6 pt-6')}
      >
        {children}
      </motion.div>
    </Screen>
  )
}

function MissingTrip() {
  const back = useBack('/home')
  return (
    <Screen label="Trip not found" top={<NavBar left={<IconButton icon={ChevronLeft} label={t.common.back} onClick={() => back()} />} />}>
      <p className="px-4 pt-5 text-md text-ink-muted">This trip doesn’t exist on this device. Reset the prototype from Profile → settings.</p>
    </Screen>
  )
}
