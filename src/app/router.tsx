import { createBrowserRouter } from 'react-router'
import { EvidencePage } from '@/features/evidence/EvidencePage'
import { OperationsPage } from '@/features/operations/OperationsPage'
import { ServiceDetailPage } from '@/features/operations/ServiceDetailPage'
import { OverviewPage } from '@/features/overview/OverviewPage'
import { PerformancePage } from '@/features/performance/PerformancePage'
import { NotFoundPage, PlaceholderPage } from '@/pages/PlaceholderPage'
import { AppShell } from './AppShell'

// BASE_URL is '/PROOF/' on GitHub Pages and '/' locally.
export const router = createBrowserRouter(
  [
    {
      element: <AppShell />,
      children: [
        { index: true, element: <OverviewPage /> },
        { path: 'operations', element: <OperationsPage /> },
        { path: 'operations/:id', element: <ServiceDetailPage /> },
        { path: 'evidence', element: <EvidencePage /> },
        { path: 'performance', element: <PerformancePage /> },
        { path: 'outcome-ledger', element: <PlaceholderPage title="Outcome Ledger" /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
)
