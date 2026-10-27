// Navigation config. Add or reorder pages here (see docs/CUSTOMIZING.md).
import { Activity, ChartLine, LayoutGrid, Scale, ShieldCheck, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  tour: string
  group: 'workspace' | 'innovation'
}

export const NAV: NavItem[] = [
  { to: '/', label: 'Overview', icon: LayoutGrid, tour: 'nav.overview', group: 'workspace' },
  { to: '/operations', label: 'Operations', icon: Activity, tour: 'nav.operations', group: 'workspace' },
  { to: '/evidence', label: 'Evidence', icon: ShieldCheck, tour: 'nav.evidence', group: 'workspace' },
  { to: '/performance', label: 'Performance', icon: ChartLine, tour: 'nav.performance', group: 'workspace' },
  { to: '/outcome-ledger', label: 'Outcome Ledger', icon: Scale, tour: 'nav.ledger', group: 'innovation' },
]

export function pageTitle(pathname: string): string {
  if (pathname.startsWith('/operations/')) return 'Service detail'
  return NAV.find((n) => n.to === pathname)?.label ?? 'Not found'
}
