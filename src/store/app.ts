import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { addDays, dateRange, suggestDestinations, toDay, type Activity, type BudgetTier, type ISODate } from '@/engine'
import { DESTINATIONS } from '@/data/destinations'
import { buildGroup, ME, todayISO } from '@/domain/trip'
import type { TripIconKind } from '@/ui/Media'

/* Prototype store. Mirrors the future Supabase API (create/join/dates/prefs/lock/vote) so screens
   won't change when the backend arrives; only these actions will. Persists in this browser. */

export type Role = 'organizer' | 'member'
export { ME }

export interface TripMember {
  id: string
  name: string
  cityId: string
  role: Role
  proxy?: boolean
  dates: ISODate[]
  datesSubmitted: boolean
  maxTripDays?: number
  budget?: BudgetTier
  activities: Activity[]
  votes: Record<string, 1 | -1>
  voted: boolean
}

export interface Candidate {
  destinationId: string
  score: number
  source: 'suggested' | 'custom'
}

export interface Trip {
  id: string
  name: string
  icon: TripIconKind
  journey: 'A' | 'B'
  destinationId?: string
  createdAt: string
  members: TripMember[]
  phase: 'dates' | 'voting' | 'booking'
  locked?: { start: ISODate; end: ISODate }
  candidates: Candidate[]
  celebrated?: boolean
}

export interface Profile {
  name: string
  cityId: string
}

interface State {
  onboarded: boolean
  profile: Profile | null
  trips: Trip[]
  /** Dev: preview a trip as organiser or member regardless of who created it. */
  viewAs: 'auto' | Role
  reduceTransparency: boolean
  setOnboarded: () => void
  saveProfile: (p: Profile) => void
  createTrip: (name: string, destinationId?: string) => string
  setMyDates: (tripId: string, dates: ISODate[], opts?: { maxTripDays?: number; cityId?: string }) => void
  setMyPreferences: (tripId: string, budget: BudgetTier | undefined, activities: Activity[]) => void
  lockDates: (tripId: string, start: ISODate, end: ISODate) => void
  addCandidate: (tripId: string, destinationId: string) => void
  setVote: (tripId: string, destinationId: string, value: 1 | -1 | null) => void
  resetVotes: (tripId: string) => void
  confirmVote: (tripId: string) => void
  lockDestination: (tripId: string, destinationId: string) => void
  markCelebrated: (tripId: string) => void
  simulateFriendsJoin: (tripId: string) => void
  simulateFriendsDates: (tripId: string) => void
  simulateFriendsVote: (tripId: string) => void
  setViewAs: (v: 'auto' | Role) => void
  setReduceTransparency: (v: boolean) => void
  loadDemo: () => void
  reset: () => void
}

// Storage can throw (private mode, blocked storage): never let that break the app.
const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k)
    } catch {
      return null
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v)
    } catch {
      /* ignore */
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k)
    } catch {
      /* ignore */
    }
  },
}

const ICONS: TripIconKind[] = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6']
const uid = () => Math.random().toString(36).slice(2, 9)

const member = (p: Partial<TripMember> & Pick<TripMember, 'id' | 'name' | 'cityId'>): TripMember => ({
  role: 'member',
  dates: [],
  datesSubmitted: false,
  activities: [],
  votes: {},
  voted: false,
  ...p,
})

const FRIENDS = [
  { id: 'gabriel', name: 'Gabriel', cityId: 'a-coruna-es', budget: 'moderate' as BudgetTier, activities: ['beach', 'gastronomy'] as Activity[] },
  {
    id: 'pablo',
    name: 'Pablo Soler',
    cityId: 'las-palmas-de-gran-canaria-es',
    budget: 'budget' as BudgetTier,
    activities: ['nightlife', 'culture'] as Activity[],
  },
]

function updateTrip(trips: Trip[], id: string, fn: (t: Trip) => Trip) {
  return trips.map((t) => (t.id === id ? fn(t) : t))
}
function updateMember(t: Trip, id: string, fn: (m: TripMember) => TripMember): Trip {
  return { ...t, members: t.members.map((m) => (m.id === id ? fn(m) : m)) }
}

/** The engine's suggestions for a trip's locked window become the ballot. */
function ballotFor(t: Trip, start: ISODate, end: ISODate): Candidate[] {
  const tripDays = toDay(end) - toDay(start) + 1
  const group = buildGroup(t)
  return suggestDestinations(DESTINATIONS, group, { start, end, tripDays }, 7).map((m) => ({
    destinationId: m.destination.id,
    score: m.score,
    source: 'suggested' as const,
  }))
}

/** Friends' availability, shaped around yours so the windows and hints are interesting. */
function friendDates(mine: ISODate[], i: number): ISODate[] {
  const base = mine.length ? [...mine].sort() : dateRange(addDays(todayISO(), 21), addDays(todayISO(), 34))
  const first = base[0]!
  const last = base[base.length - 1]!
  if (i === 0) return dateRange(addDays(first, 2), addDays(last, 2)) // Gabriel: shifted 2 days later
  return dateRange(addDays(first, 1), addDays(last, -3)) // Pablo: a shorter stretch inside
}

function demoTrips(): Trip[] {
  const T = todayISO()
  const me = (role: Role, extra: Partial<TripMember> = {}) => member({ id: ME, name: 'John Smith', cityId: 'london-gb', role, ...extra })
  const lisbonStart = addDays(T, 60)
  const lisbon: Trip = {
    id: 'lisbon',
    name: 'Lisbon Trip ;)',
    icon: 'v1',
    journey: 'B',
    destinationId: 'lisbon-pt',
    createdAt: addDays(T, -20),
    phase: 'booking',
    locked: { start: lisbonStart, end: addDays(lisbonStart, 6) },
    candidates: [],
    celebrated: true,
    members: [
      me('organizer', { dates: dateRange(lisbonStart, addDays(lisbonStart, 8)), datesSubmitted: true }),
      member({ ...FRIENDS[0]!, dates: dateRange(lisbonStart, addDays(lisbonStart, 9)), datesSubmitted: true }),
      member({ ...FRIENDS[1]!, dates: dateRange(lisbonStart, addDays(lisbonStart, 6)), datesSubmitted: true }),
    ],
  }
  const mStart = addDays(T, 95)
  const moroccoMembers = [
    me('member', { dates: dateRange(mStart, addDays(mStart, 9)), datesSubmitted: true, budget: 'moderate', activities: ['culture', 'beach'] }),
    member({ ...FRIENDS[0]!, role: 'organizer', dates: dateRange(mStart, addDays(mStart, 9)), datesSubmitted: true }),
    member({ ...FRIENDS[1]!, dates: dateRange(mStart, addDays(mStart, 7)), datesSubmitted: true }),
    member({
      id: 'lucia',
      name: 'Lucía',
      cityId: 'sevilla-es',
      dates: dateRange(mStart, addDays(mStart, 8)),
      datesSubmitted: true,
      budget: 'moderate',
      activities: ['relax'],
    }),
    member({
      id: 'marco',
      name: 'Marco',
      cityId: 'milan-it',
      dates: dateRange(addDays(mStart, -2), addDays(mStart, 7)),
      datesSubmitted: true,
      budget: 'premium',
      activities: ['gastronomy'],
    }),
  ]
  const morocco: Trip = {
    id: 'morocco',
    name: 'Morocco Getaway',
    icon: 'v1',
    journey: 'A',
    createdAt: addDays(T, -6),
    phase: 'voting',
    locked: { start: mStart, end: addDays(mStart, 6) },
    candidates: [],
    members: moroccoMembers,
  }
  // Demo ballot = the Figma voting frames (same places and match %), so the review matches the design.
  morocco.candidates = [
    ['lisbon-pt', 78],
    ['budapest-hu', 75],
    ['tallinn-ee', 75],
    ['krakow-pl', 68],
    ['prague-cz', 66],
    ['seville-es', 65],
    ['paris-fr', 58],
  ].map(([destinationId, score]) => ({ destinationId: destinationId as string, score: score as number, source: 'suggested' as const }))
  const vStart = addDays(T, 230)
  const verano: Trip = {
    id: 'verano',
    name: 'Verano 2027',
    icon: 'v2',
    journey: 'A',
    createdAt: addDays(T, -2),
    phase: 'dates',
    candidates: [],
    members: [
      me('organizer', { dates: dateRange(vStart, addDays(vStart, 10)), datesSubmitted: true, budget: 'moderate', activities: ['beach'] }),
      member({ ...FRIENDS[0]!, dates: dateRange(addDays(vStart, 2), addDays(vStart, 12)), datesSubmitted: true }),
      member({ ...FRIENDS[1]! }),
    ],
  }
  const birthday: Trip = {
    id: 'birthday',
    name: 'Pablo’s Birthday!',
    icon: 'v3',
    journey: 'A',
    createdAt: addDays(T, -1),
    phase: 'dates',
    candidates: [],
    members: [me('organizer')],
  }
  return [lisbon, morocco, verano, birthday]
}

const initial = { onboarded: false, profile: null, trips: [] as Trip[], viewAs: 'auto' as const, reduceTransparency: false }

export const useApp = create<State>()(
  persist(
    (set, get) => ({
      ...initial,
      setOnboarded: () => set({ onboarded: true }),
      saveProfile: (profile) =>
        set((s) => ({
          profile,
          // Your name and city follow you into trips you're in.
          trips: s.trips.map((t) => updateMember(t, ME, (m) => ({ ...m, name: profile.name, cityId: profile.cityId }))),
        })),
      createTrip: (name, destinationId) => {
        const id = uid()
        const p = get().profile
        const trip: Trip = {
          id,
          name,
          icon: ICONS[get().trips.length % ICONS.length]!,
          journey: destinationId ? 'B' : 'A',
          destinationId,
          createdAt: todayISO(),
          phase: 'dates',
          candidates: [],
          members: [member({ id: ME, name: p?.name ?? 'You', cityId: p?.cityId ?? 'madrid-es', role: 'organizer' })],
        }
        set((s) => ({ trips: [trip, ...s.trips] }))
        return id
      },
      setMyDates: (tripId, dates, opts) =>
        set((s) => ({
          trips: updateTrip(s.trips, tripId, (t) =>
            updateMember(t, ME, (m) => ({
              ...m,
              dates: [...dates].sort(),
              datesSubmitted: true,
              maxTripDays: opts?.maxTripDays ?? m.maxTripDays,
              cityId: opts?.cityId ?? m.cityId,
            })),
          ),
        })),
      setMyPreferences: (tripId, budget, activities) =>
        set((s) => ({ trips: updateTrip(s.trips, tripId, (t) => updateMember(t, ME, (m) => ({ ...m, budget, activities }))) })),
      lockDates: (tripId, start, end) =>
        set((s) => ({
          trips: updateTrip(s.trips, tripId, (t) => ({
            ...t,
            locked: { start, end },
            phase: t.journey === 'A' ? 'voting' : 'booking',
            candidates: t.journey === 'A' ? ballotFor(t, start, end) : [],
          })),
        })),
      addCandidate: (tripId, destinationId) =>
        set((s) => ({
          trips: updateTrip(s.trips, tripId, (t) =>
            t.candidates.some((c) => c.destinationId === destinationId)
              ? t
              : { ...t, candidates: [{ destinationId, score: 0, source: 'custom' }, ...t.candidates] },
          ),
        })),
      setVote: (tripId, destinationId, value) =>
        set((s) => ({
          trips: updateTrip(s.trips, tripId, (t) =>
            updateMember(t, ME, (m) => {
              const votes = { ...m.votes }
              if (value === null) delete votes[destinationId]
              else votes[destinationId] = value
              return { ...m, votes }
            }),
          ),
        })),
      resetVotes: (tripId) => set((s) => ({ trips: updateTrip(s.trips, tripId, (t) => updateMember(t, ME, (m) => ({ ...m, votes: {}, voted: false }))) })),
      confirmVote: (tripId) => set((s) => ({ trips: updateTrip(s.trips, tripId, (t) => updateMember(t, ME, (m) => ({ ...m, voted: true }))) })),
      lockDestination: (tripId, destinationId) =>
        set((s) => ({ trips: updateTrip(s.trips, tripId, (t) => ({ ...t, destinationId, phase: 'booking', celebrated: false })) })),
      markCelebrated: (tripId) => set((s) => ({ trips: updateTrip(s.trips, tripId, (t) => ({ ...t, celebrated: true })) })),

      simulateFriendsJoin: (tripId) =>
        set((s) => ({
          trips: updateTrip(s.trips, tripId, (t) => {
            const have = new Set(t.members.map((m) => m.id))
            // Figma's group: you + Gabriel + Pablo. (A proxy member, e.g. Victor, comes with the proxy feature.)
            const add = FRIENDS.map((f) => member({ ...f, budget: undefined, activities: [] })).filter((m) => !have.has(m.id))
            return { ...t, members: [...t.members, ...add] }
          }),
        })),
      simulateFriendsDates: (tripId) =>
        set((s) => ({
          trips: updateTrip(s.trips, tripId, (t) => {
            const mine = t.members.find((m) => m.id === ME)?.dates ?? []
            let i = 0
            return {
              ...t,
              members: t.members.map((m) => {
                if (m.id === ME || m.proxy) return m
                const f = FRIENDS.find((x) => x.id === m.id)
                return { ...m, dates: friendDates(mine, i++), datesSubmitted: true, budget: f?.budget ?? 'moderate', activities: f?.activities ?? [] }
              }),
            }
          }),
        })),
      simulateFriendsVote: (tripId) =>
        set((s) => ({
          trips: updateTrip(s.trips, tripId, (t) => {
            const ids = t.candidates.map((c) => c.destinationId)
            return {
              ...t,
              members: t.members.map((m, i) => {
                if (m.id === ME || m.proxy || !ids.length) return m
                const votes: Record<string, 1 | -1> = {}
                votes[ids[0]!] = 1
                if (ids[1 + (i % 2)]) votes[ids[1 + (i % 2)]!] = 1
                if (ids.at(-1)) votes[ids.at(-1)!] = -1
                return { ...m, votes, voted: true }
              }),
            }
          }),
        })),
      setViewAs: (viewAs) => set({ viewAs }),
      setReduceTransparency: (reduceTransparency) => set({ reduceTransparency }),
      loadDemo: () => set({ onboarded: true, profile: { name: 'John Smith', cityId: 'london-gb' }, trips: demoTrips() }),
      reset: () => set({ ...initial }),
    }),
    { name: 'vaiza-prototype', version: 1, storage: createJSONStorage(() => safeStorage) },
  ),
)

/** Is the current viewer the organiser of this trip (respecting the dev "view as" switch)? */
export function useIsOrganizer(trip: Trip | undefined) {
  const viewAs = useApp((s) => s.viewAs)
  if (!trip) return false
  if (viewAs !== 'auto') return viewAs === 'organizer'
  return trip.members.find((m) => m.id === ME)?.role === 'organizer'
}

export const useTrip = (id: string | undefined) => useApp((s) => s.trips.find((t) => t.id === id))
