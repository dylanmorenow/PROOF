import { useMemo } from 'react'
import { useApp } from '@/app/store'
import { lastMonths } from '@/data/dates'
import {
  activeWorkOrders,
  evidenceVerification,
  monthlySeries,
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
  type Ratio,
  type Window,
} from '@/data/selectors'

/** Everything the Overview shows, derived once per (dataset, account, period). */
export function useOverview() {
  const dataset = useApp((s) => s.dataset)
  const account = useApp((s) => s.account)
  const period = useApp((s) => s.period)

  return useMemo(() => {
    const orders = scopeWorkOrders(dataset, account)
    const records = scopeEvidence(dataset, account)
    const w = periodWindow(period)
    const prev = previousWindow(period)
    const months = lastMonths(8)
    const kpi = (fn: (w: Window) => Ratio) => {
      const ratio = fn(w)
      const before = prev ? fn(prev).pct : null
      return { ratio, delta: ratio.pct != null && before != null ? ratio.pct - before : null, spark: monthlySeries(months, fn).map((p) => p.value) }
    }
    const active = activeWorkOrders(dataset, account)
    const open = openExceptions(scopeExceptions(dataset, account))

    return {
      account,
      active,
      open,
      pendingAck: pendingAcknowledgment(active),
      regionsActive: new Set(active.map((a) => a.regionId)).size,
      otd: kpi((x) => onTimeDelivery(orders, x)),
      sla: kpi((x) => slaAttainment(orders, x)),
      evidence: kpi((x) => evidenceVerification(records, x)),
      regions: regionSummaries(dataset, account, period),
      funnel: proofFunnel(records, w),
    }
  }, [dataset, account, period])
}

export type OverviewData = ReturnType<typeof useOverview>
