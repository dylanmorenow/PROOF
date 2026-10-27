// Pure selectors: every KPI in the UI is computed here from the dataset — never typed into a component.
import { addDays, DEMO_NOW, DEMO_TODAY, lastMonths, monthEnd } from './dates'
import type {
  AccountScope,
  ActiveStatus,
  Dataset,
  EvidenceRecord,
  ISODate,
  OutcomeContract,
  PeriodId,
  ProofStage,
  RegionId,
  ServiceException,
  WorkOrder,
} from './types'

export const ACTIVE_STATUSES: ActiveStatus[] = ['mobilizing', 'in-progress', 'awaiting-evidence', 'pending-ack', 'on-hold']

export const isActive = (wo: WorkOrder) => (ACTIVE_STATUSES as string[]).includes(wo.status)

export interface Window {
  from: ISODate
  to: ISODate
}

export const PERIODS: { id: PeriodId; label: string; long: string }[] = [
  { id: '30d', label: '30D', long: 'Last 30 days' },
  { id: '90d', label: '90D', long: 'Last 90 days' },
  { id: 'ytd', label: 'YTD', long: 'Year to date' },
]

export function periodWindow(period: PeriodId): Window {
  if (period === 'ytd') return { from: `${DEMO_TODAY.slice(0, 4)}-01-01`, to: DEMO_TODAY }
  const days = period === '30d' ? 30 : 90
  return { from: addDays(DEMO_TODAY, -(days - 1)), to: DEMO_TODAY }
}

export function previousWindow(period: PeriodId): Window | null {
  if (period === 'ytd') return null
  const days = period === '30d' ? 30 : 90
  const cur = periodWindow(period)
  return { from: addDays(cur.from, -days), to: addDays(cur.from, -1) }
}

const inWindow = (d: ISODate | undefined, w: Window) => !!d && d >= w.from && d <= w.to
const dayOf = (stamp: string) => stamp.slice(0, 10)
const HOUR = 3_600_000

/* ───────────── scoping ───────────── */

export function scopeWorkOrders(ds: Dataset, account: AccountScope): WorkOrder[] {
  return account === 'all' ? ds.workOrders : ds.workOrders.filter((w) => w.customerId === account)
}

export function workOrderIndex(ds: Dataset): Map<string, WorkOrder> {
  return new Map(ds.workOrders.map((w) => [w.id, w]))
}

export function scopeEvidence(ds: Dataset, account: AccountScope): EvidenceRecord[] {
  if (account === 'all') return ds.evidence
  const idx = workOrderIndex(ds)
  const contracts = new Map(ds.contracts.map((c) => [c.id, c]))
  return ds.evidence.filter((e) =>
    e.workOrderId ? idx.get(e.workOrderId)?.customerId === account : contracts.get(e.contractId!)?.customerId === account,
  )
}

export function scopeExceptions(ds: Dataset, account: AccountScope): ServiceException[] {
  if (account === 'all') return ds.exceptions
  const idx = workOrderIndex(ds)
  return ds.exceptions.filter((x) => idx.get(x.workOrderId)?.customerId === account)
}

export function activeWorkOrders(ds: Dataset, account: AccountScope): WorkOrder[] {
  return scopeWorkOrders(ds, account).filter(isActive)
}

/* ───────────── KPIs ───────────── */

export interface Ratio {
  num: number
  den: number
  pct: number | null
}

const ratio = (num: number, den: number): Ratio => ({ num, den, pct: den ? (num / den) * 100 : null })

/** On-time delivery: milestones completed in the window on or before their planned date. */
export function onTimeDelivery(orders: WorkOrder[], w: Window): Ratio {
  let num = 0
  let den = 0
  for (const wo of orders) {
    for (const m of wo.milestones) {
      if (!inWindow(m.actual, w)) continue
      den++
      if (m.actual! <= m.planned) num++
    }
  }
  return ratio(num, den)
}

/** Service-level attainment: orders acknowledged complete in the window on or before the contracted due date. */
export function slaAttainment(orders: WorkOrder[], w: Window): Ratio {
  const closed = orders.filter((wo) => wo.status === 'completed' && inWindow(wo.completedOn, w))
  return ratio(closed.filter((wo) => wo.completedOn! <= wo.due).length, closed.length)
}

/** Verified within 48 h of first upload — evaluated for uploads whose 48-hour window has elapsed. */
export function verifiedWithin48h(e: EvidenceRecord): boolean {
  const first = e.versions[0]
  if (!first) return false
  const ok = e.versions.find((v) => v.outcome === 'verified' && v.reviewedAt)
  return !!ok && Date.parse(ok.reviewedAt!) - Date.parse(first.uploadedAt) <= 48 * HOUR
}

export function evidenceVerification(records: EvidenceRecord[], w: Window): Ratio {
  const cutoff = Date.parse(DEMO_NOW) - 48 * HOUR
  const eligible = records.filter((e) => {
    const first = e.versions[0]
    return first && inWindow(dayOf(first.uploadedAt), w) && Date.parse(first.uploadedAt) <= cutoff
  })
  return ratio(eligible.filter(verifiedWithin48h).length, eligible.length)
}

export function openExceptions(exceptions: ServiceException[]): ServiceException[] {
  return exceptions.filter((x) => x.status === 'open')
}

export function pendingAcknowledgment(orders: WorkOrder[]): WorkOrder[] {
  return orders.filter((wo) => wo.status === 'pending-ack')
}

/* ───────────── time series ───────────── */

export interface SeriesPoint {
  month: string
  value: number | null
}

export function monthWindow(month: string): Window {
  return { from: `${month}-01`, to: monthEnd(month) }
}

export function monthlySeries(months: string[], fn: (w: Window) => Ratio): SeriesPoint[] {
  return months.map((month) => ({ month, value: fn(monthWindow(month)).pct }))
}

export function activeCountAt(orders: WorkOrder[], day: ISODate): number {
  return orders.filter((wo) => {
    if (wo.status === 'scheduled' || wo.start > day) return false
    return !wo.completedOn || wo.completedOn > day
  }).length
}

export function openExceptionsAt(exceptions: ServiceException[], day: ISODate): number {
  return exceptions.filter((x) => x.raisedOn <= day && (!x.resolvedOn || x.resolvedOn > day)).length
}

export function trendMonths(period: PeriodId): string[] {
  return lastMonths(period === '30d' ? 6 : period === '90d' ? 9 : 12)
}

/* ───────────── proof chain ───────────── */

export interface ProofFunnel {
  captured: number
  submitted: number
  verified: number
  acknowledged: number
  recapture: number
}

export function proofFunnel(records: EvidenceRecord[], w: Window): ProofFunnel {
  const inP = records.filter((e) => inWindow(dayOf(e.capturedAt), w))
  return {
    captured: inP.length,
    submitted: inP.filter((e) => e.uploadedAt).length,
    verified: inP.filter((e) => e.stage === 'verified' || e.stage === 'acknowledged').length,
    acknowledged: inP.filter((e) => e.stage === 'acknowledged').length,
    recapture: inP.filter((e) => e.stage === 'recapture').length,
  }
}

/** Verification throughput for the period: queue, median turnaround and re-capture rate. */
export function verificationStats(records: EvidenceRecord[], w: Window) {
  const uploaded = records.filter((e) => e.versions[0] && inWindow(dayOf(e.versions[0].uploadedAt), w))
  const hours = uploaded
    .map((e) => {
      const ok = e.versions.find((v) => v.outcome === 'verified' && v.reviewedAt)
      return ok ? (Date.parse(ok.reviewedAt!) - Date.parse(e.versions[0].uploadedAt)) / HOUR : null
    })
    .filter((h): h is number => h != null)
    .sort((a, b) => a - b)
  const median = hours.length ? (hours.length % 2 ? hours[(hours.length - 1) / 2] : (hours[hours.length / 2 - 1] + hours[hours.length / 2]) / 2) : null
  return {
    awaiting: records.filter((e) => e.stage === 'submitted').length,
    medianHours: median,
    recaptureRate: uploaded.length ? (uploaded.filter((e) => e.versions.some((v) => v.outcome === 'rejected')).length / uploaded.length) * 100 : null,
  }
}

export const STAGE_ORDER: Record<ProofStage, number> = { captured: 1, submitted: 2, recapture: 2, verified: 3, acknowledged: 4 }

/** Proof Chain summary for a work order: how far its weakest record has progressed. */
export function workOrderProof(records: EvidenceRecord[]) {
  const counts = { total: records.length, verified: 0, acknowledged: 0, pending: 0, recapture: 0 }
  for (const e of records) {
    if (e.stage === 'verified') counts.verified++
    else if (e.stage === 'acknowledged') counts.acknowledged++
    else if (e.stage === 'recapture') counts.recapture++
    else counts.pending++
  }
  return counts
}

export function evidenceByWorkOrder(ds: Dataset): Map<string, EvidenceRecord[]> {
  const map = new Map<string, EvidenceRecord[]>()
  for (const e of ds.evidence) {
    if (!e.workOrderId) continue
    const list = map.get(e.workOrderId) ?? []
    list.push(e)
    map.set(e.workOrderId, list)
  }
  return map
}

export function progressOf(wo: WorkOrder): number {
  return wo.milestones.filter((m) => m.state === 'done').length / wo.milestones.length
}

export function currentMilestone(wo: WorkOrder) {
  return wo.milestones.find((m) => m.state === 'current' || m.state === 'blocked')
}

/* ───────────── regions ───────────── */

export interface RegionSummary {
  regionId: RegionId
  active: number
  openExceptions: number
  otd: Ratio
  evidence: Ratio
  vendorsQualified: number
  vendorsTotal: number
  byStatus: Record<ActiveStatus, number>
}

export function regionSummaries(ds: Dataset, account: AccountScope, period: PeriodId): RegionSummary[] {
  const orders = scopeWorkOrders(ds, account)
  const records = scopeEvidence(ds, account)
  const exceptions = openExceptions(scopeExceptions(ds, account))
  const idx = workOrderIndex(ds)
  const w = periodWindow(period)
  return ds.regions.map((r) => {
    const regionOrders = orders.filter((o) => o.regionId === r.id)
    const active = regionOrders.filter(isActive)
    const byStatus = Object.fromEntries(ACTIVE_STATUSES.map((s) => [s, active.filter((a) => a.status === s).length])) as Record<ActiveStatus, number>
    const vendors = ds.vendors.filter((v) => v.regionId === r.id)
    return {
      regionId: r.id,
      active: active.length,
      openExceptions: exceptions.filter((x) => idx.get(x.workOrderId)?.regionId === r.id).length,
      otd: onTimeDelivery(regionOrders, w),
      evidence: evidenceVerification(
        records.filter((e) => (e.workOrderId ? idx.get(e.workOrderId)?.regionId === r.id : false)),
        w,
      ),
      vendorsQualified: vendors.filter((v) => v.qualification === 'qualified').length,
      vendorsTotal: vendors.length,
      byStatus,
    }
  })
}

/* ───────────── activity feed ───────────── */

export type ActivityKind = 'milestone' | 'uploaded' | 'verified' | 'acknowledged' | 'rejected' | 'exception' | 'resolved'

export interface ActivityEvent {
  id: string
  at: string
  kind: ActivityKind
  workOrderId?: string
  title: string
  detail: string
}

export function activityFeed(ds: Dataset, account: AccountScope, limit = 12): ActivityEvent[] {
  const orders = scopeWorkOrders(ds, account)
  const records = scopeEvidence(ds, account)
  const exceptions = scopeExceptions(ds, account)
  const nowMs = Date.parse(DEMO_NOW)
  const since = addDays(DEMO_TODAY, -21)
  const out: ActivityEvent[] = []
  for (const wo of orders) {
    for (const m of wo.milestones) {
      if (!m.actual || m.actual < since) continue
      out.push({ id: `${m.id}-done`, at: `${m.actual}T17:00:00+07:00`, kind: 'milestone', workOrderId: wo.id, title: `${m.name} completed`, detail: wo.title })
    }
  }
  for (const e of records) {
    if (e.uploadedAt && dayOf(e.uploadedAt) >= since) out.push({ id: `${e.id}-up`, at: e.uploadedAt, kind: 'uploaded', workOrderId: e.workOrderId, title: `${e.id} submitted`, detail: e.title })
    for (const v of e.versions) {
      if (v.outcome === 'rejected' && v.reviewedAt && dayOf(v.reviewedAt) >= since)
        out.push({ id: `${e.id}-rej-${v.version}`, at: v.reviewedAt, kind: 'rejected', workOrderId: e.workOrderId, title: `${e.id} v${v.version} returned for re-capture`, detail: v.note })
    }
    if (e.verifiedAt && dayOf(e.verifiedAt) >= since) out.push({ id: `${e.id}-ver`, at: e.verifiedAt, kind: 'verified', workOrderId: e.workOrderId, title: `${e.id} verified`, detail: e.title })
    if (e.acknowledgedAt && dayOf(e.acknowledgedAt) >= since) out.push({ id: `${e.id}-ack`, at: e.acknowledgedAt, kind: 'acknowledged', workOrderId: e.workOrderId, title: `${e.id} acknowledged by customer`, detail: e.title })
  }
  for (const x of exceptions) {
    if (x.raisedOn >= since) out.push({ id: `${x.id}-raised`, at: `${x.raisedOn}T10:00:00+07:00`, kind: 'exception', workOrderId: x.workOrderId, title: `${x.id} raised · ${x.category}`, detail: x.title })
    if (x.resolvedOn && x.resolvedOn >= since) out.push({ id: `${x.id}-res`, at: `${x.resolvedOn}T16:00:00+07:00`, kind: 'resolved', workOrderId: x.workOrderId, title: `${x.id} resolved`, detail: x.title })
  }
  return out
    .filter((e) => Date.parse(e.at) <= nowMs)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, limit)
}

/* ───────────── outcome ledger ───────────── */

export function contractEvidence(ds: Dataset, c: OutcomeContract): EvidenceRecord[] {
  const ids = new Set(c.evidenceIds)
  return ds.evidence.filter((e) => ids.has(e.id))
}
