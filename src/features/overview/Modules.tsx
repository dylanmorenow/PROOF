import { ArrowUpRight, CircleCheck, Clock, FileUp, Flag, RotateCcw, ShieldCheck, TriangleAlert, UserCheck } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router'
import { useApp } from '@/app/store'
import type { ActivityKind, ProofFunnel as Funnel } from '@/data/selectors'
import type { ServiceException, WorkOrder } from '@/data/types'
import { cx } from '@/lib/cx'
import { fmtRelative, fmtTime, fmtDate } from '@/lib/format'
import { Card } from '@/ui/Card'
import type { OverviewData } from './useOverview'

/* ───────────── Needs attention ───────────── */

type AttentionItem =
  | { kind: 'ack'; wo: WorkOrder; at: string }
  | { kind: 'exception'; x: ServiceException; wo: WorkOrder; at: string }

const SEVERITY_RANK = { high: 0, medium: 1, low: 2 }

export function NeedsAttention({ data }: { data: OverviewData }) {
  const dataset = useApp((s) => s.dataset)
  const sites = new Map(dataset.sites.map((s) => [s.id, s]))
  const idx = new Map(dataset.workOrders.map((w) => [w.id, w]))
  const items: AttentionItem[] = [
    ...data.pendingAck.map((wo) => ({ kind: 'ack' as const, wo, at: wo.milestones.find((m) => m.key === 'report')?.actual ?? wo.due })),
    ...[...data.open]
      .sort((a, b) => Number(b.needsCustomer) - Number(a.needsCustomer) || SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
      .map((x) => ({ kind: 'exception' as const, x, wo: idx.get(x.workOrderId)!, at: x.raisedOn })),
  ]
  return (
    <Card
      index={8}
      tour="overview.attention"
      lens="C"
      eyebrow="Your decisions"
      title="Needs attention"
      className="h-full"
      bodyClassName="px-2 pb-2"
      actions={<span className="rounded-full bg-amber-soft px-2 py-0.5 text-[11.5px] font-semibold text-amber tabular">{items.length}</span>}
    >
      {items.length === 0 ? (
        <div className="grid h-40 place-items-center text-center text-[13px] text-text-2">
          <div>
            <CircleCheck className="mx-auto mb-2 size-6 text-verified" strokeWidth={1.5} />
            Nothing is waiting on you.
          </div>
        </div>
      ) : (
        <ul className="flex max-h-[340px] flex-col overflow-y-auto pr-1">
          {items.map((it, i) => {
            const site = sites.get(it.wo.siteId)!
            const isAck = it.kind === 'ack'
            return (
              <motion.li key={isAck ? `ack-${it.wo.id}` : it.x.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.04 }}>
                <Link to={`/operations/${it.wo.id}`} className="group flex gap-3 rounded-[8px] px-3 py-2.5 transition-colors hover:bg-[rgb(142_164_181/.07)]">
                  <span
                    className={cx(
                      'mt-0.5 grid size-7 shrink-0 place-items-center rounded-[7px] border',
                      isAck ? 'border-[rgb(118_207_218/.3)] bg-cyan-soft text-cyan' : it.x.severity === 'high' ? 'border-[rgb(229_72_77/.35)] bg-critical-soft text-[#f2777b]' : 'border-[rgb(233_162_59/.3)] bg-amber-soft text-amber',
                    )}
                  >
                    {isAck ? <UserCheck className="size-3.5" /> : <TriangleAlert className="size-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-text-1">{isAck ? 'Acknowledge completed service' : it.x.title}</span>
                    <span className="mt-0.5 block truncate text-[11.5px] text-text-2">
                      <span className="font-mono text-text-3">{it.wo.id}</span> · {isAck ? it.wo.title : site.name}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-[11px] text-text-3">{fmtRelative(it.at)}</span>
                    {(isAck || it.x.needsCustomer) && <span className="rounded-full border border-[rgb(233_162_59/.3)] px-1.5 text-[10px] font-medium text-amber">You</span>}
                  </span>
                </Link>
              </motion.li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

/* ───────────── Proof Chain funnel ───────────── */

const STAGES: { key: keyof Funnel; label: string; caption: string; color: string }[] = [
  { key: 'captured', label: 'Captured', caption: 'Recorded in the field', color: '#8EA4B5' },
  { key: 'submitted', label: 'Submitted', caption: 'Uploaded to PROOF Room', color: '#76CFDA' },
  { key: 'verified', label: 'Verified', caption: 'Checked against source', color: '#4FBF8B' },
  { key: 'acknowledged', label: 'Acknowledged', caption: 'Accepted by customer', color: '#4FBF8B' },
]

export function ProofFunnel({ funnel, stats }: { funnel: Funnel; stats: { awaiting: number; medianHours: number | null; recaptureRate: number | null } }) {
  const max = Math.max(funnel.captured, 1)
  return (
    <Card
      index={9}
      tour="overview.proof"
      lens="C"
      eyebrow="Evidence"
      title="Proof Chain this period"
      className="h-full"
      bodyClassName="flex flex-1 flex-col px-5 pb-5"
      actions={
        <Link to="/evidence" className="inline-flex items-center gap-1 text-[12.5px] font-medium text-cyan hover:underline">
          Evidence Center <ArrowUpRight className="size-3.5" />
        </Link>
      }
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-0">
        {STAGES.map((s, i) => {
          const v = funnel[s.key] as number
          const prev = i > 0 ? (funnel[STAGES[i - 1].key] as number) : null
          return (
            <div key={s.key} className="relative md:pr-5">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 10 10" aria-hidden="true">
                  <path d="M5 0.8 8.6 2.9v4.2L5 9.2 1.4 7.1V2.9Z" fill={i === 3 ? s.color : `${s.color}33`} stroke={s.color} strokeWidth="1" />
                </svg>
                <span className="text-[12.5px] font-medium text-text-1">{s.label}</span>
                {prev != null && (
                  <span className="ml-auto text-[11px] text-text-3 tabular md:hidden">{prev ? Math.round((v / prev) * 100) : 0}%</span>
                )}
              </div>
              <div className="type-display mt-2 text-[26px] font-[600] text-text-1 tabular">{v}</div>
              <div className="text-[11.5px] text-text-2">{s.caption}</div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[rgb(142_164_181/.1)]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: s.color, opacity: i === 2 ? 0.7 : 1 }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(v / max) * 100}%` }}
                  transition={{ duration: 0.9, delay: 0.4 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              {prev != null && (
                <span className="absolute top-0 -left-3 hidden -translate-x-1/2 rounded-full border border-line bg-bg-1 px-1.5 text-[10.5px] text-text-2 tabular md:inline">
                  {prev ? Math.round((v / prev) * 100) : 0}%
                </span>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-[10px] border border-line bg-line">
        <FunnelStat label="Awaiting verification now" value={String(stats.awaiting)} tone={stats.awaiting ? 'text-cyan' : undefined} />
        <FunnelStat label="Median time to verify" value={stats.medianHours == null ? '—' : `${stats.medianHours.toFixed(1)} h`} />
        <FunnelStat label="Returned for re-capture" value={stats.recaptureRate == null ? '—' : `${stats.recaptureRate.toFixed(1)}%`} />
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-5 text-[12px] text-text-2">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-verified" />
          Uploaded is not verified: each record is checked against site, timestamp, signatory and file integrity.
        </span>
        {funnel.recapture > 0 && (
          <span className="inline-flex items-center gap-1.5 text-amber">
            <RotateCcw className="size-3.5" />
            {funnel.recapture} returned for re-capture
          </span>
        )}
      </div>
    </Card>
  )
}

function FunnelStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="bg-bg-1/60 px-4 py-3">
      <div className={cx('type-display text-[20px] font-[600] tabular', tone ?? 'text-text-1')}>{value}</div>
      <div className="mt-0.5 text-[11.5px] text-text-2">{label}</div>
    </div>
  )
}

/* ───────────── Activity feed ───────────── */

const KIND: Record<ActivityKind, { icon: typeof Clock; tone: string }> = {
  milestone: { icon: Flag, tone: 'text-cyan' },
  uploaded: { icon: FileUp, tone: 'text-text-2' },
  verified: { icon: ShieldCheck, tone: 'text-verified' },
  acknowledged: { icon: UserCheck, tone: 'text-verified' },
  rejected: { icon: RotateCcw, tone: 'text-amber' },
  exception: { icon: TriangleAlert, tone: 'text-amber' },
  resolved: { icon: CircleCheck, tone: 'text-text-2' },
}

export function ActivityFeed({ data }: { data: OverviewData }) {
  return (
    <Card index={10} tour="overview.activity" eyebrow="Live record" title="Recent activity" className="h-full" bodyClassName="px-5 pb-4">
      <ol className="relative">
        <span className="absolute top-2 bottom-2 left-[13px] w-px bg-line" aria-hidden="true" />
        {data.feed.map((e, i) => {
          const K = KIND[e.kind]
          return (
            <motion.li key={e.id} className="relative flex gap-3 py-2" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.035 }}>
              <span className={cx('relative z-10 mt-0.5 grid size-[27px] shrink-0 place-items-center rounded-full border border-line bg-surface-1', K.tone)}>
                <K.icon className="size-3.5" strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[12.5px] font-medium text-text-1">{e.title}</span>
                  <span className="shrink-0 text-[11px] text-text-3 tabular" title={`${fmtDate(e.at)} ${fmtTime(e.at)}`}>
                    {fmtRelative(e.at)}
                  </span>
                </span>
                <span className="block truncate text-[11.5px] text-text-2">
                  {e.workOrderId && <span className="font-mono text-text-3">{e.workOrderId} · </span>}
                  {e.detail}
                </span>
              </span>
            </motion.li>
          )
        })}
      </ol>
    </Card>
  )
}
