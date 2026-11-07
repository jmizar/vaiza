import type { LatLon } from './types'

const EARTH_RADIUS_KM = 6371

export function haversineKm(a: LatLon, b: LatLon): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

/**
 * Rough door-to-door-free flight time: ~800 km/h cruise plus 30 min for
 * take-off, climb and landing. Madrid-Lisbon ≈ 1.1h, Madrid-Paris ≈ 1.8h.
 * Real prices and schedules come later from the flight price API.
 */
export function estimateFlightHours(from: LatLon, to: LatLon): number {
  const km = haversineKm(from, to)
  return Math.round((0.5 + km / 800) * 10) / 10
}

/**
 * Longest flight that makes sense for a trip of this length. A 2-3 day trip
 * shouldn't suggest Tokyo. Tunable: change here, tests document the intent.
 */
export function maxFlightHoursFor(tripDays: number): number {
  if (tripDays <= 2) return 3
  if (tripDays <= 4) return 4
  if (tripDays <= 6) return 6
  if (tripDays <= 9) return 9
  if (tripDays <= 13) return 12
  return 16
}
