// Deterministic dataset builder. Same seed → identical data on every load; nothing is random per render.
import { addDays, DEMO_NOW, DEMO_TODAY, diffDays, lastMonths } from './dates'
import {
  CREWS,
  CUSTOMERS,
  MILESTONE_EVIDENCE,
  MILESTONE_KEYS,
  MILESTONE_LABELS,
  REGIONS,
  SERVICES,
  SITES,
  VENDORS,
  VERIFIERS,
  type ServiceSpec,
} from './reference'
import type {
  ActiveStatus,
  CustomerId,
  Dataset,
  EvidenceRecord,
  ExceptionCategory,
  ISODate,
  ISODateTime,
  Milestone,
  OutcomeContract,
  Priority,
  RegionId,
  ServiceException,
  WorkOrder,
} from './types'

/* ───────────── seeded PRNG ───────────── */

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SEED = 20261027

/* ───────────── time helpers ───────────── */

const offsetOf = (regionId: RegionId) => REGIONS.find((r) => r.id === regionId)!.utcOffset

/** Local wall-clock stamp: day + minutes after midnight, formatted with the region's UTC offset. */
function stamp(date: ISODate, minutes: number, regionId: RegionId): ISODateTime {
  const dayShift = Math.floor(minutes / 1440)
  const m = ((minutes % 1440) + 1440) % 1440
  const d = addDays(date, dayShift)
  const hh = String(Math.floor(m / 60)).padStart(2, '0')
  const mm = String(m % 60).padStart(2, '0')
  return `${d}T${hh}:${mm}:00+0${offsetOf(regionId)}:00`
}

function shiftStamp(s: ISODateTime, minutes: number, regionId: RegionId): ISODateTime {
  const date = s.slice(0, 10)
  const mins = Number(s.slice(11, 13)) * 60 + Number(s.slice(14, 16))
  return stamp(date, mins + minutes, regionId)
}

/* ───────────── authored active portfolio (24 orders) ───────────── */

interface ActiveSeed {
  id: string
  title: string
  service: number
  customerId: CustomerId
  siteId: string
  priority: Priority
  status: ActiveStatus
  crewId: string
  vendorId?: string
  done: number
  holdReason?: string
}

const ACTIVE: ActiveSeed[] = [
  // Batam — 6
  { id: 'WO-26-0391', title: 'Loading-pump set overhaul, Jetty 2', service: 2, customerId: 'rst', siteId: 's-rst-ta', priority: 'P1', status: 'in-progress', crewId: 'c-w1', vendorId: 'v-kmt', done: 2 },
  { id: 'WO-26-0398', title: 'Tank 4 shell & floor inspection', service: 9, customerId: 'rst', siteId: 's-rst-tf', priority: 'P2', status: 'in-progress', crewId: 'c-w2', done: 3 },
  { id: 'WO-26-0402', title: 'Terminal instrument calibration, Q4 cycle', service: 6, customerId: 'rst', siteId: 's-rst-ta', priority: 'P3', status: 'awaiting-evidence', crewId: 'c-w2', vendorId: 'v-sgc', done: 4 },
  { id: 'WO-26-0409', title: 'Tank farm cathodic protection survey', service: 3, customerId: 'rst', siteId: 's-rst-tf', priority: 'P2', status: 'pending-ack', crewId: 'c-w1', done: 5 },
  { id: 'WO-26-0423', title: 'Jetty fire & gas detector function test', service: 8, customerId: 'rst', siteId: 's-rst-ta', priority: 'P2', status: 'in-progress', crewId: 'c-w1', vendorId: 'v-kmt', done: 2 },
  { id: 'WO-26-0431', title: 'Fabrication-yard pressure-valve testing', service: 4, customerId: 'mdp', siteId: 's-mdp-fy', priority: 'P3', status: 'mobilizing', crewId: 'c-w2', done: 0 },
  // Surabaya — 7
  { id: 'WO-26-0385', title: 'Unit 1 cooling-water pump overhaul', service: 2, customerId: 'bcp', siteId: 's-bcp-u1', priority: 'P1', status: 'in-progress', crewId: 'c-j1', vendorId: 'v-ars', done: 3 },
  { id: 'WO-26-0394', title: '150 kV switchgear preventive maintenance', service: 5, customerId: 'bcp', siteId: 's-bcp-ss', priority: 'P1', status: 'on-hold', crewId: 'c-j2', vendorId: 'v-jet', done: 2, holdReason: 'Outage window not yet confirmed by site' },
  { id: 'WO-26-0399', title: 'Receiving-station valve integrity testing', service: 4, customerId: 'mdp', siteId: 's-mdp-grs', priority: 'P2', status: 'in-progress', crewId: 'c-j1', done: 2 },
  { id: 'WO-26-0405', title: 'Unit 1 fire & gas system test', service: 8, customerId: 'bcp', siteId: 's-bcp-u1', priority: 'P2', status: 'awaiting-evidence', crewId: 'c-j2', done: 4 },
  { id: 'WO-26-0412', title: 'Metering skid calibration', service: 6, customerId: 'mdp', siteId: 's-mdp-grs', priority: 'P3', status: 'awaiting-evidence', crewId: 'c-j2', vendorId: 'v-jet', done: 4 },
  { id: 'WO-26-0420', title: 'Depot transfer-pump overhaul', service: 2, customerId: 'rst', siteId: 's-rst-sd', priority: 'P2', status: 'in-progress', crewId: 'c-j1', vendorId: 'v-ars', done: 3 },
  { id: 'WO-26-0433', title: 'Unit 1 condenser UT thickness survey', service: 7, customerId: 'bcp', siteId: 's-bcp-u1', priority: 'P3', status: 'mobilizing', crewId: 'c-j1', done: 1 },
  // Balikpapan — 7
  { id: 'WO-26-0417', title: 'Gas turbine hot-section borescope inspection', service: 0, customerId: 'mdp', siteId: 's-mdp-cs2', priority: 'P1', status: 'pending-ack', crewId: 'c-k1', vendorId: 'v-biw', done: 5 },
  { id: 'WO-26-0389', title: 'Train B compressor overhaul', service: 1, customerId: 'mdp', siteId: 's-mdp-tb', priority: 'P1', status: 'in-progress', crewId: 'c-k2', vendorId: 'v-mhs', done: 3 },
  { id: 'WO-26-0396', title: 'Inlet header UT thickness survey', service: 7, customerId: 'mdp', siteId: 's-mdp-cs2', priority: 'P2', status: 'in-progress', crewId: 'c-k1', vendorId: 'v-biw', done: 2 },
  { id: 'WO-26-0403', title: 'Peaking plant switchgear maintenance', service: 5, customerId: 'bcp', siteId: 's-bcp-pk', priority: 'P2', status: 'pending-ack', crewId: 'c-k2', done: 5 },
  { id: 'WO-26-0407', title: 'Train B instrument calibration campaign', service: 6, customerId: 'mdp', siteId: 's-mdp-tb', priority: 'P2', status: 'awaiting-evidence', crewId: 'c-k2', done: 4 },
  { id: 'WO-26-0415', title: 'Compressor station valve integrity testing', service: 4, customerId: 'mdp', siteId: 's-mdp-cs2', priority: 'P3', status: 'in-progress', crewId: 'c-k1', done: 3 },
  { id: 'WO-26-0435', title: 'Pipeline cathodic protection survey', service: 3, customerId: 'mdp', siteId: 's-mdp-tb', priority: 'P3', status: 'mobilizing', crewId: 'c-k2', vendorId: 'v-biw', done: 0 },
  // Sorong — 4
  { id: 'WO-26-0393', title: 'Diesel plant fuel-pump overhaul', service: 2, customerId: 'bcp', siteId: 's-bcp-dp', priority: 'P1', status: 'on-hold', crewId: 'c-p1', vendorId: 'v-cfs', done: 3, holdReason: 'Replacement impeller awaiting customs clearance' },
  { id: 'WO-26-0400', title: 'Fuel depot tank inspection', service: 9, customerId: 'rst', siteId: 's-rst-fd', priority: 'P2', status: 'in-progress', crewId: 'c-p1', vendorId: 'v-cfs', done: 2 },
  { id: 'WO-26-0410', title: 'Gathering station fire & gas test', service: 8, customerId: 'mdp', siteId: 's-mdp-gg', priority: 'P2', status: 'awaiting-evidence', crewId: 'c-p1', vendorId: 'v-kbt', done: 4 },
  { id: 'WO-26-0426', title: 'Depot cathodic protection survey', service: 3, customerId: 'rst', siteId: 's-rst-fd', priority: 'P3', status: 'in-progress', crewId: 'c-p1', done: 2 },
]

export const HERO_WORK_ORDER = 'WO-26-0417'
/** Awaiting-evidence order whose execution evidence was rejected and is being re-captured. */
export const RECAPTURE_WORK_ORDER = 'WO-26-0407'

const OPEN_EXCEPTIONS: Omit<ServiceException, 'id' | 'status'>[] = [
  { workOrderId: 'WO-26-0417', title: 'Stage-1 blade coating loss needs an engineering decision', category: 'Scope change', severity: 'medium', raisedOn: '2026-10-24', owner: 'Bayu Nugroho', needsCustomer: true, detail: 'Borescope image B-3 shows coating loss within limits. Customer engineering to decide whether to monitor at the next interval or schedule a repair.' },
  { workOrderId: 'WO-26-0394', title: 'Switchgear outage window not confirmed', category: 'Access & permits', severity: 'high', raisedOn: '2026-10-21', owner: 'Sari Wulandari', needsCustomer: true, detail: 'Isolation of bay 3 requires a 6-hour outage window from site operations. Crew on standby.' },
  { workOrderId: 'WO-26-0393', title: 'Replacement impeller awaiting customs clearance', category: 'Parts & materials', severity: 'high', raisedOn: '2026-10-19', owner: 'Yohanes Mandacan', needsCustomer: false, detail: 'OEM impeller held for import documentation. Work paused after disassembly; unit isolated and tagged.' },
  { workOrderId: 'WO-26-0407', title: 'Calibration photo set rejected, gauge readings illegible', category: 'Evidence quality', severity: 'low', raisedOn: '2026-10-25', owner: 'Fitri Handayani', needsCustomer: false, detail: 'Verifier rejected v1: glare on 4 of 12 gauges. Re-capture scheduled with the crew.' },
  { workOrderId: 'WO-26-0391', title: 'Sea state above jetty access limit', category: 'Weather & sea state', severity: 'medium', raisedOn: '2026-10-26', owner: 'Rizky Pratama', needsCustomer: false, detail: 'Jetty access suspended for one shift under the site marine procedure. Work resequenced to onshore tasks.' },
  { workOrderId: 'WO-26-0389', title: 'Hot-work permit renewal pending', category: 'Access & permits', severity: 'medium', raisedOn: '2026-10-26', owner: 'Fitri Handayani', needsCustomer: true, detail: 'Permit expires at end of shift; renewal requested from the site permit office.' },
  { workOrderId: 'WO-26-0399', title: 'Additional passing valve found, scope change proposed', category: 'Scope change', severity: 'medium', raisedOn: '2026-10-23', owner: 'Agus Santoso', needsCustomer: true, detail: 'Valve XV-214 failed the seat-leak test. Change proposal issued for repair under the same mobilisation.' },
]

/* ───────────── outcome contracts (Independent Innovation Demo — fictional) ───────────── */

const CONTRACT_SEEDS: (Omit<OutcomeContract, 'evidenceIds'> & { hours: [number, number, number] })[] = [
  {
    id: 'OC-26-003',
    name: 'Compressor Station Availability',
    customerId: 'mdp',
    siteId: 's-mdp-cs2',
    regionId: 'balikpapan',
    metric: 'Compressor availability',
    period: 'Q3 2026',
    periodMonths: ['2026-07', '2026-08', '2026-09'],
    baselinePct: 90,
    fixedFee: 20_000,
    ratePerPoint: 1_000,
    capPoints: 8,
    adjustments: [],
    approvalStage: 1,
    hours: [712.0, 717.4, 690.3],
  },
  {
    id: 'OC-26-005',
    name: 'Terminal Pump-Set Availability',
    customerId: 'rst',
    siteId: 's-rst-ta',
    regionId: 'batam',
    metric: 'Loading pump-set availability',
    period: 'Q3 2026',
    periodMonths: ['2026-07', '2026-08', '2026-09'],
    baselinePct: 92,
    fixedFee: 15_000,
    ratePerPoint: 800,
    capPoints: 5,
    adjustments: [],
    approvalStage: 3,
    hours: [689.9, 697.2, 675.2],
  },
  {
    id: 'OC-26-007',
    name: 'Cooling-Water System Availability',
    customerId: 'bcp',
    siteId: 's-bcp-u1',
    regionId: 'surabaya',
    metric: 'Cooling-water system availability',
    period: 'Q3 2026',
    periodMonths: ['2026-07', '2026-08', '2026-09'],
    baselinePct: 94,
    fixedFee: 18_000,
    ratePerPoint: 900,
    capPoints: 4,
    adjustments: [],
    approvalStage: 2,
    hours: [690.1, 694.8, 670.7],
  },
]

const MONTH_HOURS: Record<string, number> = { '2026-07': 744, '2026-08': 744, '2026-09': 720 }

/* ───────────── builder ───────────── */

export function buildDataset(): Dataset {
  const rnd = mulberry32(SEED)
  const int = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1))
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rnd() * xs.length)]
  const hex = (n: number) => Array.from({ length: n }, () => '0123456789abcdef'[int(0, 15)]).join('')

  const workOrders: WorkOrder[] = []
  type DraftEvidence = Omit<EvidenceRecord, 'id'> & { sortKey: number }
  const evidence: DraftEvidence[] = []
  const exceptions: Omit<ServiceException, 'id'>[] = []

  const regionOfSite = (siteId: string) => SITES.find((s) => s.id === siteId)!.regionId
  const crewLead = (crewId: string) => CREWS.find((c) => c.id === crewId)!

  /** Probability that a step runs on plan, improving over the year as the proof-led model matures. */
  const onPlanProbability = (date: ISODate) => {
    const monthsAgo = Math.max(0, diffDays(DEMO_TODAY, date) / 30.4)
    return Math.min(0.97, 0.955 - monthsAgo * 0.0115)
  }

  function makeMilestones(spec: ServiceSpec, start: ISODate, doneCount: number, blocked: boolean, latestActual: ISODate) {
    const milestones: Milestone[] = []
    let planned = start
    let prevActual = start
    for (let i = 0; i < MILESTONE_KEYS.length; i++) {
      const key = MILESTONE_KEYS[i]
      planned = addDays(planned, spec.durations[i])
      const name = key === 'execute' ? spec.execute : MILESTONE_LABELS[key]
      const m: Milestone = { id: '', key, name, planned, state: 'upcoming' }
      if (i < doneCount) {
        const earliest = addDays(prevActual, Math.max(1, spec.durations[i] - 1))
        let actual = earliest > planned ? earliest : planned
        if (rnd() > onPlanProbability(planned)) actual = addDays(actual, int(1, 2))
        if (actual > latestActual) actual = latestActual
        if (actual < prevActual) actual = prevActual
        m.actual = actual
        m.state = 'done'
        prevActual = actual
      } else if (i === doneCount) {
        m.state = blocked ? 'blocked' : 'current'
      }
      milestones.push(m)
    }
    return milestones
  }

  function addMilestoneEvidence(wo: WorkOrder, spec: ServiceSpec, mode: 'completed' | 'active') {
    const regionId = wo.regionId
    const crew = crewLead(wo.crewId)
    for (const m of wo.milestones) {
      if (m.key === 'acknowledge') continue
      const meta = m.key === 'execute' ? spec.executeEvidence : MILESTONE_EVIDENCE[m.key]
      if (!meta) continue
      // Completed history keeps the three records customers ask for most: permit, execution proof, report.
      if (mode === 'completed' && (m.key === 'mobilise' || m.key === 'quality')) continue
      const isCurrentReport = m.state === 'current' && m.key === 'report'
      const isCurrentCapture = mode === 'active' && m.state === 'current' && (m.key === 'execute' || m.key === 'quality') && rnd() < 0.6
      if (m.state !== 'done' && !isCurrentReport && !isCurrentCapture) continue

      const day = m.actual ?? addDays(DEMO_TODAY, -int(0, 1))
      const isToday = day === DEMO_TODAY
      const capturedAt = stamp(day, isToday ? int(5 * 60, 6 * 60) : int(8 * 60, 16 * 60), regionId)
      const uploadedAt = shiftStamp(capturedAt, isToday ? int(10, 50) : int(20, 300), regionId)
      // Verification turnaround improves through the year: the 48-hour verification standard.
      const fast = rnd() < onPlanProbability(day) - 0.015
      const verifyMins = fast ? int(90, 40 * 60) : int(49 * 60, 80 * 60)
      const verifiedAt = shiftStamp(uploadedAt, verifyMins, regionId)
      const verifier = pick(VERIFIERS)

      const base: DraftEvidence = {
        workOrderId: wo.id,
        milestoneKey: m.key,
        type: meta.type,
        title: meta.title,
        stage: 'verified',
        capturedAt,
        uploadedAt,
        verifiedAt,
        source: `Field tablet · ${crew.name}`,
        verifier,
        checksum: `sha256:${hex(8)}…${hex(4)}`,
        sizeKb: int(180, 9_800),
        pages: meta.type === 'service-report' || meta.type === 'certificate' ? int(4, 18) : undefined,
        versions: [{ version: 1, uploadedAt, outcome: 'verified', note: 'Matches site, timestamp and signatory.', reviewedAt: verifiedAt }],
        sortKey: Date.parse(capturedAt),
      }

      if (isCurrentCapture) {
        // On the field tablet, not yet uploaded.
        base.capturedAt = stamp(DEMO_TODAY, int(6 * 60, 8 * 60), regionId)
        base.stage = 'captured'
        base.uploadedAt = undefined
        base.verifiedAt = undefined
        base.verifier = undefined
        base.versions = []
        base.sortKey = Date.parse(base.capturedAt)
      } else if (isCurrentReport || Date.parse(verifiedAt) > Date.parse(DEMO_NOW)) {
        // Uploaded, still waiting for verification.
        base.stage = 'submitted'
        base.verifiedAt = undefined
        base.verifier = undefined
        base.versions = [{ version: 1, uploadedAt, outcome: 'pending', note: 'Queued for verification.' }]
      } else if (mode === 'completed' || (m.key !== 'report' && rnd() < 0.45)) {
        base.stage = 'acknowledged'
        base.acknowledgedAt = shiftStamp(verifiedAt, int(6 * 60, 50 * 60), regionId)
        if (Date.parse(base.acknowledgedAt) > Date.parse(DEMO_NOW)) {
          base.stage = 'verified'
          base.acknowledgedAt = undefined
        }
      }
      evidence.push(base)
    }
  }

  /* ── completed history: Nov 2025 → Oct 2026 ── */
  const months = lastMonths(12)
  const regionWeights: [RegionId, number][] = [['batam', 0.26], ['surabaya', 0.3], ['balikpapan', 0.29], ['sorong', 0.15]]
  const pickRegion = () => {
    let r = rnd()
    for (const [id, w] of regionWeights) {
      if ((r -= w) <= 0) return id
    }
    return 'batam' as RegionId
  }
  let serial = 60
  months.forEach((month, mi) => {
    const count = mi === months.length - 1 ? int(15, 17) : int(22, 26)
    for (let k = 0; k < count; k++) {
      const regionId = pickRegion()
      const site = pick(SITES.filter((s) => s.regionId === regionId))
      const specIndex = int(0, SERVICES.length - 1)
      const spec = SERVICES[specIndex]
      const crew = pick(CREWS.filter((c) => c.regionId === regionId))
      const vendorPool = VENDORS.filter((v) => v.regionId === regionId)
      const vendorId = rnd() < 0.65 ? pick(vendorPool).id : undefined
      const total = spec.durations.reduce((a, b) => a + b, 0)
      const lastDay = mi === months.length - 1 ? 22 : 28
      const ackTarget = `${month}-${String(int(2, lastDay)).padStart(2, '0')}`
      const start = addDays(ackTarget, -total)
      const id = `WO-${start.slice(2, 4)}-0${String(serial++).padStart(3, '0')}`
      const milestones = makeMilestones(spec, start, 6, false, addDays(DEMO_TODAY, -3))
      milestones.forEach((m, i) => (m.id = `${id}-M${i + 1}`))
      // Some closures slip past the contracted date (late report sign-off, re-inspection).
      if (rnd() < 0.06) {
        const slipped = addDays(milestones[5].actual!, int(2, 3))
        if (slipped <= addDays(DEMO_TODAY, -2)) milestones[5].actual = slipped
      }
      const plannedAck = milestones[5].planned
      const wo: WorkOrder = {
        id,
        title: `${spec.type}, ${site.name}`,
        serviceType: spec.type,
        customerId: site.customerId,
        siteId: site.id,
        regionId,
        priority: pick(['P1', 'P2', 'P2', 'P3', 'P3'] as Priority[]),
        status: 'completed',
        crewId: crew.id,
        vendorId,
        start,
        due: addDays(plannedAck, int(1, 3)),
        milestones,
        completedOn: milestones[5].actual,
      }
      workOrders.push(wo)
      addMilestoneEvidence(wo, spec, 'completed')
      // Late steps leave a resolved exception trail that explains them.
      const late = milestones.find((m) => m.actual && m.actual > m.planned)
      if (late && rnd() < 0.7) {
        const category = pick<ExceptionCategory>(['Access & permits', 'Weather & sea state', 'Parts & materials', 'Parts & materials', 'Evidence quality', 'Scope change', 'Access & permits', 'Safety stop'])
        exceptions.push({
          workOrderId: id,
          title: RESOLVED_TITLES[category],
          category,
          severity: pick(['low', 'medium', 'medium', 'high'] as const),
          status: 'resolved',
          raisedOn: addDays(late.planned, -int(1, 4)),
          resolvedOn: late.actual,
          owner: crew.lead,
          needsCustomer: category === 'Scope change' || category === 'Access & permits',
          detail: `Resolved during ${late.name.toLowerCase()}.`,
        })
      }
    }
  })

  /* ── active portfolio ── */
  for (const seed of ACTIVE) {
    const spec = SERVICES[seed.service]
    const regionId = regionOfSite(seed.siteId)
    const cum = (n: number) => spec.durations.slice(0, n).reduce((a, b) => a + b, 0)
    const start = seed.done === 0 ? addDays(DEMO_TODAY, -int(0, 1)) : addDays(DEMO_TODAY, -cum(seed.done) - int(0, 1) - (seed.status === 'on-hold' ? 5 : 0))
    const milestones =
      seed.id === HERO_WORK_ORDER
        ? heroMilestones()
        : makeMilestones(spec, start, seed.done, seed.status === 'on-hold', addDays(DEMO_TODAY, -1))
    milestones.forEach((m, i) => (m.id = `${seed.id}-M${i + 1}`))
    const site = SITES.find((s) => s.id === seed.siteId)!
    const wo: WorkOrder = {
      id: seed.id,
      title: seed.title,
      serviceType: spec.type,
      customerId: seed.customerId,
      siteId: site.id,
      regionId,
      priority: seed.priority,
      status: seed.status,
      crewId: seed.crewId,
      vendorId: seed.vendorId,
      start: seed.id === HERO_WORK_ORDER ? '2026-10-14' : start,
      due: seed.id === HERO_WORK_ORDER ? '2026-10-30' : addDays(milestones[5].planned, int(1, 3)),
      milestones,
      holdReason: seed.holdReason,
    }
    workOrders.push(wo)
    if (seed.id === HERO_WORK_ORDER) {
      evidence.push(...heroEvidence())
    } else {
      addMilestoneEvidence(wo, spec, 'active')
    }
    if (seed.id === RECAPTURE_WORK_ORDER) {
      const rec = evidence.find((e) => e.workOrderId === seed.id && e.milestoneKey === 'execute')!
      const v1 = rec.uploadedAt!
      rec.stage = 'recapture'
      rec.title = 'Calibration photo set'
      rec.type = 'photo-set'
      rec.verifiedAt = undefined
      rec.acknowledgedAt = undefined
      rec.versions = [{ version: 1, uploadedAt: v1, outcome: 'rejected', note: 'Glare on 4 of 12 gauges made readings illegible.', reviewedAt: '2026-10-25T10:12:00+08:00' }]
      rec.verifier = 'Rina Marlina'
    }
  }

  OPEN_EXCEPTIONS.forEach((e) => exceptions.push({ ...e, status: 'open' }))
  exceptions.push({
    workOrderId: HERO_WORK_ORDER,
    title: 'Replacement seal kit arrived one day after plan',
    category: 'Parts & materials',
    severity: 'low',
    status: 'resolved',
    raisedOn: '2026-10-20',
    resolvedOn: '2026-10-22',
    owner: 'Bayu Nugroho',
    needsCustomer: false,
    detail: 'Seal kit supplied from the Surabaya node stock. Remediation completed 22 Oct and quality check passed the same day.',
  })

  /* ── scheduled (not yet active) ── */
  const SCHEDULED: [string, string, number, string, string, Priority][] = [
    ['WO-26-0437', 'Terminal B loading-arm valve testing', 4, 's-rst-ta', 'c-w1', 'P3'],
    ['WO-26-0438', 'Substation protection-relay calibration', 6, 's-bcp-ss', 'c-j2', 'P2'],
    ['WO-26-0440', 'Train B fire & gas system test', 8, 's-mdp-tb', 'c-k1', 'P2'],
    ['WO-26-0441', 'Diesel plant switchgear maintenance', 5, 's-bcp-dp', 'c-p1', 'P2'],
    ['WO-26-0444', 'Receiving-station CP survey', 3, 's-mdp-grs', 'c-j1', 'P3'],
    ['WO-26-0446', 'CS-2 compressor overhaul (planned outage)', 1, 's-mdp-cs2', 'c-k2', 'P1'],
  ]
  SCHEDULED.forEach(([id, title, service, siteId, crewId, priority], i) => {
    const spec = SERVICES[service]
    const site = SITES.find((s) => s.id === siteId)!
    const start = addDays(DEMO_TODAY, 3 + i * 4)
    const milestones = makeMilestones(spec, start, 0, false, DEMO_TODAY).map((m, k) => ({ ...m, id: `${id}-M${k + 1}`, state: 'upcoming' as const }))
    workOrders.push({
      id,
      title,
      serviceType: spec.type,
      customerId: site.customerId,
      siteId,
      regionId: site.regionId,
      priority,
      status: 'scheduled',
      crewId,
      start,
      due: addDays(milestones[5].planned, 2),
      milestones,
    })
  })

  /* ── contract availability logs ── */
  const contractEvidence = new Map<string, DraftEvidence[]>()
  for (const c of CONTRACT_SEEDS) {
    const list: DraftEvidence[] = c.periodMonths.map((month, i) => {
      const periodHours = MONTH_HOURS[month]
      const nextMonthDay = addDays(`${month}-01`, 32).slice(0, 8) + '02'
      const capturedAt = stamp(nextMonthDay, 7 * 60 + 30, c.regionId)
      const uploadedAt = shiftStamp(capturedAt, 45, c.regionId)
      const verifiedAt = shiftStamp(uploadedAt, int(5 * 60, 26 * 60), c.regionId)
      const acknowledged = i < 2 || c.id === 'OC-26-005'
      return {
        contractId: c.id,
        type: 'availability-log',
        title: `Availability log ${new Date(`${month}-01T00:00:00Z`).toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' })} 2026`,
        stage: acknowledged ? 'acknowledged' : 'verified',
        capturedAt,
        uploadedAt,
        verifiedAt,
        acknowledgedAt: acknowledged ? shiftStamp(verifiedAt, int(20 * 60, 44 * 60), c.regionId) : undefined,
        source: 'Site DCS historian export',
        verifier: pick(VERIFIERS),
        checksum: `sha256:${hex(8)}…${hex(4)}`,
        sizeKb: int(240, 620),
        versions: [{ version: 1, uploadedAt, outcome: 'verified', note: 'Reconciled against shift logs and outage register.', reviewedAt: verifiedAt }],
        measurement: { label: 'Available hours', value: c.hours[i], unit: 'h', periodHours },
        sortKey: Date.parse(capturedAt),
      }
    })
    evidence.push(...list)
    contractEvidence.set(c.id, list)
  }

  /* ── assign stable IDs in chronological order ── */
  evidence.sort((a, b) => a.sortKey - b.sortKey || (a.workOrderId ?? '').localeCompare(b.workOrderId ?? ''))
  const finalEvidence: EvidenceRecord[] = evidence.map(({ sortKey: _sortKey, ...rest }, i) => ({ id: `EV-${String(3001 + i)}`, ...rest }))
  const idOf = new Map<DraftEvidence, string>()
  evidence.forEach((e, i) => idOf.set(e, finalEvidence[i].id))

  const contracts: OutcomeContract[] = CONTRACT_SEEDS.map(({ hours: _hours, ...c }) => ({
    ...c,
    evidenceIds: contractEvidence.get(c.id)!.map((e) => idOf.get(e)!),
  }))

  exceptions.sort((a, b) => a.raisedOn.localeCompare(b.raisedOn))
  const finalExceptions: ServiceException[] = exceptions.map((e, i) => ({ id: `EX-${String(501 + i)}`, ...e }))

  workOrders.sort((a, b) => b.start.localeCompare(a.start) || a.id.localeCompare(b.id))

  return {
    regions: REGIONS,
    customers: CUSTOMERS,
    sites: SITES,
    vendors: VENDORS,
    crews: CREWS,
    workOrders,
    evidence: finalEvidence,
    exceptions: finalExceptions,
    contracts,
  }

  /* ── hero record: hand-authored for the demo narrative ── */
  function heroMilestones(): Milestone[] {
    return [
      { id: '', key: 'mobilise', name: 'Mobilised', planned: '2026-10-15', actual: '2026-10-15', state: 'done' },
      { id: '', key: 'access', name: 'Site access & permits', planned: '2026-10-16', actual: '2026-10-16', state: 'done' },
      { id: '', key: 'execute', name: 'Borescope inspection', planned: '2026-10-19', actual: '2026-10-19', state: 'done' },
      { id: '', key: 'quality', name: 'Remediation & quality check', planned: '2026-10-21', actual: '2026-10-22', state: 'done' },
      { id: '', key: 'report', name: 'Report & evidence', planned: '2026-10-24', actual: '2026-10-24', state: 'done' },
      { id: '', key: 'acknowledge', name: 'Customer acknowledgment', planned: '2026-10-28', state: 'current' },
    ]
  }

  function heroEvidence(): DraftEvidence[] {
    const r: RegionId = 'balikpapan'
    const mk = (e: Omit<DraftEvidence, 'workOrderId' | 'sortKey' | 'checksum'>): DraftEvidence => ({
      ...e,
      workOrderId: HERO_WORK_ORDER,
      checksum: `sha256:${hex(8)}…${hex(4)}`,
      sortKey: Date.parse(e.capturedAt),
    })
    return [
      mk({
        milestoneKey: 'mobilise', type: 'checklist', title: 'Mobilisation & toolbox-talk record', stage: 'acknowledged',
        capturedAt: stamp('2026-10-15', 7 * 60 + 40, r), uploadedAt: stamp('2026-10-15', 8 * 60 + 5, r), verifiedAt: stamp('2026-10-15', 13 * 60 + 20, r), acknowledgedAt: stamp('2026-10-16', 9 * 60 + 2, r),
        source: 'Field tablet · Crew K-01', verifier: 'Teguh Hidayat', sizeKb: 412, pages: 2,
        versions: [{ version: 1, uploadedAt: stamp('2026-10-15', 8 * 60 + 5, r), outcome: 'verified', note: 'Crew roster and signatures match permit holder list.', reviewedAt: stamp('2026-10-15', 13 * 60 + 20, r) }],
      }),
      mk({
        milestoneKey: 'access', type: 'permit', title: 'Permit to work PTW-CS2-1187', stage: 'acknowledged',
        capturedAt: stamp('2026-10-16', 6 * 60 + 55, r), uploadedAt: stamp('2026-10-16', 7 * 60 + 10, r), verifiedAt: stamp('2026-10-16', 9 * 60 + 45, r), acknowledgedAt: stamp('2026-10-16', 15 * 60 + 30, r),
        source: 'Site permit office scan', verifier: 'Teguh Hidayat', sizeKb: 860, pages: 3,
        versions: [{ version: 1, uploadedAt: stamp('2026-10-16', 7 * 60 + 10, r), outcome: 'verified', note: 'Permit number, validity window and isolation points confirmed.', reviewedAt: stamp('2026-10-16', 9 * 60 + 45, r) }],
      }),
      mk({
        milestoneKey: 'execute', type: 'photo-set', title: 'Borescope image set, stages 1 to 3 (48 images)', stage: 'verified',
        capturedAt: stamp('2026-10-19', 14 * 60 + 12, r), uploadedAt: stamp('2026-10-19', 16 * 60 + 40, r), verifiedAt: stamp('2026-10-20', 10 * 60 + 5, r),
        source: 'Borescope unit BS-07 via field tablet', verifier: 'Maya Anggraini', sizeKb: 186_400,
        versions: [{ version: 1, uploadedAt: stamp('2026-10-19', 16 * 60 + 40, r), outcome: 'verified', note: 'EXIF timestamps and asset tag GT-CS2-A verified.', reviewedAt: stamp('2026-10-20', 10 * 60 + 5, r) }],
      }),
      mk({
        milestoneKey: 'quality', type: 'measurement', title: 'Vibration & performance check after remediation', stage: 'verified',
        capturedAt: stamp('2026-10-22', 11 * 60 + 30, r), uploadedAt: stamp('2026-10-22', 12 * 60 + 2, r), verifiedAt: stamp('2026-10-22', 17 * 60 + 48, r),
        source: 'Condition-monitoring export', verifier: 'Maya Anggraini', sizeKb: 2_340,
        versions: [{ version: 1, uploadedAt: stamp('2026-10-22', 12 * 60 + 2, r), outcome: 'verified', note: 'Readings within OEM limits and sensor IDs match the asset register.', reviewedAt: stamp('2026-10-22', 17 * 60 + 48, r) }],
      }),
      mk({
        milestoneKey: 'report', type: 'service-report', title: 'Hot-section inspection report', stage: 'verified',
        capturedAt: stamp('2026-10-23', 15 * 60 + 10, r), uploadedAt: stamp('2026-10-24', 9 * 60 + 30, r), verifiedAt: stamp('2026-10-24', 16 * 60 + 15, r),
        source: 'Engineering report · Borneo Integrity Works', verifier: 'Rina Marlina', sizeKb: 5_820, pages: 14,
        versions: [
          { version: 1, uploadedAt: stamp('2026-10-23', 16 * 60 + 2, r), outcome: 'rejected', note: 'Missing signatory page for vendor inspector.', reviewedAt: stamp('2026-10-23', 18 * 60 + 40, r) },
          { version: 2, uploadedAt: stamp('2026-10-24', 9 * 60 + 30, r), outcome: 'verified', note: 'Signatures complete and findings match the image set.', reviewedAt: stamp('2026-10-24', 16 * 60 + 15, r) },
        ],
      }),
    ]
  }
}

const RESOLVED_TITLES: Record<ExceptionCategory, string> = {
  'Access & permits': 'Site access delayed pending permit sign-off',
  'Weather & sea state': 'Work suspended for weather',
  'Parts & materials': 'Spare part arrived after planned date',
  'Evidence quality': 'Evidence re-captured after verification check',
  'Scope change': 'Additional scope agreed with customer',
  'Safety stop': 'Precautionary safety stand-down',
}

