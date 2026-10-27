// Domain model for the PROOF Room prototype. All data is fictional.

export type ISODate = string // 'YYYY-MM-DD'
export type ISODateTime = string // 'YYYY-MM-DDTHH:mm:ss+07:00'

export type RegionId = 'batam' | 'surabaya' | 'balikpapan' | 'sorong'
export type CustomerId = 'mdp' | 'rst' | 'bcp'
export type AccountScope = CustomerId | 'all'
export type PeriodId = '30d' | '90d' | 'ytd'

export type TimeZoneLabel = 'WIB' | 'WITA' | 'WIT'

export interface Region {
  id: RegionId
  name: string
  area: string
  timezone: TimeZoneLabel
  utcOffset: number
  role: string
}

export interface Customer {
  id: CustomerId
  name: string
  short: string
  sector: string
  contact: string
}

export interface Site {
  id: string
  name: string
  customerId: CustomerId
  regionId: RegionId
}

export type QualificationStatus = 'qualified' | 'conditional' | 'in-review'

export interface Vendor {
  id: string
  name: string
  regionId: RegionId
  specialty: string
  qualification: QualificationStatus
  qualifiedSince?: ISODate
}

export interface Crew {
  id: string
  name: string
  lead: string
  regionId: RegionId
}

export type Priority = 'P1' | 'P2' | 'P3'

export type ActiveStatus = 'mobilizing' | 'in-progress' | 'awaiting-evidence' | 'pending-ack' | 'on-hold'
export type WorkOrderStatus = ActiveStatus | 'scheduled' | 'completed'

export type MilestoneKey = 'mobilise' | 'access' | 'execute' | 'quality' | 'report' | 'acknowledge'
export type MilestoneState = 'done' | 'current' | 'upcoming' | 'blocked'

export interface Milestone {
  id: string
  key: MilestoneKey
  name: string
  planned: ISODate
  actual?: ISODate
  state: MilestoneState
}

export interface WorkOrder {
  id: string
  title: string
  serviceType: string
  customerId: CustomerId
  siteId: string
  regionId: RegionId
  priority: Priority
  status: WorkOrderStatus
  crewId: string
  vendorId?: string
  start: ISODate
  due: ISODate
  milestones: Milestone[]
  /** Day the customer acknowledged completion (completed orders only). */
  completedOn?: ISODate
  holdReason?: string
}

export type EvidenceType =
  | 'checklist'
  | 'permit'
  | 'photo-set'
  | 'sensor-log'
  | 'measurement'
  | 'qc-record'
  | 'service-report'
  | 'availability-log'
  | 'certificate'

/** The Proof Chain: Captured → Submitted → Verified → Acknowledged (recapture = rejected at verification). */
export type ProofStage = 'captured' | 'submitted' | 'verified' | 'acknowledged' | 'recapture'

export interface EvidenceVersion {
  version: number
  uploadedAt: ISODateTime
  outcome: 'verified' | 'rejected' | 'pending'
  note: string
  reviewedAt?: ISODateTime
}

export interface EvidenceRecord {
  id: string
  /** Absent for contract monitoring records (linked via contractId). */
  workOrderId?: string
  milestoneKey?: MilestoneKey
  contractId?: string
  type: EvidenceType
  title: string
  stage: ProofStage
  capturedAt: ISODateTime
  uploadedAt?: ISODateTime
  verifiedAt?: ISODateTime
  acknowledgedAt?: ISODateTime
  source: string
  verifier?: string
  checksum: string
  sizeKb: number
  pages?: number
  versions: EvidenceVersion[]
  /** Optional measured value carried by the record (e.g. available hours). */
  measurement?: { label: string; value: number; unit: string; periodHours?: number }
}

export type ExceptionCategory =
  | 'Access & permits'
  | 'Weather & sea state'
  | 'Parts & materials'
  | 'Evidence quality'
  | 'Scope change'
  | 'Safety stop'

export interface ServiceException {
  id: string
  workOrderId: string
  title: string
  category: ExceptionCategory
  severity: 'high' | 'medium' | 'low'
  status: 'open' | 'resolved'
  raisedOn: ISODate
  resolvedOn?: ISODate
  owner: string
  needsCustomer: boolean
  detail: string
}

export interface OutcomeContract {
  id: string
  name: string
  customerId: CustomerId
  siteId: string
  regionId: RegionId
  metric: string
  period: string
  periodMonths: string[]
  baselinePct: number
  fixedFee: number
  ratePerPoint: number
  capPoints: number
  adjustments: { label: string; amount: number }[]
  approvalStage: 0 | 1 | 2 | 3
  evidenceIds: string[]
}

export interface Dataset {
  regions: Region[]
  customers: Customer[]
  sites: Site[]
  vendors: Vendor[]
  crews: Crew[]
  workOrders: WorkOrder[]
  evidence: EvidenceRecord[]
  exceptions: ServiceException[]
  contracts: OutcomeContract[]
}
