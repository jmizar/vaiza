import type { ISODate, Member } from './types'

// Days are handled as integer indexes (days since 1970-01-01, UTC) so that
// time zones and DST can never shift a date.
const MS_PER_DAY = 86_400_000

export function toDay(iso: ISODate): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Math.round(Date.UTC(y!, m! - 1, d!) / MS_PER_DAY)
}

export function fromDay(day: number): ISODate {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10)
}

export function addDays(iso: ISODate, n: number): ISODate {
  return fromDay(toDay(iso) + n)
}

/** Inclusive list of dates from start to end. */
export function dateRange(start: ISODate, end: ISODate): ISODate[] {
  const out: ISODate[] = []
  for (let d = toDay(start); d <= toDay(end); d++) out.push(fromDay(d))
  return out
}

export interface TravelWindow {
  start: ISODate
  end: ISODate
  /** Consecutive days everyone in `memberIds` is free. */
  lengthDays: number
  /** Trip length after applying the shortest "maximum trip duration" among the members. */
  tripDays: number
  memberIds: string[]
  /** Members who responded but are not free for this window. */
  missingMemberIds: string[]
}

export interface WindowsResult {
  windows: TravelWindow[]
  /** Members who have added dates (the calculation is "based on X of Y"). */
  respondedIds: string[]
  pendingIds: string[]
}

export interface WindowOptions {
  /** Shortest window worth calling a trip. Docs: 2+ consecutive days. */
  minDays?: number
  limit?: number
}

/** Maximal runs of consecutive days where every member in `ids` is free. */
function runsFor(ids: string[], sets: Map<string, Set<number>>, lo: number, hi: number) {
  const runs: Array<[number, number]> = []
  let runStart: number | null = null
  for (let d = lo; d <= hi + 1; d++) {
    const free = d <= hi && ids.every((id) => sets.get(id)!.has(d))
    if (free && runStart === null) runStart = d
    if (!free && runStart !== null) {
      runs.push([runStart, d - 1])
      runStart = null
    }
  }
  return runs
}

/**
 * Finds the travel windows shown in "Best matches": first everyone who responded,
 * then everyone-but-one. Only consecutive days count; scattered days never add up
 * to a trip.
 */
export function findWindows(members: Member[], opts: WindowOptions = {}): WindowsResult {
  const minDays = opts.minDays ?? 2
  const limit = opts.limit ?? 3
  const responded = members.filter((m) => m.availableDates.length > 0)
  const pendingIds = members.filter((m) => m.availableDates.length === 0).map((m) => m.id)
  const respondedIds = responded.map((m) => m.id)
  if (responded.length === 0) return { windows: [], respondedIds, pendingIds }

  const sets = new Map(responded.map((m) => [m.id, new Set(m.availableDates.map(toDay))]))
  const all = [...sets.values()].flatMap((s) => [...s])
  const lo = Math.min(...all)
  const hi = Math.max(...all)
  const maxDays = new Map(responded.map((m) => [m.id, m.maxTripDays ?? Infinity]))

  const make = (ids: string[], [s, e]: [number, number]): TravelWindow => {
    const lengthDays = e - s + 1
    const cap = Math.min(...ids.map((id) => maxDays.get(id)!))
    return {
      start: fromDay(s),
      end: fromDay(e),
      lengthDays,
      tripDays: Math.min(lengthDays, cap),
      memberIds: ids,
      missingMemberIds: respondedIds.filter((id) => !ids.includes(id)),
    }
  }

  const full = runsFor(respondedIds, sets, lo, hi)
    .filter(([s, e]) => e - s + 1 >= minDays)
    .map((r) => make(respondedIds, r))

  // Everyone-but-one windows, only when the group has 3+ people (for 2 people it is solo travel)
  // and only when the window isn't already inside a full-group window.
  const partial: TravelWindow[] = []
  if (responded.length >= 3) {
    for (const leftOut of respondedIds) {
      const ids = respondedIds.filter((id) => id !== leftOut)
      for (const r of runsFor(ids, sets, lo, hi)) {
        if (r[1] - r[0] + 1 < minDays) continue
        const inside = full.some((w) => toDay(w.start) <= r[0] && toDay(w.end) >= r[1])
        if (!inside) partial.push(make(ids, r))
      }
    }
  }

  const rank = (a: TravelWindow, b: TravelWindow) =>
    b.memberIds.length - a.memberIds.length || b.tripDays - a.tripDays || toDay(a.start) - toDay(b.start)

  return { windows: [...full, ...partial].sort(rank).slice(0, limit), respondedIds, pendingIds }
}

/** Per-day availability for the group calendar: who is free on each date. */
export function availabilityByDay(members: Member[]): Map<ISODate, string[]> {
  const map = new Map<ISODate, string[]>()
  for (const m of members) {
    for (const d of m.availableDates) map.set(d, [...(map.get(d) ?? []), m.id])
  }
  return map
}

export interface UpgradeHint {
  /** Members who would need to free up extra days (1 or 2 people). */
  memberIds: string[]
  /** The specific extra dates each of them would need to be free. */
  daysNeeded: Record<string, ISODate[]>
  /** Largest number of extra days any one of them needs to free. */
  extraDays: number
  newWindow: { start: ISODate; end: ISODate; lengthDays: number }
  /** How many days longer than today's best full-group window. */
  gainDays: number
}

export interface HintOptions {
  /** Most extra days we'd ask one person to free. */
  maxExtraDaysPerPerson?: number
  /** Longest window considered. */
  maxWindowDays?: number
  limit?: number
}

/**
 * "Travel upgrade opportunity": if one or two people freed a couple of extra
 * days, how much longer could the whole group travel?
 */
export function upgradeHints(members: Member[], opts: HintOptions = {}): UpgradeHint[] {
  const maxExtra = opts.maxExtraDaysPerPerson ?? 3
  const limit = opts.limit ?? 3
  const responded = members.filter((m) => m.availableDates.length > 0)
  if (responded.length < 2) return []
  // No point stretching the window past the shortest "maximum trip duration".
  const maxLen = Math.min(opts.maxWindowDays ?? 21, ...responded.map((m) => m.maxTripDays ?? Infinity))

  const sets = new Map(responded.map((m) => [m.id, new Set(m.availableDates.map(toDay))]))
  const all = [...sets.values()].flatMap((s) => [...s])
  const lo = Math.min(...all)
  const hi = Math.max(...all)
  const best = Math.max(0, ...findWindows(responded, { minDays: 1, limit: 1000 }).windows
    .filter((w) => w.memberIds.length === responded.length)
    .map((w) => w.lengthDays))

  const bestBySet = new Map<string, UpgradeHint>()
  for (let s = lo; s <= hi; s++) {
    for (let len = Math.max(best + 1, 2); len <= maxLen && s + len - 1 <= hi; len++) {
      const e = s + len - 1
      const missing: Record<string, number[]> = {}
      let tooMany = false
      for (const [id, set] of sets) {
        const gaps: number[] = []
        for (let d = s; d <= e; d++) if (!set.has(d)) gaps.push(d)
        if (gaps.length > maxExtra) {
          tooMany = true
          break
        }
        if (gaps.length) missing[id] = gaps
      }
      const ids = Object.keys(missing)
      if (tooMany || ids.length === 0 || ids.length > 2) continue
      // Pairs only get small asks (max 2 days each) to keep the hint realistic.
      if (ids.length === 2 && ids.some((id) => missing[id]!.length > 2)) continue
      // A window that needs someone to free most of it isn't a near miss.
      if (ids.some((id) => missing[id]!.length * 2 > len)) continue

      const extraDays = Math.max(...ids.map((id) => missing[id]!.length))
      const hint: UpgradeHint = {
        memberIds: ids,
        daysNeeded: Object.fromEntries(ids.map((id) => [id, missing[id]!.map(fromDay)])),
        extraDays,
        newWindow: { start: fromDay(s), end: fromDay(e), lengthDays: len },
        gainDays: len - best,
      }
      const key = [...ids].sort().join('+')
      const prev = bestBySet.get(key)
      if (
        !prev ||
        hint.newWindow.lengthDays > prev.newWindow.lengthDays ||
        (hint.newWindow.lengthDays === prev.newWindow.lengthDays && hint.extraDays < prev.extraDays)
      ) {
        bestBySet.set(key, hint)
      }
    }
  }

  return [...bestBySet.values()]
    .sort((a, b) => a.memberIds.length - b.memberIds.length || b.gainDays - a.gainDays || a.extraDays - b.extraDays)
    .slice(0, limit)
}
