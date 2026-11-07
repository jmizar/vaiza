import { describe, expect, it } from 'vitest'
import { dateRange } from '@/engine'
import type { Trip, TripMember } from '@/store/app'
import { formatRange, tripChip, tripProgress } from './trip'

/* The trip screen's Figma states, as rules. If a test here changes, the copy states changed. */
const member = (p: Partial<TripMember> & Pick<TripMember, 'id' | 'name'>): TripMember => ({
  cityId: 'madrid-es',
  role: 'member',
  dates: [],
  datesSubmitted: false,
  activities: [],
  votes: {},
  voted: false,
  ...p,
})
const days = dateRange('2027-07-12', '2027-07-18')
const trip = (members: TripMember[], extra: Partial<Trip> = {}): Trip => ({
  id: 't',
  name: 'Summer escape 🌊',
  icon: 'v1',
  journey: 'A',
  createdAt: '2026-11-07',
  phase: 'dates',
  candidates: [],
  members,
  ...extra,
})
const me = (p: Partial<TripMember> = {}) => member({ id: 'me', name: 'John Smith', role: 'organizer', ...p })
const friend = (id: string, p: Partial<TripMember> = {}) => member({ id, name: id, ...p })
const detail = (tr: Trip, organizer: boolean, step: string) => tripProgress(tr, organizer).steps.find((s) => s.id === step)?.detail

describe('trip screen states (Journey A)', () => {
  it('alone, no dates: add yours to get started; voting needs friends first', () => {
    const tr = trip([me()])
    expect(detail(tr, true, 'dates')).toBe('Add yours to get started')
    expect(detail(tr, true, 'voting')).toBe('Invite friends first')
    expect(tripProgress(tr, true).cta?.label).toBe('Add your dates')
  })

  it('1 of 3 responded, not you: add yours', () => {
    const tr = trip([me(), friend('g', { dates: days, datesSubmitted: true }), friend('p')])
    expect(detail(tr, false, 'dates')).toBe('1 of 3 responded · Add yours')
    expect(detail(tr, false, 'voting')).toBe('After dates are locked')
  })

  it('2 of 3 responded including you: organiser can lock, member waits', () => {
    const tr = trip([me({ dates: days, datesSubmitted: true }), friend('g', { dates: days, datesSubmitted: true }), friend('p')])
    expect(detail(tr, true, 'dates')).toBe('2 of 3 responded')
    expect(tripProgress(tr, true).cta?.label).toBe('Lock travel dates')
    expect(tripProgress(tr, false).cta).toBeUndefined()
  })

  it('all in: organiser confirms, member sees organiser deciding', () => {
    const all = [
      me({ dates: days, datesSubmitted: true }),
      friend('g', { dates: days, datesSubmitted: true }),
      friend('p', { dates: days, datesSubmitted: true }),
    ]
    expect(detail(trip(all), true, 'dates')).toBe('All in · Confirm the dates')
    expect(detail(trip(all), false, 'dates')).toBe('All in · Organizer deciding')
  })

  it('voting: counts, your vote, then organiser picks', () => {
    const locked = { phase: 'voting' as const, locked: { start: days[0]!, end: days[6]! } }
    const base = [me({ dates: days, datesSubmitted: true }), friend('g', { voted: true }), friend('p')]
    expect(detail(trip(base, locked), true, 'voting')).toBe('1 of 3 voted. Add your vote')
    expect(tripProgress(trip(base, locked), true).cta?.label).toBe('Vote destination')
    const allVoted = base.map((m) => ({ ...m, voted: true }))
    expect(detail(trip(allVoted, locked), true, 'voting')).toBe('Everyone voted · Pick destination')
    expect(detail(trip(allVoted, locked), false, 'voting')).toBe('Everyone voted · Organizer deciding')
    expect(tripProgress(trip(allVoted, locked), true).cta?.to).toBe('decide')
  })
})

describe('Journey B (destination known)', () => {
  it('has a completed Destination step and no voting step', () => {
    const tr = trip([me()], { journey: 'B', destinationId: 'lisbon-pt' })
    const steps = tripProgress(tr, true).steps
    expect(steps.map((s) => s.id)).toEqual(['created', 'destination', 'dates', 'booking'])
    expect(steps[1]!.detail).toBe('Lisbon, Portugal')
  })
})

describe('home chip + date format', () => {
  it('draft alone, voting with friends, ready when booking', () => {
    expect(tripChip(trip([me()]))).toBe('draft')
    expect(tripChip(trip([me(), friend('g')]))).toBe('voting')
    expect(tripChip(trip([me()], { phase: 'booking' }))).toBe('ready')
  })
  it('formats ranges like Figma', () => {
    expect(formatRange('2026-07-12', '2026-07-18')).toBe('Jul 12 - 18, 2026')
    expect(formatRange('2026-07-26', '2026-08-02')).toBe('Jul 26 - Aug 2, 2026')
    expect(formatRange('2026-12-28', '2027-01-03')).toBe('Dec 28, 2026 - Jan 3, 2027')
  })
})
