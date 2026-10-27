import type { ActiveStatus, Priority, QualificationStatus, WorkOrderStatus } from '@/data/types'
import { cx } from '@/lib/cx'

export type Tone = 'neutral' | 'info' | 'attention' | 'critical' | 'verified' | 'muted'

export const STATUS_META: Record<WorkOrderStatus, { label: string; tone: Tone }> = {
  mobilizing: { label: 'Mobilizing', tone: 'neutral' },
  'in-progress': { label: 'In progress', tone: 'info' },
  'awaiting-evidence': { label: 'Awaiting evidence', tone: 'attention' },
  'pending-ack': { label: 'Pending acknowledgment', tone: 'attention' },
  'on-hold': { label: 'On hold', tone: 'critical' },
  scheduled: { label: 'Scheduled', tone: 'muted' },
  completed: { label: 'Completed', tone: 'verified' },
}

export const ACTIVE_STATUS_ORDER: ActiveStatus[] = ['mobilizing', 'in-progress', 'awaiting-evidence', 'pending-ack', 'on-hold']

export const toneDot: Record<Tone, string> = {
  neutral: 'bg-text-2',
  info: 'bg-cyan',
  attention: 'bg-amber',
  critical: 'bg-critical',
  verified: 'bg-verified',
  muted: 'bg-text-3',
}

const toneText: Record<Tone, string> = {
  neutral: 'text-text-1',
  info: 'text-text-1',
  attention: 'text-amber',
  critical: 'text-critical',
  verified: 'text-verified',
  muted: 'text-text-2',
}

export function StatusDot({ tone, pulse }: { tone: Tone; pulse?: boolean }) {
  return (
    <span className="relative inline-flex size-1.5 shrink-0">
      {pulse && <span className={cx('absolute inset-0 rounded-full opacity-60 [animation:node-pulse_2s_ease-out_infinite]', toneDot[tone])} />}
      <span className={cx('relative inline-flex size-1.5 rounded-full', toneDot[tone])} />
    </span>
  )
}

export function StatusPill({ status, className }: { status: WorkOrderStatus; className?: string }) {
  const meta = STATUS_META[status]
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap text-[12.5px] font-medium', toneText[meta.tone], className)}>
      <StatusDot tone={meta.tone} />
      {meta.label}
    </span>
  )
}

export function PriorityTag({ priority }: { priority: Priority }) {
  return (
    <span
      className={cx(
        'inline-flex h-5 items-center rounded-[4px] border px-1.5 font-mono text-[10.5px] font-semibold tracking-wide',
        priority === 'P1'
          ? 'border-[rgb(229_72_77/.4)] text-critical'
          : priority === 'P2'
            ? 'border-[rgb(233_162_59/.35)] text-amber'
            : 'border-line-strong text-text-2',
      )}
    >
      {priority}
    </span>
  )
}

export const QUAL_META: Record<QualificationStatus, { label: string; className: string }> = {
  qualified: { label: 'Qualified', className: 'text-verified border-[rgb(79_191_139/.35)] bg-verified-soft' },
  conditional: { label: 'Conditional', className: 'text-amber border-[rgb(233_162_59/.35)] bg-amber-soft' },
  'in-review': { label: 'In review', className: 'text-text-2 border-line-strong bg-[rgb(142_164_181/.08)]' },
}

export function QualificationBadge({ status }: { status: QualificationStatus }) {
  const m = QUAL_META[status]
  return <span className={cx('inline-flex h-5 items-center rounded-full border px-2 text-[11px] font-medium', m.className)}>{m.label}</span>
}
