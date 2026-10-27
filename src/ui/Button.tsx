import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cx } from '@/lib/cx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'quiet'
type Size = 'sm' | 'md'

const variants: Record<Variant, string> = {
  primary:
    'bg-cyan text-bg-0 font-semibold shadow-[0_1px_0_rgb(255_255_255/.35)_inset,0_6px_16px_-6px_rgb(118_207_218/.55)] hover:bg-[#8ad9e2] active:bg-[#6cc3ce]',
  secondary: 'bg-surface-2 text-text-1 border border-line-strong hover:bg-surface-3 hover:border-[rgb(142_164_181/.36)]',
  ghost: 'text-text-2 hover:text-text-1 hover:bg-[rgb(142_164_181/.08)]',
  quiet: 'text-cyan hover:bg-cyan-soft',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-[var(--radius-control)]',
  md: 'h-9 px-3.5 text-[13.5px] gap-2 rounded-[var(--radius-control)]',
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
