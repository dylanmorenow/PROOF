// Motion system. Change feel globally here (see docs/CUSTOMIZING.md).
import type { Transition } from 'motion/react'

export const ease = [0.22, 1, 0.36, 1] as const

export const duration = { micro: 0.12, ui: 0.2, panel: 0.32, cinematic: 0.6 } as const

export const spring = {
  snappy: { type: 'spring', stiffness: 500, damping: 40, mass: 1 },
  smooth: { type: 'spring', stiffness: 260, damping: 32, mass: 1 },
  spotlight: { type: 'spring', stiffness: 170, damping: 26, mass: 1 },
  gentle: { type: 'spring', stiffness: 120, damping: 20, mass: 1 },
} satisfies Record<string, Transition>

/** Staggered module entrance. Pass `custom={index}`. */
export const rise = {
  hidden: { opacity: 0, y: 10 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease, delay: 0.05 + i * 0.05 } }),
}
