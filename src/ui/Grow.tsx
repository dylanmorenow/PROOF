import { motion } from 'motion/react'

/** A bar fill that grows from zero to its value, and eases to new values when data changes. */
export function Grow({ pct, className, color, delay = 0 }: { pct: number; className?: string; color?: string; delay?: number }) {
  return (
    <motion.span
      className={className ?? 'block h-full rounded-full'}
      style={{ background: color }}
      initial={{ width: 0 }}
      animate={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      transition={{ type: 'spring', bounce: 0, duration: 0.9, delay }}
    />
  )
}
