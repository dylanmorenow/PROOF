// Guided-tour scripts. Each step: What it is → Why it matters → What you can do (see docs/CUSTOMIZING.md).
import { useApp } from '@/app/store'
import type { TourDef } from './types'

const closeMobileNav = () => useApp.getState().setMobileNav(false)

export const WELCOME: TourDef = {
  id: 'welcome',
  title: 'Welcome to PROOF Room',
  summary: 'The command center in ten stops',
  duration: '90 s',
  steps: [
    {
      id: 'intro',
      route: '/',
      title: "Hi, I'm PIP.",
      what: 'Your PROOF Intelligence Partner. I will walk you through PROOF Room in about 90 seconds.',
      why: 'PROOF Room answers three questions: what is happening, is it meeting expectations, and what proves it.',
      action: 'Press Next, or use the arrow keys. Esc exits at any time.',
    },
    {
      id: 'hero',
      route: '/',
      target: 'overview.hero',
      placement: 'bottom-start',
      title: 'Your command center',
      what: 'A plain-language summary of your whole portfolio, written from live operational records.',
      why: 'You see the situation in one sentence before you read a single chart.',
      action: 'Switch customer account or reporting period in the header — every number follows.',
    },
    {
      id: 'active',
      route: '/',
      target: 'kpi.active',
      placement: 'bottom-start',
      title: 'Active operations',
      what: 'Every work order now mobilizing, in progress, awaiting evidence, awaiting your sign-off, or on hold.',
      why: 'The coloured bar shows where work is waiting — and who it is waiting on.',
      action: 'Select the tile to open the full service tracker.',
    },
    {
      id: 'otd',
      route: '/',
      target: 'kpi.otd',
      placement: 'bottom',
      title: 'On-time delivery',
      what: 'The share of milestones completed on or before their planned date in this period.',
      why: 'Milestone-level timing shows reliability early, long before a job is late overall.',
      action: 'Compare periods with 30D · 90D · YTD at the top right.',
    },
    {
      id: 'sla',
      route: '/',
      target: 'kpi.sla',
      placement: 'bottom',
      title: 'Operational performance',
      what: 'Service-level attainment: orders you acknowledged as complete by their contracted due date.',
      why: 'This is the promise in your contract, measured on closed and accepted work only.',
      action: 'The sparkline shows the last eight months; hover the label for the exact definition.',
    },
    {
      id: 'evidence',
      route: '/',
      target: 'kpi.evidence',
      placement: 'bottom',
      title: 'Evidence verification',
      what: 'Evidence checked against its source — site, timestamp, signatory, file integrity — within 48 hours of upload.',
      why: 'Uploaded is not verified. Only verified evidence supports a reported result.',
      action: 'Select the tile to review records in the Evidence Center.',
    },
    {
      id: 'exceptions',
      route: '/',
      target: 'kpi.exceptions',
      placement: 'bottom-end',
      title: 'Open exceptions',
      what: 'Deviations from plan that are still open: access, weather, parts, evidence quality, scope or safety.',
      why: 'Exceptions are reported, not hidden — and the ones that need your decision are counted separately.',
      action: 'Review them in “Needs attention” further down the page.',
    },
    {
      id: 'network',
      route: '/',
      target: 'overview.map',
      placement: 'right-start',
      interactive: true,
      title: 'Archipelago network',
      what: 'Four candidate coordination nodes proposed under Option B: Batam, Surabaya, Balikpapan and Sorong.',
      why: 'Regional coordination is how delivery stays reliable across thousands of kilometres of islands.',
      action: 'Try it: hover or select a node to see its regional picture.',
    },
    {
      id: 'sidebar',
      route: '/',
      target: 'nav.sidebar',
      placement: 'right-start',
      prepare: ({ isMobile }) => isMobile && useApp.getState().setMobileNav(true),
      cleanup: closeMobileNav,
      title: 'Navigate the workspace',
      what: 'Operations, Evidence and Performance hold the detail behind every number on this page.',
      why: 'The Outcome Ledger is kept separate: it demonstrates an independent Paid-on-Proof concept.',
      action: 'Turn on Strategy lens below to tag each module with the option it delivers.',
    },
    {
      id: 'next',
      route: '/',
      target: 'overview.attention',
      placement: 'left-start',
      interactive: true,
      title: 'Start with a work order',
      what: 'These items are waiting on you: completed services to acknowledge, and exceptions that need a decision.',
      why: 'Each one opens a full record with its milestones, evidence and history.',
      action: 'Open WO-26-0417 — a gas turbine inspection awaiting your acknowledgment.',
    },
  ],
}

export const SERVICE: TourDef = {
  id: 'service',
  title: 'Service tracking',
  summary: 'Follow one work order from plan to proof',
  duration: '75 s',
  steps: [],
}

export const LEDGER: TourDef = {
  id: 'ledger',
  title: 'Outcome Ledger',
  summary: 'The independent Paid-on-Proof concept',
  duration: '75 s',
  steps: [],
}

export const TOURS: TourDef[] = [WELCOME, SERVICE, LEDGER]
