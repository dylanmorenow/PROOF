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
  /** The opening invitation: no counter or progress, Start/Not now buttons. */
  intro?: boolean
  title: string
  /** One short paragraph: what this is and what it is for. */
  body: string
}

export interface TourDef {
  id: string
  title: string
  summary: string
  duration: string
  steps: TourStep[]
}
