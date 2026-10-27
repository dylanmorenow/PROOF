import { motion } from 'motion/react'
import { Link } from 'react-router'
import { Sparkline } from '@/charts/Sparkline'
import type { ActiveStatus } from '@/data/types'
import { cx } from '@/lib/cx'
import { fmtInt } from '@/lib/format'
import { CountUp } from '@/motion/useCountUp'
import { rise } from '@/motion/tokens'
import { LENS_LABEL } from '@/ui/Card'
import { Delta } from '@/ui/Delta'
import { ACTIVE_STATUS_ORDER, STATUS_META, toneDot } from '@/ui/Status'
import { Tooltip } from '@/ui/Tooltip'
import type { OverviewData } from './useOverview'

function Cell({
  tour,
  label,
  definition,
  children,
  to,
  index,
  className,
}: {
  className?: string
  tour: string
  label: string
  definition: string
  children: React.ReactNode
  to: string
  index: number
}) {
  return (
    <motion.div variants={rise} initial="hidden" animate="show" custom={index} data-tour={tour} className={cx('group relative bg-surface-1', className)}>
      <Link to={to} className="flex h-full flex-col gap-3 p-5 outline-none transition-colors duration-200 hover:bg-[rgb(22_48_73/.55)] focus-visible:bg-[rgb(22_48_73/.55)]">
        <Tooltip content={definition}>
          <span className="eyebrow self-start truncate !text-[10.5px] !tracking-[.05em] decoration-text-3/60 decoration-dotted underline-offset-4 hover:underline">{label}</span>
        </Tooltip>
        {children}
      </Link>
      <span className="pointer-events-none absolute inset-x-5 bottom-0 h-px origin-left scale-x-0 bg-cyan/70 transition-transform duration-300 group-hover:scale-x-100" />
    </motion.div>
  )
}

const SHORT: Partial<Record<ActiveStatus, string>> = { 'in-progress': 'in progress', 'awaiting-evidence': 'evidence due', 'pending-ack': 'sign-off', 'on-hold': 'on hold' }

const Value = ({ children }: { children: React.ReactNode }) => <div className="type-display text-[34px] leading-none font-[600] text-text-1 tabular">{children}</div>

export function KpiStrip({ data }: { data: OverviewData }) {
  const { kpis, regionsActive } = data
  const pct = (n: number) => `${n.toFixed(1)}%`
  const total = kpis.active.value || 1
  return (
    <section
      aria-label="Key performance indicators"
      data-tour="kpi.strip"
      data-lens="C"
      data-lens-label={LENS_LABEL.C}
      className="surface-card grid grid-cols-1 gap-px overflow-hidden !bg-line sm:grid-cols-2 lg:grid-cols-6 xl:grid-cols-5"
    >
      <Cell tour="kpi.active" label="Active operations" definition="Work orders currently mobilizing, in progress, awaiting evidence, awaiting your acknowledgment or on hold." to="/operations" index={0} className="lg:col-span-3 xl:col-span-1">
        <Value>
          <CountUp value={kpis.active.value} format={(n) => fmtInt(Math.round(n))} />
        </Value>
        <div className="text-[12.5px] text-text-2">across {regionsActive} candidate regions</div>
        <div className="mt-auto">
          <div className="flex h-1.5 gap-[2px] overflow-hidden rounded-full">
            {ACTIVE_STATUS_ORDER.map((s, i) =>
              kpis.active.byStatus[s] ? (
                <motion.span
                  key={s}
                  className={cx('h-full rounded-[1px]', toneDot[STATUS_META[s].tone])}
                  initial={{ flexGrow: 0 }}
                  animate={{ flexGrow: kpis.active.byStatus[s] / total }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  title={`${STATUS_META[s].label}: ${kpis.active.byStatus[s]}`}
                />
              ) : null,
            )}
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-text-2 tabular">
            {(['in-progress', 'awaiting-evidence', 'pending-ack', 'on-hold'] as ActiveStatus[]).map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span className={cx('size-1.5 shrink-0 rounded-full', toneDot[STATUS_META[s].tone])} />
                <span className="text-text-1">{kpis.active.byStatus[s] ?? 0}</span> {SHORT[s]}
              </span>
            ))}
          </div>
        </div>
      </Cell>

      <Cell tour="kpi.otd" label="On-time delivery" definition="Milestones completed in the period on or before their planned date." to="/performance" index={1} className="lg:col-span-3 xl:col-span-1">
        <Value>{kpis.otd.ratio.pct == null ? '—' : <CountUp value={kpis.otd.ratio.pct} format={pct} delay={0.05} />}</Value>
        <div className="text-[12.5px] text-text-2 tabular">
          {fmtInt(kpis.otd.ratio.num)} of {fmtInt(kpis.otd.ratio.den)} milestones on plan
        </div>
        <div className="mt-auto flex items-end justify-between gap-2">
          <Delta value={kpis.otd.delta} />
          <Sparkline values={kpis.otd.spark} delay={0.4} />
        </div>
      </Cell>

      <Cell tour="kpi.sla" label="Operational performance" definition="Service-level attainment: work orders acknowledged complete in the period by their contracted due date." to="/performance" index={2} className="lg:col-span-2 xl:col-span-1">
        <Value>{kpis.sla.ratio.pct == null ? '—' : <CountUp value={kpis.sla.ratio.pct} format={pct} delay={0.1} />}</Value>
        <div className="text-[12.5px] text-text-2 tabular">
          {fmtInt(kpis.sla.ratio.num)} of {fmtInt(kpis.sla.ratio.den)} closed within SLA
        </div>
        <div className="mt-auto flex items-end justify-between gap-2">
          <Delta value={kpis.sla.delta} />
          <Sparkline values={kpis.sla.spark} delay={0.5} color="#A9C2D3" />
        </div>
      </Cell>

      <Cell tour="kpi.evidence" label="Evidence verification" definition="Evidence records verified against source within 48 hours of upload. Uploaded is not the same as verified." to="/evidence" index={3} className="lg:col-span-2 xl:col-span-1">
        <Value>{kpis.evidence.ratio.pct == null ? '—' : <CountUp value={kpis.evidence.ratio.pct} format={pct} delay={0.15} />}</Value>
        <div className="text-[12.5px] text-text-2 tabular">of {fmtInt(kpis.evidence.ratio.den)} uploads verified ≤ 48 h</div>
        <div className="mt-auto flex items-end justify-between gap-2">
          <Delta value={kpis.evidence.delta} />
          <Sparkline values={kpis.evidence.spark} delay={0.6} color="#4FBF8B" />
        </div>
      </Cell>

      <Cell tour="kpi.exceptions" label="Open exceptions" definition="Deviations from plan that are not yet resolved: access, weather, parts, evidence quality, scope or safety." to="/operations" index={4} className="sm:col-span-2 lg:col-span-2 xl:col-span-1">
        <Value>
          <span className={kpis.exceptions.value ? 'text-amber' : ''}>
            <CountUp value={kpis.exceptions.value} format={(n) => fmtInt(Math.round(n))} delay={0.2} />
          </span>
        </Value>
        <div className="text-[12.5px] text-text-2">
          <span className="text-text-1">{kpis.exceptions.needsCustomer}</span> need your decision
        </div>
        <div className="mt-auto flex items-end justify-between gap-2">
          <span className="text-[11.5px] whitespace-nowrap text-text-2 tabular">
            {kpis.exceptions.raised} raised{kpis.exceptions.raisedPrev != null && <span className="text-text-3"> / {kpis.exceptions.raisedPrev} prior</span>}
          </span>
          <Sparkline values={kpis.exceptions.spark} delay={0.7} color="#E9A23B" width={72} />
        </div>
      </Cell>
    </section>
  )
}

