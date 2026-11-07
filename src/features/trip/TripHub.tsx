import { useState, type ComponentType, type SVGProps } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Home02, LinkExternal01, Luggage03, Map01, Minus, Pin01, Plane, Plus, Target04, Users01, Wallet02 } from '@untitledui/icons'
import { t } from '@/copy'
import { destById, destLong } from '@/domain/trip'
import { cn } from '@/lib/cn'
import { durations, fadeUp, press } from '@/lib/motion'
import { flagUrl } from '@/data/flags'
import type { Trip } from '@/store/app'
import { Card, Divider, Meta, SectionHeader } from '@/ui/Surface'
import { MembersSection, TravelWindowSection } from './parts'
import { TripFrame } from './TripScreen'

/* WIP board "Trip Hub" (1:73544 · 1:73646): flag hero, booking rows that expand into providers,
   budget & planning, members. Provider links are plain searches (no affiliate deals yet).
   Rows we can't fill yet say so instead of inventing content. */
type Icon = ComponentType<SVGProps<SVGSVGElement>>

const providerUrl = (provider: string, city: string, start?: string, end?: string) => {
  const q = encodeURIComponent(city)
  switch (provider) {
    case 'Booking.com':
      return `https://www.booking.com/searchresults.html?ss=${q}${start ? `&checkin=${start}&checkout=${end}` : ''}`
    case 'Airbnb':
      return `https://www.airbnb.com/s/${q}/homes${start ? `?checkin=${start}&checkout=${end}` : ''}`
    case 'Expedia':
      return `https://www.expedia.com/Hotel-Search?destination=${q}${start ? `&startDate=${start}&endDate=${end}` : ''}`
    case 'Skyscanner':
      return `https://www.skyscanner.net/transport/flights-to/${q}`
    case 'Google Flights':
      return `https://www.google.com/travel/flights?q=Flights%20to%20${q}`
    case 'Kayak':
      return `https://www.kayak.com/explore/${q}`
    default:
      return `https://www.google.com/search?q=${encodeURIComponent(`${provider} ${city}`)}`
  }
}

export function TripHub({ trip }: { trip: Trip }) {
  const dest = destById(trip.destinationId)
  const city = dest?.name ?? ''
  const range = trip.locked
  return (
    <TripFrame
      trip={trip}
      hero={
        dest && (
          <div aria-hidden className="absolute inset-x-0 top-0 h-[296px] overflow-hidden">
            <img src={flagUrl(dest.countryCode)} alt="" className="h-[250px] w-full object-cover" />
            <div className="absolute inset-0 [background:linear-gradient(to_bottom,transparent_0%,var(--color-navy)_84%)]" />
          </div>
        )
      }
      header={
        <>
          <h1 className="pt-6 text-display-xs font-medium text-ink-on-dark">{trip.name}</h1>
          <Meta
            tone="on-dark"
            size="sm"
            items={[
              { icon: Pin01, text: destLong(trip.destinationId) },
              { icon: Users01, text: t.trip.members(trip.members.length) },
            ]}
          />
        </>
      }
    >
      <TravelWindowSection trip={trip} />

      <motion.section variants={fadeUp} aria-labelledby="hub" className="flex flex-col gap-3">
        <SectionHeader id="hub" title={t.trip.sections.hub} />
        <HubRow icon={Plane} title={t.hub.flights.title} body={t.hub.flights.body} providers={t.hub.providers.flights} city={city} range={range} />
        <HubRow icon={Home02} title={t.hub.stay.title} body={t.hub.stay.body} providers={t.hub.providers.stay} city={city} range={range} />
        <HubRow
          icon={Target04}
          title={t.hub.activities.title}
          body={t.hub.activities.body(city)}
          providers={t.hub.providers.activities}
          city={city}
          range={range}
        />
        <HubRow icon={Luggage03} title={t.hub.extras.title} body={t.hub.extras.body} providers={t.hub.providers.extras} city={city} range={range} />
      </motion.section>

      <motion.section variants={fadeUp} aria-labelledby="planning" className="flex flex-col gap-3">
        <SectionHeader id="planning" title={t.trip.sections.planning} />
        <Card className="flex flex-col gap-3 p-4">
          <HubRow flat tint icon={Wallet02} title={t.hub.budget.title} body={t.hub.budget.body} city={city} range={range} />
          <Divider />
          <HubRow flat tint icon={Map01} title={t.hub.days.title} body={t.hub.days.body} city={city} range={range} />
        </Card>
      </motion.section>

      <MembersSection trip={trip} />
    </TripFrame>
  )
}

function HubRow({
  icon: I,
  title,
  body,
  providers,
  city,
  range,
  flat,
  tint,
}: {
  icon: Icon
  title: string
  body: string
  providers?: readonly string[]
  city: string
  range?: { start: string; end: string }
  /** Inside a shared card (no own card). */
  flat?: boolean
  /** Orange-tint icon tile (planning) instead of grey (booking). */
  tint?: boolean
}) {
  const [open, setOpen] = useState(false)
  const id = `hub-${title.replace(/\W+/g, '-').toLowerCase()}`
  const Toggle = open ? Minus : Plus
  const content = (
    <>
      <motion.button
        type="button"
        {...press}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 text-left"
      >
        <span
          aria-hidden
          className={cn('grid size-11 shrink-0 place-items-center rounded-[11px]', tint ? 'bg-tint-brand text-brand' : 'bg-tint-neutral text-ink-title')}
        >
          <I width={22} height={22} />
        </span>
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-sm font-medium text-ink-title">{title}</span>
          <span className="text-xs text-ink-muted">{body}</span>
        </span>
        <Toggle aria-hidden width={20} height={20} className="text-ink-subtle" />
      </motion.button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            role="region"
            aria-label={title}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: durations.base }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1 pt-4">
              <Divider className="mb-2" />
              {providers ? (
                providers.map((p) => (
                  <a
                    key={p}
                    href={providerUrl(p, city, range?.start, range?.end)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-11 items-center justify-between text-xs font-medium text-ink-tertiary"
                  >
                    {p}
                    <span className="flex items-center gap-1 text-xxs text-ink-link">
                      {t.hub.seePrices}
                      <LinkExternal01 aria-hidden width={12} height={12} />
                      <span className="sr-only">(opens {p})</span>
                    </span>
                  </a>
                ))
              ) : (
                <p className="py-2 text-xs text-ink-muted">{t.hub.soon}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
  return flat ? (
    <div>{content}</div>
  ) : (
    <Card radius="2xl" className="p-4">
      {content}
    </Card>
  )
}
