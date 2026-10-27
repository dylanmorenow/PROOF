// Guided-tour scripts. Each step is one short paragraph: what this is and what it is for (see docs/CUSTOMIZING.md).
import { useApp } from '@/app/store'
import type { TourDef } from './types'

const closeMobileNav = () => useApp.getState().setMobileNav(false)

export const WELCOME: TourDef = {
  id: 'welcome',
  steps: [
    {
      id: 'hero',
      route: '/',
      target: 'overview.hero',
      placement: 'bottom-start',
      title: 'Your command center',
      body: 'A one line summary of all your operations right now, so you know how much is running and what needs you before opening any detail.',
    },
    {
      id: 'active',
      route: '/',
      target: 'kpi.active',
      placement: 'bottom-start',
      title: 'Active operations',
      body: 'Every job that is still open, from mobilizing to awaiting your sign-off. The colored bar shows where work is waiting, so you know what to follow up first.',
    },
    {
      id: 'otd',
      route: '/',
      target: 'kpi.otd',
      placement: 'bottom',
      title: 'On-time delivery',
      body: 'The share of milestones finished on or before plan this period. It shows how reliable delivery is long before a whole job runs late.',
    },
    {
      id: 'sla',
      route: '/',
      target: 'kpi.sla',
      placement: 'bottom',
      title: 'Operational performance',
      body: 'How many closed jobs met their contracted due date. This is the service promise in your contract, measured on finished work.',
    },
    {
      id: 'evidence',
      route: '/',
      target: 'kpi.evidence',
      placement: 'bottom',
      title: 'Evidence verified',
      body: 'Photos, reports and logs checked against their source within 48 hours. Only verified evidence backs a reported result, so this is the number you can trust.',
    },
    {
      id: 'exceptions',
      route: '/',
      target: 'kpi.exceptions',
      placement: 'bottom-end',
      title: 'Open exceptions',
      body: 'Anything that went off plan and is still unresolved, like site access, weather or parts. Problems surface early, and the ones that need your decision are counted separately.',
    },
    {
      id: 'network',
      route: '/',
      target: 'overview.map',
      placement: 'right-start',
      interactive: true,
      title: 'Regional network',
      body: 'Four proposed regional hubs that coordinate delivery across the islands. Hover or tap a hub to see its workload and performance.',
    },
    {
      id: 'sidebar',
      route: '/',
      target: 'nav.sidebar',
      placement: 'right-start',
      prepare: ({ isMobile }) => isMobile && useApp.getState().setMobileNav(true),
      cleanup: closeMobileNav,
      title: 'Navigation',
      body: 'Operations, Evidence and Performance hold the detail behind every number here. The Outcome Ledger shows the separate Paid-on-Proof concept.',
    },
    {
      id: 'next',
      route: '/',
      target: 'overview.attention',
      placement: 'right-start',
      interactive: true,
      title: 'Start with a work order',
      body: 'These items are waiting on you, completed jobs to acknowledge and issues that need a decision. Open one to see its milestones, evidence and history.',
    },
  ],
}

export const SERVICE: TourDef = {
  id: 'service',
  steps: [
    {
      id: 'table',
      route: '/operations',
      target: 'ops.table',
      placement: 'right-start',
      title: 'Service orders',
      body: 'Every active work order in one list with its region, team, due date and evidence. Select a row to preview it, or double click to open it.',
    },
    {
      id: 'status',
      route: '/operations',
      target: 'ops.status',
      placement: 'bottom-start',
      interactive: true,
      title: 'Status at a glance',
      body: 'Each status shows how many orders sit there, so you can jump straight to what is stuck or waiting on you.',
    },
    {
      id: 'preview',
      route: '/operations?wo=WO-26-0417',
      target: 'ops.preview',
      placement: 'left-start',
      title: 'A selected work order',
      body: 'The preview shows where this gas turbine inspection stands, milestone by milestone, without leaving the list.',
    },
    {
      id: 'timeline',
      route: '/operations/WO-26-0417',
      target: 'detail.timeline',
      placement: 'right-start',
      title: 'Milestone timeline',
      body: 'Every step from mobilisation to your acknowledgment, with real dates. A step that slipped shows in amber, so delays are never hidden.',
    },
    {
      id: 'facts',
      route: '/operations/WO-26-0417',
      target: 'detail.facts',
      placement: 'right-start',
      title: 'Regional delivery',
      body: 'Who is doing the work and where. Local vendors carry their qualification status, so you know the team on site has been checked.',
    },
    {
      id: 'evidence',
      route: '/operations/WO-26-0417',
      target: 'detail.evidence',
      placement: 'left-start',
      title: 'Supporting evidence',
      body: 'Permits, photos, readings and the final report behind this job. The chain on each record shows whether it is only uploaded or already verified.',
    },
    {
      id: 'exceptions',
      route: '/operations/WO-26-0417',
      target: 'detail.exceptions',
      placement: 'left-start',
      title: 'Exceptions and approvals',
      body: 'Anything that went off plan, with what was done about it. When the work is complete, Acknowledge service at the top closes it on your side.',
    },
    {
      id: 'back',
      route: '/',
      target: 'overview.hero',
      placement: 'bottom-start',
      title: 'Back to the overview',
      body: 'Every number on the command center rolls up from records like this one, so any figure can be traced back to its proof.',
    },
  ],
}

export const LEDGER: TourDef = {
  id: 'ledger',
  steps: [
    {
      id: 'concept',
      route: '/outcome-ledger',
      target: 'ledger.header',
      placement: 'bottom-start',
      title: 'Paid-on-Proof',
      body: 'A separate idea from the digital workspace. Part of the service fee is paid only for performance that has been verified. Every figure on this page is fictional.',
    },
    {
      id: 'baseline',
      route: '/outcome-ledger',
      target: 'ledger.baseline',
      placement: 'bottom-start',
      title: 'Contract baseline',
      body: 'The availability both sides agreed on as normal. Nothing beyond the fixed fee is earned until performance beats it.',
    },
    {
      id: 'verified',
      route: '/outcome-ledger',
      target: 'ledger.verified',
      placement: 'bottom-start',
      title: 'Measured performance',
      body: 'The availability actually achieved this quarter, counted only from monthly logs that passed verification.',
    },
    {
      id: 'improvement',
      route: '/outcome-ledger',
      target: 'ledger.improvement',
      placement: 'bottom',
      title: 'Verified improvement',
      body: 'The gap between baseline and verified result. Here it is 6 points, and only this proven gain can be paid for.',
    },
    {
      id: 'calc',
      route: '/outcome-ledger?run=1',
      target: 'ledger.calc',
      placement: 'right-start',
      title: 'Fee calculation',
      body: 'The fixed fee plus a set amount for each verified point, capped by contract. Six points at US$1,000 adds US$6,000.',
    },
    {
      id: 'approval',
      route: '/outcome-ledger?run=1',
      target: 'ledger.approval',
      placement: 'left-start',
      title: 'Approval required',
      body: 'Nothing is paid automatically. Your operations team reviews the result first, then commercial approval follows.',
    },
    {
      id: 'total',
      route: '/outcome-ledger?run=1',
      target: 'ledger.total',
      placement: 'top-start',
      title: 'Draft settlement',
      body: 'US$26,000 is a draft for review, not a live transaction. It only becomes final once both sides sign it off.',
    },
    {
      id: 'evidence',
      route: '/outcome-ledger?run=1',
      target: 'ledger.evidence',
      placement: 'left-start',
      title: 'Proof behind the number',
      body: 'The monthly availability logs behind the 96% result. Each one opens in the Evidence Center, so every dollar traces back to its proof.',
    },
  ],
}

export const DETAIL: TourDef = {
  id: 'detail',
  steps: [
    {
      id: 'header',
      target: 'detail.header',
      placement: 'bottom-start',
      title: 'This work order',
      body: 'The job at a glance with its status and priority. When the work is complete, Acknowledge service closes it on your side.',
    },
    {
      id: 'facts',
      target: 'detail.facts',
      placement: 'right-start',
      title: 'Regional delivery',
      body: 'Who is doing the work and where. Local vendors carry their qualification status, so you know the team on site has been checked.',
    },
    {
      id: 'timeline',
      target: 'detail.timeline',
      placement: 'right-start',
      title: 'Milestone timeline',
      body: 'Every step from mobilisation to your acknowledgment, with real dates. A step that slipped shows in amber, so delays are never hidden.',
    },
    {
      id: 'evidence',
      target: 'detail.evidence',
      placement: 'left-start',
      title: 'Supporting evidence',
      body: 'Permits, photos, readings and reports behind this job. The chain on each record shows whether it is only uploaded or already verified.',
    },
    {
      id: 'exceptions',
      target: 'detail.exceptions',
      placement: 'left-start',
      title: 'Exceptions',
      body: 'Anything that went off plan on this job and what was done about it, so nothing is hidden from you.',
    },
  ],
}

/** A verified report with two versions, so every evidence step has something to show. */
const EVIDENCE_RECORD = '/evidence?id=EV-3904'

export const EVIDENCE: TourDef = {
  id: 'evidence',
  steps: [
    {
      id: 'tabs',
      route: EVIDENCE_RECORD,
      target: 'ev.tabs',
      placement: 'bottom-start',
      interactive: true,
      title: 'Evidence by status',
      body: 'Every record sorted by where it stands, from waiting for verification to acknowledged by you. Each tab shows how many records sit there.',
    },
    {
      id: 'list',
      route: EVIDENCE_RECORD,
      target: 'ev.list',
      placement: 'right-start',
      title: 'Records',
      body: 'The newest records first, with the work order they belong to. The chain on the right shows how far each one has gone.',
    },
    {
      id: 'record',
      route: EVIDENCE_RECORD,
      target: 'ev.record',
      placement: 'left-start',
      title: 'One record, fully traced',
      body: 'When it was captured, uploaded, verified and acknowledged, who checked it, and a fingerprint of the file. Nothing is taken on trust.',
    },
    {
      id: 'actions',
      route: EVIDENCE_RECORD,
      target: 'ev.actions',
      placement: 'left-start',
      title: 'Your decision',
      body: 'Verified evidence waits for your acknowledgment. If something looks wrong, a record can be sent back for re-capture.',
    },
    {
      id: 'versions',
      route: EVIDENCE_RECORD,
      target: 'ev.versions',
      placement: 'left-end',
      title: 'Version history',
      body: 'Every upload is kept. This report was rejected once for a missing signature, then verified on its second version.',
    },
  ],
}

export const PERFORMANCE: TourDef = {
  id: 'performance',
  steps: [
    {
      id: 'kpis',
      route: '/performance',
      target: 'perf.kpis',
      placement: 'bottom-start',
      title: 'This period against the last',
      body: 'The three service measures for the chosen period, each compared with the period before, so you see the direction and not only the level.',
    },
    {
      id: 'trend',
      route: '/performance',
      target: 'perf.trend',
      placement: 'bottom',
      title: 'Monthly trend',
      body: 'On-time delivery and SLA month by month against the 90% target, so a dip is easy to spot.',
    },
    {
      id: 'regions',
      route: '/performance',
      target: 'perf.regions',
      placement: 'right-start',
      title: 'By region',
      body: 'How each regional hub performs side by side, including its open exceptions.',
    },
    {
      id: 'exceptions',
      route: '/performance',
      target: 'perf.exceptions',
      placement: 'left-start',
      title: 'Exceptions raised',
      body: 'What went off plan this period grouped by cause, so recurring problems stand out.',
    },
    {
      id: 'export',
      route: '/performance',
      target: 'perf.export',
      placement: 'bottom-end',
      title: 'Export report',
      body: 'Turns this page into a printable report you can save as PDF and share.',
    },
  ],
}

/** PIP starts the tour for the page you are on. */
export function tourFor(pathname: string): TourDef {
  if (pathname.startsWith('/operations/')) return DETAIL
  if (pathname.startsWith('/operations')) return SERVICE
  if (pathname.startsWith('/evidence')) return EVIDENCE
  if (pathname.startsWith('/performance')) return PERFORMANCE
  if (pathname.startsWith('/outcome-ledger')) return LEDGER
  return WELCOME
}
