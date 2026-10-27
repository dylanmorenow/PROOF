import { motion } from 'motion/react'
import { useId } from 'react'
import { cx } from '@/lib/cx'
import { spring } from '@/motion/tokens'

interface Option<T extends string> {
  value: T
  label: React.ReactNode
  title?: string
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
  className,
}: {
  options: Option<T>[]
  value: T
  onChange: (v: T) => void
  label: string
  size?: 'sm' | 'md'
  className?: string
}) {
  const id = useId()
  return (
    <div role="radiogroup" aria-label={label} className={cx('relative inline-flex rounded-[8px] border border-line bg-bg-1 p-0.5', className)}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={cx(
              'relative z-0 inline-flex items-center justify-center gap-1.5 rounded-[6px] font-medium transition-colors duration-150',
              size === 'sm' ? 'h-6 px-2.5 text-[12px]' : 'h-7 px-3 text-[12.5px]',
              active ? 'text-text-1' : 'text-text-2 hover:text-text-1',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                transition={spring.snappy}
                className="absolute inset-0 -z-10 rounded-[6px] border border-line-strong bg-surface-2 shadow-[0_1px_0_rgb(255_255_255/.05)_inset,0_1px_2px_rgb(0_0_0/.3)]"
              />
            )}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
