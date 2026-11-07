import { describe, expect, it } from 'vitest'
import { estimateFlightHours, haversineKm, maxFlightHoursFor } from './geo'
import { SCORE_WEIGHTS, scoreDestination, suggestDestinations } from './scoring'
import type { Destination, Group, Member } from './types'

const MADRID = { lat: 40.4168, lon: -3.7038 }
const BARCELONA = { lat: 41.3874, lon: 2.1686 }

const lisbon: Destination = {
  id: 'lisbon-pt', name: 'Lisbon', country: 'Portugal', countryCode: 'PT', continent: 'europe', iata: 'LIS',
  lat: 38.7223, lon: -9.1393, costPerDay: 85, activities: ['beach', 'culture', 'gastronomy', 'nightlife'], bestMonths: [4, 5, 6, 7, 8, 9, 10],
}
const reykjavik: Destination = {
  id: 'reykjavik-is', name: 'Reykjavik', country: 'Iceland', countryCode: 'IS', continent: 'europe', iata: 'KEF',
  lat: 64.1466, lon: -21.9426, costPerDay: 170, activities: ['adventure', 'relax'], bestMonths: [6, 7, 8],
}
const bangkok: Destination = {
  id: 'bangkok-th', name: 'Bangkok', country: 'Thailand', countryCode: 'TH', continent: 'asia', iata: 'BKK',
  lat: 13.7563, lon: 100.5018, costPerDay: 50, activities: ['culture', 'gastronomy', 'nightlife'], bestMonths: [11, 12, 1, 2],
}

const m = (id: string, origin = MADRID, activities: Member['activities'] = []): Member => ({
  id, name: id, origin, availableDates: ['2026-07-12'], activities,
})

describe('geo', () => {
  it('measures great-circle distance', () => {
    expect(haversineKm(MADRID, BARCELONA)).toBeGreaterThan(480)
    expect(haversineKm(MADRID, BARCELONA)).toBeLessThan(520)
  })
  it('estimates short-haul flights close to reality', () => {
    expect(estimateFlightHours(MADRID, lisbon)).toBeGreaterThanOrEqual(1)
    expect(estimateFlightHours(MADRID, lisbon)).toBeLessThanOrEqual(1.5)
  })
  it('lets longer trips unlock longer flights', () => {
    expect(maxFlightHoursFor(2)).toBeLessThan(maxFlightHoursFor(7))
    expect(maxFlightHoursFor(14)).toBeGreaterThanOrEqual(maxFlightHoursFor(10))
  })
})

describe('scoreDestination', () => {
  const july7 = { start: '2026-07-12', end: '2026-07-18', tripDays: 7 }

  it('weights add up to 1', () => {
    expect(Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0)).toBeCloseTo(1)
  })

  it('explains matches with names, but budgets only as counts', () => {
    const group: Group = {
      members: [m('Gabriel', MADRID, ['beach', 'culture']), m('Pablo', BARCELONA, ['beach']), m('Victor', MADRID, ['ski'])],
      budgetCounts: { budget: 1, moderate: 2 },
    }
    const r = scoreDestination(lisbon, group, july7)
    expect(r.reasons.activities[0]).toEqual({ activity: 'beach', memberNames: ['Gabriel', 'Pablo'] })
    expect(r.reasons.budget).toEqual({ costPerDay: 85, withinCount: 2, total: 3 })
    expect(r.reasons.season).toBe('great')
    expect(r.reasons.flights).toHaveLength(3)
    expect(r.score).toBeGreaterThan(0)
    expect(r.score).toBeLessThanOrEqual(100)
    expect(JSON.stringify(r)).not.toMatch(/moderate|budget"\s*:\s*"/)
  })

  it('scores a better fit higher', () => {
    const group: Group = { members: [m('a', MADRID, ['beach', 'culture']), m('b', MADRID, ['beach'])], budgetCounts: { budget: 2 } }
    expect(scoreDestination(lisbon, group, july7).score).toBeGreaterThan(scoreDestination(reykjavik, group, july7).score)
  })

  it('rules out long-haul for a short trip', () => {
    const group: Group = { members: [m('a')], budgetCounts: {} }
    expect(scoreDestination(bangkok, group, { start: '2026-07-11', end: '2026-07-12', tripDays: 2 }).eligible).toBe(false)
  })

  it('treats a group with no preferences neutrally rather than as zero', () => {
    const group: Group = { members: [m('a'), m('b')], budgetCounts: {} }
    expect(scoreDestination(lisbon, group, july7).score).toBeGreaterThan(50)
  })
})

describe('suggestDestinations', () => {
  it('returns only eligible destinations, best first, up to the limit', () => {
    const group: Group = { members: [m('a', MADRID, ['culture'])], budgetCounts: { moderate: 1 } }
    const list = suggestDestinations([bangkok, reykjavik, lisbon], group, { start: '2026-07-11', end: '2026-07-15', tripDays: 5 }, 2)
    expect(list.map((x) => x.destination.id)).toEqual(['lisbon-pt', 'reykjavik-is'])
  })
})
