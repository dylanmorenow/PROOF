import { ArrowUpRight, CircleCheck, TriangleAlert, UserCheck } from 'lucide-react'
import { Link } from 'react-router'
import { useApp } from '@/app/store'
import type { ProofFunnel as Funnel } from '@/data/selectors'
import type { ServiceException, WorkOrder } from '@/data/types'
import { cx } from '@/lib/cx'
import { fmtRelative } from '@/lib/format'
import { Card } from '@/ui/Card'
import { Grow } from '@/ui/Grow'
import type { OverviewData } from './useOverview'

/* ───────────── Needs attention ───────────── */

type AttentionItem = { kind: 'ack'; wo: WorkOrder; at: string } | { kind: 'exception'; x: ServiceException; wo: WorkOrder; at: string }

const SEVERITY_RANK = { high: 0, medium: 1, low: 2 }

export function NeedsAttention({ data }: { data: OverviewData }) {
  const workOrders = useApp((s) => s.dataset.workOrders)
  const idx = new Map(workOrders.map((w) => [w.id, w]))
  const items: AttentionItem[] = [
    ...data.pendingAck.map((wo) => ({ kind: 'ack' as const, wo, at: wo.milestones.find((m) => m.key === 'report')?.actual ?? wo.due })),
    ...[...data.open]
      .sort((a, b) => Number(b.needsCustomer) - Number(a.needsCustomer) || SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
      .map((x) => ({ kind: 'exception' as const, x, wo: idx.get(x.workOrderId)!, at: x.raisedOn })),
  ]
  return (
    <Card index={7} tour="overview.attention" lens="C" title="Needs attention" className="h-full" bodyClassName="px-2 pb-2" actions={<span className="text-[13px] font-medium text-text-2 tabular">{items.length}</span>}>
      {items.length === 0 ? (
        <div className="grid h-40 place-items-center text-center text-[14px] text-text-2">
          <div>
            <CircleCheck className="mx-auto mb-2 size-6 text-verified" strokeWidth={1.5} />
            Nothing is waiting on you.
          </div>
        </div>
      ) : (
        <ul className="flex max-h-[360px] flex-col overflow-y-auto">
          {items.map((it) => {
            const isAck = it.kind === 'ack'
            return (
              <li key={isAck ? `ack-${it.wo.id}` : it.x.id}>
                <Link to={`/operations/${it.wo.id}`} className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 transition-colors hover:bg-surface-3 active:bg-bg-1">
                  <span className={cx('grid size-8 shrink-0 place-items-center rounded-full', isAck ? 'bg-cyan-soft text-cyan' : it.x.severity === 'high' ? 'bg-critical-soft text-critical' : 'bg-amber-soft text-amber')}>
                    {isAck ? <UserCheck className="size-4" /> : <TriangleAlert className="size-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium text-text-1">{isAck ? 'Acknowledge completed service' : it.x.title}</span>
                    <span className="block truncate text-[12.5px] text-text-2">
                      {it.wo.id} · {it.wo.title}
                    </span>
                  </span>
                  <span className="shrink-0 text-[12px] text-text-3">{fmtRelative(it.at)}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

/* ───────────── Proof Chain ───────────── */

const STAGES: { key: keyof Funnel; label: string; color: string }[] = [
  { key: 'captured', label: 'Captured', color: '#8794A1' },
  { key: 'submitted', label: 'Submitted', color: '#127C91' },
  { key: 'verified', label: 'Verified', color: '#1A8A55' },
  { key: 'acknowledged', label: 'Acknowledged', color: '#1A8A55' },
]

export function ProofFunnel({ funnel }: { funnel: Funnel }) {
  const max = Math.max(funnel.captured, 1)
  return (
    <Card
      index={8}
      tour="overview.proof"
      lens="C"
      title="Proof Chain this period"
      className="h-full"
      bodyClassName="flex flex-1 flex-col px-5 pt-2 pb-6"
      actions={
        <Link to="/evidence" className="inline-flex items-center gap-1 text-[13px] font-medium text-cyan hover:underline">
          Evidence <ArrowUpRight className="size-3.5" />
        </Link>
      }
    >
      <ul className="flex flex-col gap-5">
        {STAGES.map((s) => {
          const v = funnel[s.key] as number
          return (
            <li key={s.key} className="grid grid-cols-[120px_1fr_44px] items-center gap-3">
              <span className="text-[14px] font-medium text-text-1">{s.label}</span>
              <span className="h-2 overflow-hidden rounded-full bg-bg-1">
                <Grow pct={(v / max) * 100} color={s.color} delay={0.3 + STAGES.indexOf(s) * 0.1} />
              </span>
              <span className="text-right text-[15px] font-semibold text-text-1 tabular">{v}</span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
