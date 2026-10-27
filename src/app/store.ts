import { create } from 'zustand'
import { buildDataset } from '@/data/build'
import { DEMO_NOW, DEMO_TODAY } from '@/data/dates'
import type { AccountScope, Dataset, EvidenceRecord, PeriodId, WorkOrder } from '@/data/types'

interface AppState {
  dataset: Dataset
  account: AccountScope
  period: PeriodId
  sidebarCollapsed: boolean
  mobileNavOpen: boolean
  lens: boolean
  aboutOpen: boolean
  setAccount: (a: AccountScope) => void
  setPeriod: (p: PeriodId) => void
  toggleSidebar: () => void
  setMobileNav: (open: boolean) => void
  toggleLens: () => void
  setAboutOpen: (open: boolean) => void
  /* simulated workflow actions — local state only */
  acknowledgeWorkOrder: (id: string) => void
  verifyEvidence: (id: string) => void
  requestRecapture: (id: string) => void
  acknowledgeEvidence: (id: string) => void
  resetDemo: () => void
}

const nowFor = (record: { capturedAt: string }) => {
  // Keep the record's own zone so local times stay correct for its region.
  const zone = record.capturedAt.slice(19)
  const wib = new Date(Date.parse(DEMO_NOW) + 7 * 3_600_000)
  const offset = Number(zone.slice(1, 3)) - 7
  const local = new Date(wib.getTime() + offset * 3_600_000)
  return `${local.toISOString().slice(0, 16)}:00${zone}`
}

const updateEvidence = (ds: Dataset, id: string, fn: (e: EvidenceRecord) => EvidenceRecord): Dataset => ({
  ...ds,
  evidence: ds.evidence.map((e) => (e.id === id ? fn(e) : e)),
})

const updateWorkOrder = (ds: Dataset, id: string, fn: (w: WorkOrder) => WorkOrder): Dataset => ({
  ...ds,
  workOrders: ds.workOrders.map((w) => (w.id === id ? fn(w) : w)),
})

export const useApp = create<AppState>((set) => ({
  dataset: buildDataset(),
  account: 'all',
  period: '30d',
  sidebarCollapsed: false,
  mobileNavOpen: false,
  lens: false,
  aboutOpen: false,
  setAccount: (account) => set({ account }),
  setPeriod: (period) => set({ period }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileNav: (mobileNavOpen) => set({ mobileNavOpen }),
  toggleLens: () => set((s) => ({ lens: !s.lens })),
  setAboutOpen: (aboutOpen) => set({ aboutOpen }),

  acknowledgeWorkOrder: (id) =>
    set((s) => {
      let ds = updateWorkOrder(s.dataset, id, (w) => ({
        ...w,
        status: 'completed',
        completedOn: DEMO_TODAY,
        milestones: w.milestones.map((m) => (m.key === 'acknowledge' ? { ...m, state: 'done', actual: DEMO_TODAY } : m)),
      }))
      for (const e of ds.evidence.filter((x) => x.workOrderId === id && x.stage === 'verified')) {
        ds = updateEvidence(ds, e.id, (r) => ({ ...r, stage: 'acknowledged', acknowledgedAt: nowFor(r) }))
      }
      return { dataset: ds }
    }),

  verifyEvidence: (id) =>
    set((s) => ({
      dataset: updateEvidence(s.dataset, id, (e) => {
        const at = nowFor(e)
        return {
          ...e,
          stage: 'verified',
          verifiedAt: at,
          verifier: 'You (demo)',
          versions: e.versions.map((v, i) => (i === e.versions.length - 1 ? { ...v, outcome: 'verified', reviewedAt: at, note: 'Verified in demo session.' } : v)),
        }
      }),
    })),

  requestRecapture: (id) =>
    set((s) => ({
      dataset: updateEvidence(s.dataset, id, (e) => ({
        ...e,
        stage: 'recapture',
        versions: e.versions.map((v, i) => (i === e.versions.length - 1 ? { ...v, outcome: 'rejected', reviewedAt: nowFor(e), note: 'Re-capture requested in demo session.' } : v)),
      })),
    })),

  acknowledgeEvidence: (id) =>
    set((s) => ({ dataset: updateEvidence(s.dataset, id, (e) => ({ ...e, stage: 'acknowledged', acknowledgedAt: nowFor(e) })) })),

  resetDemo: () => set({ dataset: buildDataset(), account: 'all', period: '30d' }),
}))
