// Data contract: the numbers judges see must reconcile across every page.
import { describe, expect, it } from 'vitest'
import { buildDataset, HERO_WORK_ORDER } from '../src/data/build'
import { calculateLedger } from '../src/data/ledger'
import {
  activeWorkOrders,
  contractEvidence,
  evidenceVerification,
  isActive,
  onTimeDelivery,
  openExceptions,
  periodWindow,
  regionSummaries,
  scopeEvidence,
  scopeWorkOrders,
  slaAttainment,
} from '../src/data/selectors'
import { DEMO_NOW } from '../src/data/dates'

const ds = buildDataset()

describe('determinism', () => {
  it('builds identical data on every call', () => {
    expect(JSON.stringify(buildDataset())).toBe(JSON.stringify(ds))
  })
})

describe('active portfolio', () => {
  const active = activeWorkOrders(ds, 'all')

  it('has 24 active work orders', () => expect(active).toHaveLength(24))

  it('splits by region 6 / 7 / 7 / 4', () => {
    const by = (r: string) => active.filter((w) => w.regionId === r).length
    expect([by('batam'), by('surabaya'), by('balikpapan'), by('sorong')]).toEqual([6, 7, 7, 4])
  })

  it('splits by status 3 / 11 / 5 / 3 / 2', () => {
    const by = (s: string) => active.filter((w) => w.status === s).length
    expect([by('mobilizing'), by('in-progress'), by('awaiting-evidence'), by('pending-ack'), by('on-hold')]).toEqual([3, 11, 5, 3, 2])
  })

  it('customer scopes sum to the portfolio', () => {
    const sum = (['mdp', 'rst', 'bcp'] as const).reduce((s, c) => s + activeWorkOrders(ds, c).length, 0)
    expect(sum).toBe(24)
  })

  it('region summaries reconcile with the portfolio', () => {
    const regions = regionSummaries(ds, 'all', '30d')
    expect(regions.reduce((s, r) => s + r.active, 0)).toBe(24)
    expect(regions.reduce((s, r) => s + r.openExceptions, 0)).toBe(openExceptions(ds.exceptions).length)
  })

  it('every site belongs to its order region and customer', () => {
    for (const wo of ds.workOrders) {
      const site = ds.sites.find((s) => s.id === wo.siteId)!
      expect(site.regionId).toBe(wo.regionId)
      expect(site.customerId).toBe(wo.customerId)
    }
  })
})

describe('milestones', () => {
  it('done milestones are never in the future and are chronological', () => {
    for (const wo of ds.workOrders) {
      let prev = ''
      for (const m of wo.milestones) {
        if (m.state !== 'done') continue
        expect(m.actual! <= DEMO_NOW.slice(0, 10)).toBe(true)
        expect(m.actual! >= prev).toBe(true)
        prev = m.actual!
      }
    }
  })

  it('active orders have exactly one current or blocked milestone', () => {
    for (const wo of ds.workOrders.filter(isActive)) {
      expect(wo.milestones.filter((m) => m.state === 'current' || m.state === 'blocked')).toHaveLength(1)
    }
  })
})

describe('evidence', () => {
  it('every record links to an existing work order or contract', () => {
    const wo = new Set(ds.workOrders.map((w) => w.id))
    const oc = new Set(ds.contracts.map((c) => c.id))
    for (const e of ds.evidence) {
      expect(e.workOrderId ? wo.has(e.workOrderId) : oc.has(e.contractId!)).toBe(true)
    }
  })

  it('IDs are unique', () => {
    expect(new Set(ds.evidence.map((e) => e.id)).size).toBe(ds.evidence.length)
    expect(new Set(ds.workOrders.map((e) => e.id)).size).toBe(ds.workOrders.length)
  })

  it('stage matches timestamps', () => {
    const now = Date.parse(DEMO_NOW)
    for (const e of ds.evidence) {
      if (e.stage === 'captured') expect(e.uploadedAt).toBeUndefined()
      if (e.stage !== 'captured') expect(e.uploadedAt).toBeDefined()
      if (e.stage === 'verified' || e.stage === 'acknowledged') expect(e.verifiedAt).toBeDefined()
      if (e.stage === 'acknowledged') expect(e.acknowledgedAt).toBeDefined()
      for (const t of [e.capturedAt, e.uploadedAt, e.verifiedAt, e.acknowledgedAt]) if (t) expect(Date.parse(t)).toBeLessThanOrEqual(now)
    }
  })

  it('the hero order carries five records, three verified-or-better plus the pending report flow', () => {
    const recs = ds.evidence.filter((e) => e.workOrderId === HERO_WORK_ORDER)
    expect(recs).toHaveLength(5)
    const report = recs.find((r) => r.type === 'service-report')!
    expect(report.versions).toHaveLength(2)
    // The Evidence tour opens this record by id.
    expect(report.id).toBe('EV-3904')
  })

  it('customer scope partitions evidence', () => {
    const sum = (['mdp', 'rst', 'bcp'] as const).reduce((s, c) => s + scopeEvidence(ds, c).length, 0)
    expect(sum).toBe(ds.evidence.length)
  })
})

describe('exceptions', () => {
  it('7 open exceptions, each on an active order', () => {
    const open = openExceptions(ds.exceptions)
    expect(open).toHaveLength(7)
    const active = new Set(ds.workOrders.filter(isActive).map((w) => w.id))
    for (const x of open) expect(active.has(x.workOrderId)).toBe(true)
  })
})

describe('KPI ranges stay believable', () => {
  const w = periodWindow('30d')
  const orders = scopeWorkOrders(ds, 'all')
  it('on-time delivery 85–97%', () => {
    const r = onTimeDelivery(orders, w).pct!
    expect(r).toBeGreaterThan(85)
    expect(r).toBeLessThan(97)
  })
  it('SLA attainment 85–100%', () => {
    const r = slaAttainment(orders, w).pct!
    expect(r).toBeGreaterThan(85)
    expect(r).toBeLessThanOrEqual(100)
  })
  it('evidence verified within 48 h 80–98%', () => {
    const r = evidenceVerification(ds.evidence, w).pct!
    expect(r).toBeGreaterThan(80)
    expect(r).toBeLessThan(98)
  })
})

describe('outcome ledger (fictional demonstration figures)', () => {
  const c = ds.contracts.find((x) => x.id === 'OC-26-003')!
  const result = calculateLedger(c, contractEvidence(ds, c))

  it('reproduces the 90% → 96% → US$26,000 example', () => {
    expect(result.baselinePct).toBe(90)
    expect(result.verifiedPct).toBe(96)
    expect(result.eligiblePts).toBe(6)
    expect(result.fixedFee).toBe(20_000)
    expect(result.performanceFee).toBe(6_000)
    expect(result.adjustments).toBe(0)
    expect(result.total).toBe(26_000)
  })

  it('contract evidence exists in the Evidence Center', () => {
    expect(contractEvidence(ds, c)).toHaveLength(3)
  })

  it('a below-baseline contract earns only its fixed fee', () => {
    const low = ds.contracts.find((x) => x.id === 'OC-26-007')!
    const r = calculateLedger(low, contractEvidence(ds, low))
    expect(r.performanceFee).toBe(0)
    expect(r.total).toBe(low.fixedFee)
  })
})
