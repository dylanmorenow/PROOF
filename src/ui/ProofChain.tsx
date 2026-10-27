import type { ProofStage } from '@/data/types'
import { cx } from '@/lib/cx'

const STEPS = ['Captured', 'Submitted', 'Verified', 'Acknowledged'] as const

const LEVEL: Record<ProofStage, number> = { captured: 1, submitted: 2, recapture: 2, verified: 3, acknowledged: 4 }

export const STAGE_COLOR: Record<ProofStage, string> = {
  captured: '#8794A1',
  submitted: '#127C91',
  recapture: '#C97A0A',
  verified: '#1A8A55',
  acknowledged: '#1A8A55',
}

export const STAGE_LABEL: Record<ProofStage, string> = {
  captured: 'Captured',
  submitted: 'Submitted',
  recapture: 'Re-capture requested',
  verified: 'Verified',
  acknowledged: 'Acknowledged',
}

/** Hexagonal pip, the PROOF brand unit. */
function Pip({ x, fill, stroke }: { x: number; fill: string; stroke: string }) {
  return <path transform={`translate(${x} 0)`} d="M5 0.8 8.6 2.9v4.2L5 9.2 1.4 7.1V2.9Z" fill={fill} stroke={stroke} strokeWidth="1.1" />
}

/**
 * The Proof Chain glyph: Captured → Submitted → Verified → Acknowledged.
 * Uploaded (submitted) evidence is visibly different from verified evidence.
 */
export function ProofChain({ stage, showLabel = false, className }: { stage: ProofStage; showLabel?: boolean; className?: string }) {
  const n = LEVEL[stage]
  const color = STAGE_COLOR[stage]
  const label = stage === 'recapture' ? STAGE_LABEL.recapture : STEPS[n - 1]
  return (
    <span className={cx('inline-flex items-center gap-2', className)} title={label}>
      <svg width="50" height="10" viewBox="0 0 50 10" role="img" aria-label={`Proof Chain: ${label}`} className="shrink-0">
        <path d="M8 5h34" stroke="rgb(142 164 181 / .25)" strokeWidth="1" />
        <path d={`M8 5h${Math.max(0, (n - 1) * 13)}`} stroke={color} strokeOpacity=".7" strokeWidth="1" />
        {[0, 1, 2, 3].map((i) => {
          const on = i < n
          return <Pip key={i} x={i * 13} fill={on ? (i === n - 1 ? color : `${color}55`) : '#ffffff'} stroke={on ? color : 'rgb(142 164 181 / .35)'} />
        })}
      </svg>
      {showLabel && <span className="whitespace-nowrap text-[12px] text-text-2">{label}</span>}
    </span>
  )
}

/** Aggregate evidence state for a work order. */
export function ProofSummary({
  verified,
  acknowledged,
  pending,
  recapture,
  total,
}: {
  verified: number
  acknowledged: number
  pending: number
  recapture: number
  total: number
}) {
  if (!total) return <span className="text-[12px] text-text-3">No evidence yet</span>
  const proven = verified + acknowledged
  return (
    <span className="inline-flex items-center gap-2 tabular" title={`${proven} of ${total} evidence records verified`}>
      <span className="flex h-1.5 w-14 gap-px overflow-hidden rounded-full bg-[rgb(142_164_181/.16)]">
        <span className="h-full bg-verified" style={{ width: `${(acknowledged / total) * 100}%` }} />
        <span className="h-full bg-verified/55" style={{ width: `${(verified / total) * 100}%` }} />
        <span className="h-full bg-amber" style={{ width: `${(recapture / total) * 100}%` }} />
        <span className="h-full bg-cyan/60" style={{ width: `${(pending / total) * 100}%` }} />
      </span>
      <span className="text-[12px] text-text-2">
        <span className="text-text-1">{proven}</span>/{total}
      </span>
    </span>
  )
}
