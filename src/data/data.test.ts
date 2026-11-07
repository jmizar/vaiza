import { describe, expect, it } from 'vitest'
import { ACTIVITIES } from '@/engine/types'
import { estimateFlightHours } from '@/engine/geo'
import { CITIES } from './cities'
import { DESTINATIONS } from './destinations'

describe('reference data', () => {
  it('has unique ids', () => {
    for (const list of [CITIES, DESTINATIONS]) {
      const ids = list.map((x) => x.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('includes all 52 Spanish provincial capitals', () => {
    expect(CITIES.filter((c) => c.countryCode === 'ES')).toHaveLength(52)
  })

  it('has valid coordinates, activities, months and airports', () => {
    for (const d of DESTINATIONS) {
      expect(Math.abs(d.lat)).toBeLessThanOrEqual(90)
      expect(Math.abs(d.lon)).toBeLessThanOrEqual(180)
      expect(d.iata).toMatch(/^[A-Z]{3}$/)
      expect(d.costPerDay).toBeGreaterThan(0)
      expect(d.activities.length).toBeGreaterThan(0)
      for (const a of d.activities) expect(ACTIVITIES).toContain(a)
      for (const m of d.bestMonths) expect(m >= 1 && m <= 12).toBe(true)
    }
  })

  it('gives believable flight times', () => {
    const madrid = CITIES.find((c) => c.id === 'madrid-es')!
    const lisbon = DESTINATIONS.find((d) => d.id === 'lisbon-pt')!
    const tokyo = DESTINATIONS.find((d) => d.id === 'tokyo-jp')!
    expect(estimateFlightHours(madrid, lisbon)).toBeLessThan(1.5)
    expect(estimateFlightHours(madrid, tokyo)).toBeGreaterThan(12)
  })
})
