import { describe, expect, it } from 'vitest'
import { addDays, availabilityByDay, dateRange, findWindows, toDay, fromDay, upgradeHints } from './dates'
import type { Member } from './types'

const LONDON = { lat: 51.5072, lon: -0.1276 }
const member = (id: string, dates: string[], extra: Partial<Member> = {}): Member => ({
  id,
  name: id,
  origin: LONDON,
  availableDates: dates,
  activities: [],
  ...extra,
})

describe('date helpers', () => {
  it('round-trips days without time-zone drift', () => {
    expect(fromDay(toDay('2026-03-29'))).toBe('2026-03-29') // EU DST change day
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(dateRange('2026-02-27', '2026-03-02')).toEqual(['2026-02-27', '2026-02-28', '2026-03-01', '2026-03-02'])
  })
})

describe('findWindows', () => {
  // Mirrors the Figma "Best matches" example.
  const john = member('john', [...dateRange('2026-07-10', '2026-07-18'), ...dateRange('2026-07-26', '2026-07-28'), ...dateRange('2026-08-03', '2026-08-06')])
  const gabriel = member('gabriel', [
    ...dateRange('2026-07-12', '2026-07-20'),
    ...dateRange('2026-07-26', '2026-07-29'),
    ...dateRange('2026-08-03', '2026-08-06'),
  ])
  const pablo = member('pablo', [...dateRange('2026-07-12', '2026-07-18'), ...dateRange('2026-07-25', '2026-07-28')])

  it('ranks full-group windows first, longest first', () => {
    const { windows } = findWindows([john, gabriel, pablo])
    expect(windows[0]).toMatchObject({ start: '2026-07-12', end: '2026-07-18', lengthDays: 7, memberIds: ['john', 'gabriel', 'pablo'] })
    expect(windows[1]).toMatchObject({ start: '2026-07-26', end: '2026-07-28', lengthDays: 3 })
  })

  it('adds an everyone-but-one window when it is not inside a full window', () => {
    const { windows } = findWindows([john, gabriel, pablo])
    expect(windows[2]).toMatchObject({ start: '2026-08-03', end: '2026-08-06', lengthDays: 4, missingMemberIds: ['pablo'] })
  })

  it('only counts consecutive days: scattered overlaps are not a trip', () => {
    const a = member('a', ['2026-07-01', '2026-07-03', '2026-07-05'])
    const b = member('b', ['2026-07-01', '2026-07-03', '2026-07-05'])
    expect(findWindows([a, b]).windows).toEqual([])
  })

  it('reports who has not added dates yet ("based on 2 of 3")', () => {
    const r = findWindows([john, gabriel, member('victor', [])])
    expect(r.respondedIds).toEqual(['john', 'gabriel'])
    expect(r.pendingIds).toEqual(['victor'])
    expect(r.windows[0]!.memberIds).toEqual(['john', 'gabriel'])
  })

  it('caps trip length by the shortest maximum trip duration', () => {
    const a = member('a', dateRange('2026-08-01', '2026-08-31'), { maxTripDays: 12 })
    const b = member('b', dateRange('2026-08-01', '2026-08-31'))
    const [w] = findWindows([a, b]).windows
    expect(w).toMatchObject({ lengthDays: 31, tripDays: 12 })
  })

  it('returns nothing for an empty group', () => {
    expect(findWindows([]).windows).toEqual([])
  })
})

describe('availabilityByDay', () => {
  it('lists who is free each day for the group calendar dots', () => {
    const map = availabilityByDay([member('a', ['2026-07-01']), member('b', ['2026-07-01', '2026-07-02'])])
    expect(map.get('2026-07-01')).toEqual(['a', 'b'])
    expect(map.get('2026-07-02')).toEqual(['b'])
  })
})

describe('upgradeHints', () => {
  it('finds that one person freeing 2 days grows the window', () => {
    const a = member('a', dateRange('2026-07-10', '2026-07-20'))
    const b = member('b', dateRange('2026-07-10', '2026-07-20'))
    const gabriel = member('gabriel', dateRange('2026-07-12', '2026-07-18')) // 7 days
    const hints = upgradeHints([a, b, gabriel])
    const solo = hints.find((h) => h.memberIds.length === 1 && h.memberIds[0] === 'gabriel')!
    expect(solo).toBeDefined()
    expect(solo.extraDays).toBeLessThanOrEqual(3)
    expect(solo.newWindow.lengthDays).toBeGreaterThan(7)
    expect(solo.daysNeeded.gabriel!.length).toBe(solo.extraDays)
  })

  it('suggests a pair when two people each need to move a day', () => {
    const a = member('a', dateRange('2026-07-10', '2026-07-20'))
    const g = member('g', dateRange('2026-07-12', '2026-07-20'))
    const p = member('p', dateRange('2026-07-10', '2026-07-18'))
    // Today the group shares 12-18 (7 days). Both g and p freeing 1-2 days gets 9+.
    const hints = upgradeHints([a, g, p])
    expect(hints.some((h) => h.memberIds.length === 2)).toBe(true)
  })

  it('never stretches past the shortest maximum trip duration', () => {
    const a = member('a', dateRange('2026-07-01', '2026-07-30'), { maxTripDays: 7 })
    const b = member('b', dateRange('2026-07-05', '2026-07-11'))
    expect(upgradeHints([a, b])).toEqual([])
  })

  it('needs at least two people with dates', () => {
    expect(upgradeHints([member('a', ['2026-07-01'])])).toEqual([])
  })
})
