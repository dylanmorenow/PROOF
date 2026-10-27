import type { Placement } from '@floating-ui/react-dom'

export interface TourContext {
  navigate: (to: string) => void
  isMobile: boolean
}

export interface TourStep {
  id: string
  /** Route the target lives on. The engine navigates first and waits for the target. */
  route?: string
  /** `data-tour` value of the element to spotlight. Omit for a centred, spotlight-free step. */
  target?: string
  placement?: Placement
  padding?: number
  /** Allow clicks inside the spotlight. */
  interactive?: boolean
  /** Put the UI in the right state before measuring (select a record, open a drawer…). */
  prepare?: (ctx: TourContext) => void
  /** Undo `prepare` when leaving the step. */
  cleanup?: (ctx: TourContext) => void
  title: string
  what: string
  why: string
  action: string
  cta?: { label: string; run: (ctx: TourContext & { startTour: (id: string) => void; end: () => void }) => void }
}

export interface TourDef {
  id: string
  title: string
  summary: string
  duration: string
  steps: TourStep[]
}
