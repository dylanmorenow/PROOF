import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cx } from '@/lib/cx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'quiet'
type Size = 'sm' | 'md'

const variants: Record<Variant, string> = {
  primary:
    'bg-teal text-white font-semibold hover:bg-[#0f6b7d] active:bg-[#0c5d6c]',
  secondary: 'bg-white text-text-1 border border-line-strong hover:bg-surface-3',
  ghost: 'text-text-2 hover:text-text-1 hover:bg-black/[.04]',
  quiet: 'text-cyan hover:bg-cyan-soft',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3.5 text-[13px] gap-1.5 rounded-full',
  md: 'h-9 px-4 text-[14px] gap-2 rounded-full',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = 'secondary', size = 'md', className, ...rest }, ref) {
  return (
    <button
      ref={ref}
      className={cx(
        'inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-[.98] disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    />
  )
})
