import { motion, type HTMLMotionProps } from 'motion/react'
import { forwardRef } from 'react'
import { cx } from '@/lib/cx'
import { rise } from '@/motion/tokens'

interface CardProps extends Omit<HTMLMotionProps<'section'>, 'title' | 'children'> {
  children?: React.ReactNode
  title?: React.ReactNode
  eyebrow?: React.ReactNode
  actions?: React.ReactNode
  /** Stagger index for the entrance animation. */
  index?: number
  bodyClassName?: string
  tour?: string
  lens?: 'B' | 'C' | 'X'
}

export const LENS_LABEL = { B: 'Option B · Delivery resilience', C: 'Option C · Digital CX', X: 'Independent concept' } as const

/** Section card: matte navy surface, hairline border, inner top highlight. */
export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  { title, eyebrow, actions, index = 0, className, bodyClassName, children, tour, lens, ...rest },
  ref,
) {
  return (
    <motion.section
      ref={ref}
      variants={rise}
      initial="hidden"
      animate="show"
      custom={index}
      data-tour={tour}
      data-lens={lens}
      data-lens-label={lens ? LENS_LABEL[lens] : undefined}
      className={cx('surface-card relative flex min-w-0 flex-col', className)}
      {...rest}
    >
      {(title || actions) && (
        <header className="flex min-h-12 items-center justify-between gap-3 px-5 pt-5 pb-3">
          <div className="min-w-0">
            {eyebrow && <div className="eyebrow mb-0.5">{eyebrow}</div>}
            {title && <h2 className="truncate text-[17px] font-semibold tracking-[-0.015em] text-text-1">{title}</h2>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cx('min-h-0 flex-1', bodyClassName ?? 'px-5 pb-5')}>{children}</div>
    </motion.section>
  )
})
