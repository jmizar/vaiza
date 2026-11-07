import {
  findWindows,
  tallyVotes,
  toDay,
  upgradeHints,
  type BudgetCounts,
  type Group,
  type ISODate,
  type Member,
  type TravelWindow,
  type UpgradeHint,
  type Vote,
} from '@/engine'
import { CITIES } from '@/data/cities'
import { DESTINATIONS } from '@/data/destinations'
import type { Step } from '@/ui/StepList'
import type { Trip, TripMember } from '@/store/app'
import { t } from '@/copy'

/* Glue between the prototype store and the matching engine, plus the rules that decide which
   Figma state a trip is in (steps, CTA, chips). Screens read these; they never compute status. */

export const ME = 'me'

export function todayISO(): ISODate {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const cityById = (id: string | undefined) => CITIES.find((c) => c.id === id)
export const destById = (id: string | undefined) => DESTINATIONS.find((d) => d.id === id)
/** "Madrid, ES" */
export const cityLabel = (id: string | undefined) => {
  const c = cityById(id)
  return c ? `${c.name}, ${c.countryCode}` : undefined
}
/** "Lisbon, PT" for headers, "Lisbon, Portugal" for steps. */
export const destShort = (id: string | undefined) => {
  const d = destById(id)
  return d ? `${d.name}, ${d.countryCode}` : undefined
}
export const destLong = (id: string | undefined) => {
  const d = destById(id)
  return d ? `${d.name}, ${d.country}` : undefined
}

export const me = (trip: Trip) => trip.members.find((m) => m.id === ME)

export function toEngineMember(m: TripMember): Member {
  const c = cityById(m.cityId)
  return {
    id: m.id,
    name: m.name,
    origin: c ? { lat: c.lat, lon: c.lon } : { lat: 40.4, lon: -3.7 },
    availableDates: m.dates,
    maxTripDays: m.maxTripDays,
    activities: m.activities,
  }
}

/** Budgets only leave a member as counts per tier (same rule as the database). */
export function buildGroup(trip: Trip): Group {
  const budgetCounts: BudgetCounts = {}
  for (const m of trip.members) if (m.budget) budgetCounts[m.budget] = (budgetCounts[m.budget] ?? 0) + 1
  return { members: trip.members.map(toEngineMember), budgetCounts }
}

export function tripWindowsOf(trip: Trip) {
  return findWindows(trip.members.map(toEngineMember), { limit: 3 })
}

export function tripHintsOf(trip: Trip): UpgradeHint[] {
  return upgradeHints(trip.members.map(toEngineMember), { limit: 3 })
}

export const responded = (trip: Trip) => trip.members.filter((m) => m.datesSubmitted && m.dates.length > 0)
export const voted = (trip: Trip) => trip.members.filter((m) => m.voted)

/** The travel window shown on the trip screen: the locked one, else the engine's best. */
export function shownWindow(trip: Trip): { start: ISODate; end: ISODate; days: number; count: number; locked: boolean } | null {
  const total = trip.members.length
  if (trip.locked) {
    const days = toDay(trip.locked.end) - toDay(trip.locked.start) + 1
    return { ...trip.locked, days, count: total, locked: true }
  }
  if (responded(trip).length < 2) return null
  const best = tripWindowsOf(trip).windows[0]
  return best ? { start: best.start, end: best.end, days: best.tripDays, count: best.memberIds.length, locked: false } : null
}

/* ------------------------------------------------------------------ dates formatting */
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const parts = (d: ISODate) => ({ y: Number(d.slice(0, 4)), m: Number(d.slice(5, 7)) - 1, d: Number(d.slice(8, 10)) })

/** "Jul 12 - 18, 2026" · "Jul 26 - Aug 2, 2026" · "Dec 28, 2026 - Jan 3, 2027" (Figma format). */
export function formatRange(start: ISODate, end: ISODate): string {
  const a = parts(start)
  const b = parts(end)
  if (a.y !== b.y) return `${MONTH[a.m]} ${a.d}, ${a.y} - ${MONTH[b.m]} ${b.d}, ${b.y}`
  if (a.m !== b.m) return `${MONTH[a.m]} ${a.d} - ${MONTH[b.m]} ${b.d}, ${b.y}`
  return `${MONTH[a.m]} ${a.d} - ${b.d}, ${b.y}`
}
export const windowDays = (w: Pick<TravelWindow, 'tripDays'>) => w.tripDays

/* ------------------------------------------------------------------ status */
export type TripChip = 'ready' | 'voting' | 'draft'

/** Home card chip. Figma: Ready (booking), Voting (group in progress), Draft (only you). */
export function tripChip(trip: Trip): TripChip {
  if (trip.phase === 'booking') return 'ready'
  return trip.members.length > 1 ? 'voting' : 'draft'
}

export interface TripCta {
  label: string
  /** A path to open, or 'decide' = the organiser picks the destination (sheet on the trip screen). */
  to: string
}

export interface TripProgress {
  steps: Step[]
  cta?: TripCta
}

/** Steps + CTA for the trip screen, exactly the copy states drawn in Figma (Journey A and B). */
export function tripProgress(trip: Trip, isOrganizer: boolean): TripProgress {
  const c = t.trip.steps
  const total = trip.members.length
  const mine = me(trip)
  const n = responded(trip).length
  const iSubmitted = !!mine?.datesSubmitted
  const base = `/trip/${trip.id}`

  const created: Step = { id: 'created', title: c.created, detail: trip.name, status: 'complete' }
  const destination: Step = { id: 'destination', title: c.destination, detail: destLong(trip.destinationId) ?? '', status: 'complete' }
  const booking: Step = { id: 'booking', title: c.booking, detail: c.bookingLocked, status: 'upcoming' }

  if (!trip.locked) {
    let detail: string
    if (!iSubmitted) detail = n === 0 ? c.datesStart : c.datesSomeAddYours(n, total)
    else if (total < 2) detail = c.votingInvite // filled: alone in the trip, nothing to compare yet
    else if (n < total) detail = c.datesSome(n, total)
    else detail = isOrganizer ? c.datesAllOrganizer : c.datesAllMember
    const dates: Step = { id: 'dates', title: c.dates, detail, status: 'current' }
    const voting: Step = { id: 'voting', title: c.voting, detail: total < 2 ? c.votingInvite : c.votingAfterDates, status: 'upcoming' }
    const steps = trip.journey === 'B' ? [created, destination, dates, booking] : [created, dates, voting, booking]
    let cta: TripCta | undefined
    if (!iSubmitted) cta = { label: t.trip.cta.addDates, to: `${base}/dates` }
    else if (isOrganizer && total >= 2 && n >= 2) cta = { label: t.trip.cta.lockDates, to: `${base}/window` }
    return { steps, cta }
  }

  // Dates locked → voting (Journey A). Booking phase uses the hub instead of steps.
  const datesDone: Step = { id: 'dates', title: c.datesLockedTitle, detail: c.datesLocked, status: 'complete' }
  const v = voted(trip).length
  const iVoted = !!mine?.voted
  let detail: string
  if (!iVoted) detail = v === 0 ? c.voteStart : c.voteSomeAddYours(v, total)
  else if (v < total) detail = c.voteSome(v, total)
  else detail = isOrganizer ? c.voteAllOrganizer : c.voteAllMember
  const voting: Step = { id: 'voting', title: c.voting, detail, status: 'current' }
  let cta: TripCta | undefined
  if (!iVoted) cta = { label: t.trip.cta.vote, to: `${base}/vote` }
  else if (isOrganizer) cta = { label: t.trip.cta.lockDestination, to: 'decide' }
  return { steps: [created, datesDone, voting, booking], cta }
}

/* ------------------------------------------------------------------ voting */
export function votingResult(trip: Trip) {
  const votes: Vote[] = trip.members.flatMap((m) =>
    m.voted || m.id === ME ? Object.entries(m.votes).map(([destinationId, value]) => ({ memberId: m.id, destinationId, value })) : [],
  )
  const confirmed = trip.members.filter((m) => m.voted).map((m) => m.id)
  return tallyVotes(
    trip.candidates.map((c) => c.destinationId),
    votes,
    trip.members.map((m) => m.id),
    confirmed,
    Object.fromEntries(trip.candidates.map((c) => [c.destinationId, c.score])),
  )
}
