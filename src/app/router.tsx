import { createBrowserRouter } from 'react-router'
import { OverviewPage } from '@/features/overview/OverviewPage'
import { NotFoundPage } from '@/pages/PlaceholderPage'
import { Gate } from './Gate'

// The Overview ships in the main bundle; other pages load on first visit.
// BASE_URL is '/PROOF/' on GitHub Pages and '/' locally.
export const router = createBrowserRouter(
  [
    {
      element: <Gate />,
      children: [
        { index: true, element: <OverviewPage /> },
        { path: 'operations', lazy: async () => ({ Component: (await import('@/features/operations/OperationsPage')).OperationsPage }) },
        { path: 'operations/:id', lazy: async () => ({ Component: (await import('@/features/operations/ServiceDetailPage')).ServiceDetailPage }) },
        { path: 'evidence', lazy: async () => ({ Component: (await import('@/features/evidence/EvidencePage')).EvidencePage }) },
        { path: 'performance', lazy: async () => ({ Component: (await import('@/features/performance/PerformancePage')).PerformancePage }) },
        { path: 'outcome-ledger', lazy: async () => ({ Component: (await import('@/features/ledger/LedgerPage')).LedgerPage }) },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
)
