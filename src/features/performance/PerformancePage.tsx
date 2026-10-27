import * as Dialog from '@radix-ui/react-dialog'
import { Printer, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useApp } from '@/app/store'
import { TrendChart } from '@/charts/TrendChart'
import { DEMO_TODAY } from '@/data/dates'
import {
  evidenceVerification,
  monthlySeries,
  onTimeDelivery,
  periodWindow,
  PERIODS,
  previousWindow,
  regionSummaries,
  scopeEvidence,
  scopeExceptions,
  scopeWorkOrders,
  slaAttainment,
  trendMonths,
  type Ratio,
  type Window,
} from '@/data/selectors'
import type { ExceptionCategory } from '@/data/types'
import { fmtDate, fmtPct } from '@/lib/format'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { Delta } from '@/ui/Delta'
import { Grow } from '@/ui/Grow'
import { CountUp } from '@/motion/useCountUp'

export function PerformancePage() {
  const dataset = useApp((s) => s.dataset)
  const account = useApp((s) => s.account)
  const period = useApp((s) => s.period)
  const [reportOpen, setReportOpen] = useState(false)

  const data = useMemo(() => {
    const orders = scopeWorkOrders(dataset, account)
    const records = scopeEvidence(dataset, account)
    const w = periodWindow(period)
    const prev = previousWindow(period)
    const kpi = (label: string, fn: (w: Window) => Ratio) => {
      const now = fn(w)
      const before = prev ? fn(prev) : null
      return { label, now, before, delta: now.pct != null && before?.pct != null ? now.pct - before.pct : null }
    }
    const raised = scopeExceptions(dataset, account).filter((x) => x.raisedOn >= w.from && x.raisedOn <= w.to)
    const categories = Object.entries(
      raised.reduce<Record<string, number>>((acc, x) => ((acc[x.category] = (acc[x.category] ?? 0) + 1), acc), {}),
    ).sort((a, b) => b[1] - a[1]) as [ExceptionCategory, number][]
    const months = trendMonths(period)
    return {
      kpis: [kpi('On-time delivery', (x) => onTimeDelivery(orders, x)), kpi('Operational performance', (x) => slaAttainment(orders, x)), kpi('Evidence verified', (x) => evidenceVerification(records, x))],
      otd: monthlySeries(months, (x) => onTimeDelivery(orders, x)),
      sla: monthlySeries(months, (x) => slaAttainment(orders, x)),
      regions: regionSummaries(dataset, account, period),
      categories,
      raisedTotal: raised.length,
      hasPrev: !!prev,
    }
  }, [dataset, account, period])

  const periodLabel = PERIODS.find((p) => p.id === period)!.long
  const accountName = account === 'all' ? 'All accounts' : dataset.customers.find((c) => c.id === account)!.name
  const regionName = (id: string) => dataset.regions.find((r) => r.id === id)!.name
  const maxCat = Math.max(1, ...data.categories.map((c) => c[1]))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="type-display text-[32px] leading-tight">Performance</h1>
        <Button data-tour="perf.export" onClick={() => setReportOpen(true)}>
          <Printer /> Export report
        </Button>
      </div>

      <section data-tour="perf.kpis" data-lens="C" className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {data.kpis.map((k) => (
          <div key={k.label} className="surface-card p-5">
            <div className="eyebrow">{k.label}</div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="type-display text-[32px] leading-none tabular">{k.now.pct == null ? 'n/a' : <CountUp value={k.now.pct} format={(n) => `${n.toFixed(1)}%`} />}</span>
              <Delta value={k.delta} />
            </div>
            {k.before && <div className="mt-2 text-[13px] text-text-2 tabular">{fmtPct(k.before.pct)} previous period</div>}
          </div>
        ))}
      </section>

      <Card
        index={1}
        tour="perf.trend"
        lens="C"
        title="Monthly trend"
        actions={
          <div className="flex items-center gap-4 text-[12.5px] text-text-2">
            <Legend color="#127C91" label="On-time delivery" />
            <Legend color="#8794A1" label="SLA" />
          </div>
        }
      >
        <TrendChart
          height={260}
          series={[
            { id: 'otd', label: 'On-time delivery', color: '#127C91', points: data.otd, area: true },
            { id: 'sla', label: 'SLA', color: '#8794A1', points: data.sla },
          ]}
          target={{ value: 90, label: 'Target 90%' }}
        />
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card index={2} tour="perf.regions" lens="B" title="By region" className="xl:col-span-7" bodyClassName="overflow-x-auto px-0 pb-2">
          <table className="w-full min-w-[480px] text-left text-[14px]">
            <thead>
              <tr className="text-[12.5px] text-text-2">
                {['Region', 'Active', 'On-time delivery', 'Evidence verified', 'Exceptions'].map((h) => (
                  <th key={h} className="px-5 py-2 font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.regions.map((r) => (
                <tr key={r.regionId} className="border-t border-line">
                  <td className="px-5 py-3 font-medium">{regionName(r.regionId)}</td>
                  <td className="px-5 tabular">{r.active}</td>
                  <td className="px-5">
                    <Bar pct={r.otd.pct} />
                  </td>
                  <td className="px-5">
                    <Bar pct={r.evidence.pct} color="bg-verified" />
                  </td>
                  <td className={`px-5 tabular ${r.openExceptions ? 'text-amber' : ''}`}>{r.openExceptions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card index={3} tour="perf.exceptions" title="Exceptions raised" className="xl:col-span-5" actions={<span className="text-[13px] text-text-2 tabular">{data.raisedTotal}</span>}>
          {data.categories.length === 0 ? (
            <p className="py-10 text-center text-[14px] text-text-2">None this period</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {data.categories.map(([cat, n]) => (
                <li key={cat} className="grid grid-cols-[150px_1fr_28px] items-center gap-3 text-[14px]">
                  <span>{cat}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-bg-1">
                    <Grow pct={(n / maxCat) * 100} className="block h-full rounded-full bg-amber/80" />
                  </span>
                  <span className="text-right font-semibold tabular">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Dialog.Root open={reportOpen} onOpenChange={setReportOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/25 backdrop-blur-[2px] print:hidden" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-[71] flex max-h-[90dvh] w-[min(760px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[20px] bg-bg-1 shadow-[var(--shadow-raised)] outline-none print:static print:max-h-none print:w-full print:translate-x-0 print:translate-y-0 print:rounded-none print:shadow-none">
            <div className="flex items-center justify-between px-6 py-4 print:hidden">
              <Dialog.Title className="text-[17px] font-semibold">Performance report</Dialog.Title>
              <div className="flex items-center gap-2">
                <Button variant="primary" size="sm" onClick={() => window.print()}>
                  <Printer /> Print or save PDF
                </Button>
                <Dialog.Close className="grid size-8 place-items-center rounded-full text-text-2 hover:bg-black/5" aria-label="Close">
                  <X className="size-4" />
                </Dialog.Close>
              </div>
            </div>
            <div className="overflow-y-auto px-6 pb-6 print:overflow-visible print:p-0">
              <article className="print-area mx-auto rounded-[8px] bg-white p-10 shadow-[var(--shadow-card)] print:shadow-none">
                <div className="text-[13px] font-medium text-cyan">PROOF Room</div>
                <h2 className="type-display mt-1 text-[26px]">Service performance report</h2>
                <p className="mt-1 text-[14px] text-text-2">
                  {accountName}, {periodLabel.toLowerCase()} to {fmtDate(DEMO_TODAY)}
                </p>
                <div className="mt-8 grid grid-cols-3 gap-6">
                  {data.kpis.map((k) => (
                    <div key={k.label}>
                      <div className="text-[12.5px] text-text-2">{k.label}</div>
                      <div className="type-display mt-1 text-[26px] tabular">{fmtPct(k.now.pct)}</div>
                      <div className="text-[12.5px] text-text-2 tabular">
                        {k.now.num} of {k.now.den}
                      </div>
                    </div>
                  ))}
                </div>
                <table className="mt-8 w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-line text-text-2">
                      <th className="py-2 font-medium">Region</th>
                      <th className="py-2 font-medium">Active</th>
                      <th className="py-2 font-medium">On time</th>
                      <th className="py-2 font-medium">Verified</th>
                      <th className="py-2 font-medium">Exceptions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.regions.map((r) => (
                      <tr key={r.regionId} className="border-b border-line">
                        <td className="py-2">{regionName(r.regionId)}</td>
                        <td className="py-2 tabular">{r.active}</td>
                        <td className="py-2 tabular">{fmtPct(r.otd.pct)}</td>
                        <td className="py-2 tabular">{fmtPct(r.evidence.pct)}</td>
                        <td className="py-2 tabular">{r.openExceptions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-8 text-[11.5px] text-text-3">Prototype report with fictional demonstration data</p>
              </article>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}

function Bar({ pct, color = 'bg-teal' }: { pct: number | null; color?: string }) {
  return (
    <span className="flex items-center gap-3">
      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-bg-1">
        <Grow pct={pct ?? 0} className={`block h-full rounded-full ${color}`} />
      </span>
      <span className="tabular">{fmtPct(pct)}</span>
    </span>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-0.5 w-3.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}
