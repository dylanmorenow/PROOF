// Paid-on-Proof fee calculation (Independent Innovation Demo — fictional figures, not a live transaction).
import type { EvidenceRecord, OutcomeContract } from './types'

export interface LedgerResult {
  availableHours: number
  periodHours: number
  /** Verified availability, rounded to 0.1 percentage point as the contract specifies. */
  verifiedPct: number
  baselinePct: number
  improvementPts: number
  eligiblePts: number
  performanceFee: number
  adjustments: number
  fixedFee: number
  total: number
  verifiedRecords: number
  pendingRecords: number
}

const round1 = (n: number) => Math.round(n * 10) / 10

export function calculateLedger(contract: OutcomeContract, records: EvidenceRecord[]): LedgerResult {
  const counted = records.filter((r) => (r.stage === 'verified' || r.stage === 'acknowledged') && r.measurement)
  const availableHours = round1(counted.reduce((s, r) => s + r.measurement!.value, 0))
  const periodHours = counted.reduce((s, r) => s + (r.measurement!.periodHours ?? 0), 0)
  const verifiedPct = periodHours ? round1((availableHours / periodHours) * 100) : 0
  const improvementPts = round1(verifiedPct - contract.baselinePct)
  const eligiblePts = Math.min(Math.max(improvementPts, 0), contract.capPoints)
  const performanceFee = Math.round(eligiblePts * contract.ratePerPoint)
  const adjustments = contract.adjustments.reduce((s, a) => s + a.amount, 0)
  return {
    availableHours,
    periodHours,
    verifiedPct,
    baselinePct: contract.baselinePct,
    improvementPts,
    eligiblePts,
    performanceFee,
    adjustments,
    fixedFee: contract.fixedFee,
    total: contract.fixedFee + performanceFee + adjustments,
    verifiedRecords: counted.length,
    pendingRecords: records.length - counted.length,
  }
}
