import { motion } from 'motion/react'
import { Link } from 'react-router'
import { Sparkline } from '@/charts/Sparkline'
import { cx } from '@/lib/cx'
import { fmtInt } from '@/lib/format'
import { rise } from '@/motion/tokens'
import { CountUp } from '@/motion/useCountUp'
import { LENS_LABEL } from '@/ui/Card'
import { Delta } from '@/ui/Delta'
import { ACTIVE_STATUS_ORDER, STATUS_META, toneDot } from '@/ui/Status'
import { Tooltip } from '@/ui/Tooltip'
import type { OverviewData } from './useOverview'

interface Tile {
  tour: string
  label: string
  definition: string
  to: string
  value: React.ReactNode
  caption: React.ReactNode
  footer?: React.ReactNode
}

const pct = (n: number) => `${n.toFixed(1)}%`

export function KpiStrip({ data }: { data: OverviewData }) {
  const ratioTile = (r: OverviewData['otd'], color: string) => ({
    value: r.ratio.pct == null ? '—' : <CountUp value={r.ratio.pct} format={pct} />,
    footer: (
      <>
        <Delta value={r.delta} />
        <Sparkline values={r.spark} color={color} width={84} />
      </>
    ),
  })
  const tiles: Tile[] = [
    {
      tour: 'kpi.active',
      label: 'Active operations',
      definition: 'Work orders mobilizing, in progress, awaiting evidence, awaiting your sign-off, or on hold.',
      to: '/operations',
      value: <CountUp value={data.active.length} format={(n) => fmtInt(Math.round(n))} />,
      caption: `across ${data.regionsActive} regions`,
      footer: (
        <div className="flex h-1.5 w-full gap-[2px] overflow-hidden rounded-full">
          {ACTIVE_STATUS_ORDER.map((s) => {
            const n = data.active.filter((a) => a.status === s).length
            return n ? <span key={s} title={`${STATUS_META[s].label}: ${n}`} className={cx('h-full', toneDot[STATUS_META[s].tone])} style={{ flexGrow: n }} /> : null
          })}
        </div>
      ),
    },
    {
      tour: 'kpi.otd',
      label: 'On-time delivery',
      definition: 'Milestones completed in the period on or before their planned date.',
      to: '/performance',
      caption: `${fmtInt(data.otd.ratio.num)} of ${fmtInt(data.otd.ratio.den)} milestones`,
      ...ratioTile(data.otd, '#127C91'),
    },
    {
      tour: 'kpi.sla',
      label: 'Operational performance',
      definition: 'Service-level attainment: orders acknowledged complete in the period by their contracted due date.',
      to: '/performance',
      caption: `${data.sla.ratio.num} of ${data.sla.ratio.den} closed within SLA`,
      ...ratioTile(data.sla, '#5B6B7B'),
    },
    {
      tour: 'kpi.evidence',
      label: 'Evidence verified',
      definition: 'Evidence checked against its source within 48 hours of upload. Uploaded is not the same as verified.',
      to: '/evidence',
      caption: 'within 48 h of upload',
      ...ratioTile(data.evidence, '#1A8A55'),
    },
    {
      tour: 'kpi.exceptions',
      label: 'Open exceptions',
      definition: 'Deviations from plan that are not yet resolved.',
      to: '/operations',
      value: <span className={data.open.length ? 'text-amber' : ''}>{data.open.length}</span>,
      caption: `${data.open.filter((x) => x.needsCustomer).length} need your decision`,
    },
  ]

  return (
    <section aria-label="Key performance indicators" data-tour="kpi.strip" data-lens="C" data-lens-label={LENS_LABEL.C} className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {tiles.map((t, i) => (
        <motion.div key={t.tour} variants={rise} initial="hidden" animate="show" custom={i} data-tour={t.tour} className={cx('surface-card', i === 4 && 'col-span-2 md:col-span-1')}>
          <Link to={t.to} className="flex h-full flex-col gap-1 rounded-[inherit] p-5 transition-colors hover:bg-surface-3/60 active:scale-[.99]">
            <Tooltip content={t.definition}>
              <span className="eyebrow self-start">{t.label}</span>
            </Tooltip>
            <div className="type-display mt-1 text-[32px] leading-none text-text-1 tabular">{t.value}</div>
            <div className="text-[13px] text-text-2 tabular">{t.caption}</div>
            {t.footer && <div className="mt-auto flex items-end justify-between gap-2 pt-4">{t.footer}</div>}
          </Link>
        </motion.div>
      ))}
    </section>
  )
}
