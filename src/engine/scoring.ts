import { toDay, fromDay } from './dates'
import { estimateFlightHours, maxFlightHoursFor } from './geo'
import {
  BUDGET_TIER_MAX,
  type Activity,
  type BudgetCounts,
  type BudgetTier,
  type Destination,
  type Group,
  type ISODate,
} from './types'

/** Weights of the 0-100 match score. Must add up to 1. */
export const SCORE_WEIGHTS = { activities: 0.4, budget: 0.3, season: 0.15, flight: 0.15 } as const

export interface MatchReasons {
  /** Activities this destination offers, with who asked for them ("Beach: Gabriel, Pablo"). */
  activities: Array<{ activity: Activity; memberNames: string[] }>
  /** How many members' budgets this destination fits. Never says whose. */
  budget: { costPerDay: number; withinCount: number; total: number }
  season: 'great' | 'off'
  flights: Array<{ memberId: string; name: string; hours: number }>
  longestFlight: { name: string; hours: number }
}

export interface DestinationMatch {
  destination: Destination
  /** 0-100 */
  score: number
  /** False when someone's flight is too long for the trip length. */
  eligible: boolean
  reasons: MatchReasons
}

export interface TripWindow {
  start: ISODate
  end: ISODate
  tripDays: number
}

function budgetFit(counts: BudgetCounts, costPerDay: number) {
  let withinCount = 0
  let total = 0
  for (const [tier, n] of Object.entries(counts) as Array<[BudgetTier, number]>) {
    total += n
    if (BUDGET_TIER_MAX[tier] >= costPerDay) withinCount += n
  }
  return { withinCount, total }
}

function monthsIn(window: TripWindow): Set<number> {
  const months = new Set<number>()
  const first = toDay(window.start)
  for (let d = first; d < first + window.tripDays; d++) months.add(Number(fromDay(d).slice(5, 7)))
  return months
}

export function scoreDestination(dest: Destination, group: Group, window: TripWindow): DestinationMatch {
  const { members } = group

  // Activities: for each member who picked activities, the share of their picks this place offers.
  const withPrefs = members.filter((m) => m.activities.length > 0)
  const activityScore = withPrefs.length
    ? withPrefs.reduce(
        (sum, m) => sum + m.activities.filter((a) => dest.activities.includes(a)).length / m.activities.length,
        0,
      ) / withPrefs.length
    : 0.6 // nobody expressed a preference: neutral
  const activities = dest.activities
    .map((activity) => ({
      activity,
      memberNames: members.filter((m) => m.activities.includes(activity)).map((m) => m.name),
    }))
    .filter((a) => a.memberNames.length > 0)
    .sort((a, b) => b.memberNames.length - a.memberNames.length)

  const { withinCount, total } = budgetFit(group.budgetCounts, dest.costPerDay)
  const budgetScore = total ? withinCount / total : 1

  const months = monthsIn(window)
  const goodSeason = [...months].some((m) => dest.bestMonths.includes(m))
  const seasonScore = goodSeason ? 1 : 0.4

  const flights = members.map((m) => ({ memberId: m.id, name: m.name, hours: estimateFlightHours(m.origin, dest) }))
  const longestFlight = flights.reduce((a, b) => (b.hours > a.hours ? b : a), flights[0] ?? { memberId: '', name: '', hours: 0 })
  const cap = maxFlightHoursFor(window.tripDays)
  const eligible = longestFlight.hours <= cap
  const flightScore = eligible ? 1 - 0.5 * (longestFlight.hours / cap) : 0

  const score = Math.round(
    100 *
      (SCORE_WEIGHTS.activities * activityScore +
        SCORE_WEIGHTS.budget * budgetScore +
        SCORE_WEIGHTS.season * seasonScore +
        SCORE_WEIGHTS.flight * flightScore),
  )

  return {
    destination: dest,
    score,
    eligible,
    reasons: {
      activities,
      budget: { costPerDay: dest.costPerDay, withinCount, total },
      season: goodSeason ? 'great' : 'off',
      flights,
      longestFlight: { name: longestFlight.name, hours: longestFlight.hours },
    },
  }
}

/** The ranked list shown in "Where do you want to go?" (Figma shows 7). */
export function suggestDestinations(
  destinations: Destination[],
  group: Group,
  window: TripWindow,
  limit = 7,
): DestinationMatch[] {
  return destinations
    .map((d) => scoreDestination(d, group, window))
    .filter((m) => m.eligible)
    .sort((a, b) => b.score - a.score || a.destination.costPerDay - b.destination.costPerDay)
    .slice(0, limit)
}
