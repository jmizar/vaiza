import { create } from 'zustand'
import type { ISODate } from '@/engine'

/* Unsaved form state that has to survive opening a picker screen (city search, destination search).
   Not persisted: closing the app discards drafts, like a native form. */
export interface DatesDraft {
  dates: ISODate[]
  cityId?: string
  maxTripDays?: number
  month: { year: number; month: number }
}

interface Drafts {
  setup: { name: string; cityId?: string }
  newTrip: { name: string; destinationId?: string }
  dates: Record<string, DatesDraft>
  setSetup: (p: Partial<Drafts['setup']>) => void
  setNewTrip: (p: Partial<Drafts['newTrip']>) => void
  resetNewTrip: () => void
  setDates: (tripId: string, p: Partial<DatesDraft>) => void
  clearDates: (tripId: string) => void
}

export const useDrafts = create<Drafts>((set) => ({
  setup: { name: '' },
  newTrip: { name: '' },
  dates: {},
  setSetup: (p) => set((s) => ({ setup: { ...s.setup, ...p } })),
  setNewTrip: (p) => set((s) => ({ newTrip: { ...s.newTrip, ...p } })),
  resetNewTrip: () => set({ newTrip: { name: '' } }),
  setDates: (tripId, p) =>
    set((s) => {
      const prev = s.dates[tripId] ?? { dates: [], month: { year: new Date().getFullYear(), month: new Date().getMonth() } }
      return { dates: { ...s.dates, [tripId]: { ...prev, ...p } } }
    }),
  clearDates: (tripId) =>
    set((s) => {
      const next = { ...s.dates }
      delete next[tripId]
      return { dates: next }
    }),
}))
