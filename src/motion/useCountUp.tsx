import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect, useRef } from 'react'

/** Animated number: counts up on first reveal, then tweens briefly on change. No re-renders per frame. */
export function CountUp({ value, format, delay = 0, className }: { value: number; format: (n: number) => string; delay?: number; className?: string }) {
  const reduce = useReducedMotion()
  const mv = useMotionValue(reduce ? value : 0)
  const text = useTransform(mv, format)
  const first = useRef(true)
  useEffect(() => {
    if (reduce) {
      mv.set(value)
      return
    }
    const controls = animate(mv, value, first.current ? { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] } : { duration: 0.35, ease: 'easeOut' })
    first.current = false
    return () => controls.stop()
  }, [value, delay, reduce, mv])
  return <motion.span className={className}>{text}</motion.span>
}
