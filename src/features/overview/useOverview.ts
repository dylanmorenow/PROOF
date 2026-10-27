import { useMemo } from 'react'
import { useApp } from '@/app/store'
import { lastMonths } from '@/data/dates'
import {
  activeCountAt,
  activeWorkOrders,
  activityFeed,
  evidenceVerification,
  monthlySeries,
  monthWindow,
  onTimeDelivery,
  openExceptions,
  pendingAcknowledgment,
  periodWindow,
  previousWindow,
  proofFunnel,
  regionSummaries,
  scopeEvidence,
  scopeExceptions,
  scopeWorkOrders,
  slaAttainment,
  trendMonths,
  verificationStats,
} from '@/data/selectors'

/** Everything the Overview shows, derived once per (dataset, account, period). */
export function useOverview() {
  const dataset = useApp((s) => s.dataset)
  const account = useApp((s) => s.account)
  const period = useApp((s) => s.period)

  return useMemo(() => {
    const orders = scopeWorkOrders(dataset, account)
    const records = scopeEvidence(dataset, account)
    const exceptions = scopeExceptions(dataset, account)
    const w = periodWindow(period)
    const prev = previousWindow(period)
    const spark = lastMonths(8)

    const otd = onTimeDelivery(orders, w)
    const sla = slaAttainment(orders, w)
    const ev = evidenceVerification(records, w)
    const delta = (cur: number | null, fn: () => number | null) => (prev && cur != null ? (fn() == null ? null : cur - fn()!) : null)

    const active = activeWorkOrders(dataset, account)
    const open = openExceptions(exceptions)
    const raisedIn = (win: { from: string; to: string }) => exceptions.filter((x) => x.raisedOn >= win.from && x.raisedOn <= win.to).length

    return {
      account,
      period,
      active,
      open,
      pendingAck: pendingAcknowledgment(active),
      regionsActive: new Set(active.map((a) => a.regionId)).size,
      kpis: {
        active: {
          value: active.length,
          spark: spark.map((m) => activeCountAt(orders, monthWindow(m).to)),
          byStatus: active.reduce<Record<string, number>>((acc, a) => ((acc[a.status] = (acc[a.status] ?? 0) + 1), acc), {}),
        },
        otd: { ratio: otd, delta: delta(otd.pct, () => onTimeDelivery(orders, prev!).pct), spark: monthlySeries(spark, (m) => onTimeDelivery(orders, m)).map((p) => p.value) },
        sla: { ratio: sla, delta: delta(sla.pct, () => slaAttainment(orders, prev!).pct), spark: monthlySeries(spark, (m) => slaAttainment(orders, m)).map((p) => p.value) },
        evidence: { ratio: ev, delta: delta(ev.pct, () => evidenceVerification(records, prev!).pct), spark: monthlySeries(spark, (m) => evidenceVerification(records, m)).map((p) => p.value) },
        exceptions: {
          value: open.length,
          needsCustomer: open.filter((x) => x.needsCustomer).length,
          raised: raisedIn(w),
          raisedPrev: prev ? raisedIn(prev) : null,
          spark: spark.map((m) => raisedIn(monthWindow(m))),
        },
      },
      trend: {
        months: trendMonths(period),
        otd: monthlySeries(trendMonths(period), (m) => onTimeDelivery(orders, m)),
        sla: monthlySeries(trendMonths(period), (m) => slaAttainment(orders, m)),
      },
      regions: regionSummaries(dataset, account, period),
      funnel: proofFunnel(records, w),
      verifyStats: verificationStats(records, w),
      feed: activityFeed(dataset, account, 6),
    }
  }, [dataset, account, period])
}

export type OverviewData = ReturnType<typeof useOverview>
