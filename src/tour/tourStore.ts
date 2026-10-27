import { create } from 'zustand'
import { usePip } from '@/pip/pipStore'
import { TOURS } from './tours'
import type { TourDef } from './types'

interface TourState {
  tour: TourDef | null
  index: number
  /** +1 forward, -1 back — used to slide card content in the travel direction. */
  direction: 1 | -1
  start: (id: string) => void
  next: () => void
  back: () => void
  goTo: (i: number) => void
  end: (completed?: boolean) => void
}

export const useTour = create<TourState>((set, get) => ({
  tour: null,
  index: 0,
  direction: 1,
  start: (id) => {
    const tour = TOURS.find((t) => t.id === id)
    if (!tour || !tour.steps.length) {
      usePip.getState().react('unavailable')
      return
    }
    usePip.getState().setPickerOpen(false)
    set({ tour, index: 0, direction: 1 })
  },
  next: () => {
    const { tour, index } = get()
    if (!tour) return
    if (index >= tour.steps.length - 1) get().end(true)
    else set({ index: index + 1, direction: 1 })
  },
  back: () => {
    const { index } = get()
    if (index > 0) set({ index: index - 1, direction: -1 })
  },
  goTo: (i) => set((s) => ({ index: i, direction: i >= s.index ? 1 : -1 })),
  end: (completed = false) => {
    set({ tour: null, index: 0 })
    const pip = usePip.getState()
    pip.setAnchor(null)
    pip.setGaze(null)
    pip.setMood('idle')
    if (completed) pip.react('celebrating', 1800)
    setTimeout(() => usePip.getState().setProgress(0), completed ? 1800 : 0)
  },
}))
