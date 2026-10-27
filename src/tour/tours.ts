// Guided-tour scripts. Each step is one short paragraph: what this is and what it is for (see docs/CUSTOMIZING.md).
import { useApp } from '@/app/store'
import type { TourDef } from './types'

const closeMobileNav = () => useApp.getState().setMobileNav(false)

export const WELCOME: TourDef = {
  id: 'welcome',
  title: 'Welcome to PROOF Room',
  summary: 'The command center in one minute',
  duration: '1 min',
  steps: [
    {
      id: 'intro',
      route: '/',
      intro: true,
      title: "Hi, I'm PIP",
      body: 'Want a quick look around PROOF Room? It takes about a minute.',
    },
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
  title: 'Service tracking',
  summary: 'Follow one work order from plan to proof',
  duration: '1 min',
  steps: [],
}

export const LEDGER: TourDef = {
  id: 'ledger',
  title: 'Outcome Ledger',
  summary: 'The Paid-on-Proof concept',
  duration: '1 min',
  steps: [],
}

export const TOURS: TourDef[] = [WELCOME, SERVICE, LEDGER]
