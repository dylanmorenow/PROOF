import { cx } from '@/lib/cx'

/** Change vs prior period. `goodWhen` says which direction is good, so colour carries meaning. */
export function Delta({
  value,
  unit = 'pp',
  goodWhen = 'up',
  digits = 1,
}: {
  value: number | null
  unit?: string
  goodWhen?: 'up' | 'down'
  digits?: number
}) {
  if (value == null || !Number.isFinite(value)) return <span className="text-[12px] text-text-3">n/a</span>
  const flat = Math.abs(value) < 0.05
  const good = flat ? null : value > 0 === (goodWhen === 'up')
  return (
    <span
      className={cx(
        'inline-flex h-5 items-center gap-1 rounded-[4px] px-1.5 text-[11.5px] font-medium whitespace-nowrap tabular',
        good === null ? 'bg-[rgb(142_164_181/.1)] text-text-2' : good ? 'bg-verified-soft text-verified' : 'bg-amber-soft text-amber',
      )}
    >
      {!flat && (
        <svg width="7" height="7" viewBox="0 0 8 8" aria-hidden="true" className={cx(value < 0 && 'rotate-180')}>
          <path d="M4 1 7.5 7H.5Z" fill="currentColor" />
        </svg>
      )}
      {flat ? '±' : value > 0 ? '+' : '−'}
      {Math.abs(value).toFixed(digits)}
      {unit === 'pp' ? ' pp' : unit}
    </span>
  )
}
