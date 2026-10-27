import { create } from 'zustand'

export type PipMood = 'idle' | 'attentive' | 'guiding' | 'success' | 'unavailable' | 'celebrating'

export interface PipAnchor {
  x: number
  y: number
  size: number
}

interface PipState {
  mood: PipMood
  /** Where PIP sits: null = its dock; otherwise a viewport rect centre and size (e.g. the tour card slot). */
  anchor: PipAnchor | null
  /** Viewport point PIP looks at (spotlight target centre), or null. */
  gaze: { x: number; y: number } | null
  /** Halo progress 0..1 — the five P.R.O.O.F. segments light up as a tour advances. */
  progress: number
  pickerOpen: boolean
  setMood: (m: PipMood) => void
  /** Play a transient reaction, then return to the resting mood. */
  react: (m: 'success' | 'unavailable' | 'celebrating', ms?: number) => void
  setAnchor: (a: PipAnchor | null) => void
  setGaze: (g: { x: number; y: number } | null) => void
  setProgress: (p: number) => void
  setPickerOpen: (open: boolean) => void
}

let reactionTimer: ReturnType<typeof setTimeout> | undefined
let restingMood: PipMood = 'idle'

export const usePip = create<PipState>((set, get) => ({
  mood: 'idle',
  anchor: null,
  gaze: null,
  progress: 0,
  pickerOpen: false,
  setMood: (mood) => {
    restingMood = mood
    if (!reactionTimer) set({ mood })
  },
  react: (m, ms = 1400) => {
    clearTimeout(reactionTimer)
    set({ mood: m })
    reactionTimer = setTimeout(() => {
      reactionTimer = undefined
      set({ mood: restingMood })
    }, ms)
    void get
  },
  setAnchor: (anchor) => set({ anchor }),
  setGaze: (gaze) => set({ gaze }),
  setProgress: (progress) => set({ progress }),
  setPickerOpen: (pickerOpen) => set({ pickerOpen }),
}))

/** Decide once whether the 3D mascot is appropriate for this device. */
export function canRender3D(): boolean {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  if (params.get('pip') === 'svg') return false
  if (params.get('pip') === '3d') return true
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  const nav = navigator as Navigator & { deviceMemory?: number }
  if ((nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) < 2) return false
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}
