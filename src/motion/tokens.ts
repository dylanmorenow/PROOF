// Motion system — Apple-style springs: critically damped (no overshoot) by default.
// Change feel globally here (see docs/CUSTOMIZING.md).
import type { Transition } from 'motion/react'

export const ease = [0.22, 1, 0.36, 1] as const

export const spring = {
  snappy: { type: 'spring', bounce: 0, duration: 0.3 },
  smooth: { type: 'spring', bounce: 0, duration: 0.4 },
  spotlight: { type: 'spring', bounce: 0, duration: 0.45 },
} satisfies Record<string, Transition>

/** Staggered module entrance. Pass `custom={index}`. */
export const rise = {
  hidden: { opacity: 0, y: 8 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, ease, delay: i * 0.04 } }),
}
