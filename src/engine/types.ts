/** Calendar day in the traveller's local calendar, 'YYYY-MM-DD'. Never a timestamp. */
export type ISODate = string

export const BUDGET_TIERS = ['budget', 'moderate', 'premium', 'no_limit'] as const
export type BudgetTier = (typeof BUDGET_TIERS)[number]

/** Daily spend ceiling per tier in EUR (stay + food + activities, excluding flights). */
export const BUDGET_TIER_MAX: Record<BudgetTier, number> = {
  budget: 60,
  moderate: 120,
  premium: 200,
  no_limit: Number.POSITIVE_INFINITY,
}

/** Matches the activity chips in the Figma "Your preferences" screen. */
export const ACTIVITIES = ['beach', 'mountain', 'culture', 'relax', 'gastronomy', 'nightlife', 'shopping', 'adventure', 'ski'] as const
export type Activity = (typeof ACTIVITIES)[number]

export interface LatLon {
  lat: number
  lon: number
}

export interface City extends LatLon {
  id: string
  name: string
  countryCode: string
}

export interface Destination extends LatLon {
  id: string
  name: string
  country: string
  countryCode: string
  continent: 'europe' | 'africa' | 'asia' | 'americas' | 'oceania'
  /** Main airport IATA code, used later for flight price lookups. */
  iata: string
  /** Estimated EUR per person per day, excluding flights. */
  costPerDay: number
  activities: Activity[]
  /** Months (1-12) that are a good time to visit. */
  bestMonths: number[]
}

/**
 * What the engine knows about a member. Budget is deliberately absent:
 * individual budgets are private and only reach the engine as tier counts.
 */
export interface Member {
  id: string
  name: string
  origin: LatLon
  /** Empty until the member has added their dates. */
  availableDates: ISODate[]
  /** Longest trip this member can do, in days. Undefined = no limit. */
  maxTripDays?: number
  activities: Activity[]
}

export type BudgetCounts = Partial<Record<BudgetTier, number>>

export interface Group {
  members: Member[]
  budgetCounts: BudgetCounts
}
