import { Check } from 'lucide-react'
import { motion } from 'motion/react'
import type { Milestone } from '@/data/types'
import { cx } from '@/lib/cx'
import { fmtDate } from '@/lib/format'

/** Vertical milestone timeline: done, current, blocked, upcoming. Late steps show in amber. */
export function Milestones({ milestones }: { milestones: Milestone[] }) {
  return (
    <ol className="relative">
      {milestones.map((m, i) => {
        const late = !!m.actual && m.actual > m.planned
        const last = i === milestones.length - 1
        return (
          <li key={m.id} className="relative flex gap-3 pb-5 last:pb-0">
            {!last && (
              <motion.span
                className={cx('absolute top-6 bottom-0 left-[11px] w-0.5 origin-top', m.state === 'done' ? 'bg-teal' : 'bg-black/10')}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.35, delay: 0.1 + i * 0.09 }}
                aria-hidden="true"
              />
            )}
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.35, duration: 0.45, delay: i * 0.09 }}
              className={cx(
                'relative z-10 grid size-6 shrink-0 place-items-center rounded-full',
                m.state === 'done' && 'bg-teal text-white',
                m.state === 'current' && 'bg-white ring-2 ring-teal',
                m.state === 'blocked' && 'bg-white ring-2 ring-critical',
                m.state === 'upcoming' && 'bg-white ring-1 ring-black/15',
              )}
            >
              {m.state === 'done' && <Check className="size-3.5" strokeWidth={3} />}
              {m.state === 'current' && <span className="size-2 rounded-full bg-teal" />}
              {m.state === 'blocked' && <span className="size-2 rounded-full bg-critical" />}
            </motion.span>
            <span className="flex min-w-0 flex-1 items-baseline justify-between gap-3 pt-0.5">
              <span className={cx('text-[14px]', m.state === 'upcoming' ? 'text-text-2' : 'font-medium text-text-1')}>{m.name}</span>
              <span className={cx('shrink-0 text-[13px] tabular', late ? 'text-amber' : 'text-text-2')}>
                {fmtDate(m.actual ?? m.planned, false)}
                {late && ' late'}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
