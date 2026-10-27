import type { Crew, Customer, MilestoneKey, Region, Site, Vendor, EvidenceType } from './types'

// Candidate coordination nodes — proposed under Option B, not existing PT Energy facilities.
export const REGIONS: Region[] = [
  {
    id: 'batam',
    name: 'Batam',
    area: 'Riau Islands',
    timezone: 'WIB',
    utcOffset: 7,
    role: 'Western node · Riau Islands and Malacca Strait operations',
  },
  {
    id: 'surabaya',
    name: 'Surabaya',
    area: 'East Java',
    timezone: 'WIB',
    utcOffset: 7,
    role: 'Java node · power and gas-receiving assets',
  },
  {
    id: 'balikpapan',
    name: 'Balikpapan',
    area: 'East Kalimantan',
    timezone: 'WITA',
    utcOffset: 8,
    role: 'Central node · gas processing and compression',
  },
  {
    id: 'sorong',
    name: 'Sorong',
    area: 'Southwest Papua',
    timezone: 'WIT',
    utcOffset: 9,
    role: 'Eastern node · remote fuel and power sites',
  },
]

export const CUSTOMERS: Customer[] = [
  { id: 'mdp', name: 'Mahakam Delta Processing', short: 'MDP', sector: 'Gas processing', contact: 'Hendra Wijaya' },
  { id: 'rst', name: 'Riau Strait Terminals', short: 'RST', sector: 'Fuel terminals & storage', contact: 'Lina Kusuma' },
  { id: 'bcp', name: 'Brantas Coastal Power', short: 'BCP', sector: 'Power generation', contact: 'Arif Setiawan' },
]

export const SITES: Site[] = [
  { id: 's-rst-ta', name: 'Strait Terminal A', customerId: 'rst', regionId: 'batam' },
  { id: 's-rst-tf', name: 'Strait Tank Farm North', customerId: 'rst', regionId: 'batam' },
  { id: 's-mdp-fy', name: 'MDP Fabrication Yard', customerId: 'mdp', regionId: 'batam' },
  { id: 's-bcp-u1', name: 'Coastal Power Unit 1', customerId: 'bcp', regionId: 'surabaya' },
  { id: 's-bcp-ss', name: '150 kV Coastal Substation', customerId: 'bcp', regionId: 'surabaya' },
  { id: 's-mdp-grs', name: 'Gas Receiving Station East', customerId: 'mdp', regionId: 'surabaya' },
  { id: 's-rst-sd', name: 'Surabaya Distribution Depot', customerId: 'rst', regionId: 'surabaya' },
  { id: 's-mdp-cs2', name: 'Compressor Station CS-2', customerId: 'mdp', regionId: 'balikpapan' },
  { id: 's-mdp-tb', name: 'Gas Plant Train B', customerId: 'mdp', regionId: 'balikpapan' },
  { id: 's-bcp-pk', name: 'Balikpapan Peaking Plant', customerId: 'bcp', regionId: 'balikpapan' },
  { id: 's-rst-fd', name: 'Sorong Fuel Depot', customerId: 'rst', regionId: 'sorong' },
  { id: 's-mdp-gg', name: 'Western Papua Gathering Station', customerId: 'mdp', regionId: 'sorong' },
  { id: 's-bcp-dp', name: 'Sorong Diesel Plant', customerId: 'bcp', regionId: 'sorong' },
]

export const VENDORS: Vendor[] = [
  { id: 'v-kmt', name: 'Kepri Marine Technical', regionId: 'batam', specialty: 'Marine & mechanical', qualification: 'qualified', qualifiedSince: '2025-08-14' },
  { id: 'v-sgc', name: 'Selat Gauge & Calibration', regionId: 'batam', specialty: 'Instrumentation', qualification: 'conditional' },
  { id: 'v-ars', name: 'Arek Rotating Services', regionId: 'surabaya', specialty: 'Rotating equipment', qualification: 'qualified', qualifiedSince: '2025-05-02' },
  { id: 'v-jet', name: 'Jatim Electrical Testing', regionId: 'surabaya', specialty: 'Electrical testing', qualification: 'qualified', qualifiedSince: '2026-01-19' },
  { id: 'v-biw', name: 'Borneo Integrity Works', regionId: 'balikpapan', specialty: 'Integrity & NDT', qualification: 'qualified', qualifiedSince: '2025-03-27' },
  { id: 'v-mhs', name: 'Mahakam Heavy Services', regionId: 'balikpapan', specialty: 'Heavy mechanical', qualification: 'conditional' },
  { id: 'v-cfs', name: 'Cendrawasih Field Services', regionId: 'sorong', specialty: 'Multi-discipline field service', qualification: 'conditional' },
  { id: 'v-kbt', name: 'Kepala Burung Technical', regionId: 'sorong', specialty: 'Electrical & instrumentation', qualification: 'in-review' },
]

export const CREWS: Crew[] = [
  { id: 'c-w1', name: 'Crew W-01', lead: 'Rizky Pratama', regionId: 'batam' },
  { id: 'c-w2', name: 'Crew W-02', lead: 'Nadia Putri', regionId: 'batam' },
  { id: 'c-j1', name: 'Crew J-01', lead: 'Agus Santoso', regionId: 'surabaya' },
  { id: 'c-j2', name: 'Crew J-02', lead: 'Sari Wulandari', regionId: 'surabaya' },
  { id: 'c-k1', name: 'Crew K-01', lead: 'Bayu Nugroho', regionId: 'balikpapan' },
  { id: 'c-k2', name: 'Crew K-02', lead: 'Fitri Handayani', regionId: 'balikpapan' },
  { id: 'c-p1', name: 'Crew P-01', lead: 'Yohanes Mandacan', regionId: 'sorong' },
]

export interface ServiceSpec {
  type: string
  execute: string
  executeEvidence: { type: EvidenceType; title: string }
  /** Typical working days for [mobilise, access, execute, quality, report, acknowledge]. */
  durations: [number, number, number, number, number, number]
}

export const SERVICES: ServiceSpec[] = [
  { type: 'Gas turbine borescope inspection', execute: 'Borescope inspection', executeEvidence: { type: 'photo-set', title: 'Borescope image set' }, durations: [2, 2, 6, 2, 3, 3] },
  { type: 'Compressor overhaul', execute: 'Overhaul works', executeEvidence: { type: 'measurement', title: 'Clearance & alignment sheet' }, durations: [3, 2, 16, 3, 3, 3] },
  { type: 'Pump-set overhaul', execute: 'Overhaul works', executeEvidence: { type: 'measurement', title: 'Pump performance test sheet' }, durations: [2, 2, 10, 2, 3, 3] },
  { type: 'Cathodic protection survey', execute: 'Potential survey', executeEvidence: { type: 'sensor-log', title: 'CP potential readings log' }, durations: [2, 2, 8, 2, 3, 3] },
  { type: 'Valve integrity testing', execute: 'Valve testing', executeEvidence: { type: 'measurement', title: 'Valve leak-test record' }, durations: [2, 2, 6, 2, 3, 3] },
  { type: 'Switchgear maintenance', execute: 'Switchgear servicing', executeEvidence: { type: 'measurement', title: 'Insulation resistance results' }, durations: [2, 3, 6, 2, 3, 3] },
  { type: 'Instrument calibration campaign', execute: 'Calibration', executeEvidence: { type: 'certificate', title: 'Calibration certificates' }, durations: [2, 2, 8, 2, 2, 3] },
  { type: 'Pipeline UT thickness survey', execute: 'UT survey', executeEvidence: { type: 'sensor-log', title: 'UT thickness dataset' }, durations: [2, 3, 10, 2, 3, 3] },
  { type: 'Fire & gas system test', execute: 'Function testing', executeEvidence: { type: 'measurement', title: 'Detector function-test record' }, durations: [2, 2, 4, 2, 2, 3] },
  { type: 'Storage tank inspection', execute: 'Tank inspection', executeEvidence: { type: 'photo-set', title: 'Shell & floor inspection photos' }, durations: [3, 3, 12, 2, 4, 3] },
]

export const MILESTONE_KEYS: MilestoneKey[] = ['mobilise', 'access', 'execute', 'quality', 'report', 'acknowledge']

export const MILESTONE_LABELS: Record<MilestoneKey, string> = {
  mobilise: 'Mobilised',
  access: 'Site access & permits',
  execute: 'Execution',
  quality: 'Quality check',
  report: 'Report & evidence',
  acknowledge: 'Customer acknowledgment',
}

export const MILESTONE_EVIDENCE: Partial<Record<MilestoneKey, { type: EvidenceType; title: string }>> = {
  mobilise: { type: 'checklist', title: 'Mobilisation & toolbox-talk record' },
  access: { type: 'permit', title: 'Permit to work' },
  quality: { type: 'qc-record', title: 'Quality check sheet' },
  report: { type: 'service-report', title: 'Service completion report' },
}

export const VERIFIERS = ['Maya Anggraini', 'Teguh Hidayat', 'Rina Marlina', 'Dimas Saputra']
