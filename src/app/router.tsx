import { createBrowserRouter } from 'react-router'
import { OverviewPage } from '@/features/overview/OverviewPage'
import { NotFoundPage, PlaceholderPage } from '@/pages/PlaceholderPage'
import { AppShell } from './AppShell'

// BASE_URL is '/PROOF/' on GitHub Pages and '/' locally.
export const router = createBrowserRouter(
  [
    {
      element: <AppShell />,
      children: [
        { index: true, element: <OverviewPage /> },
        { path: 'operations', element: <PlaceholderPage title="Operations" /> },
        { path: 'operations/:id', element: <PlaceholderPage title="Service detail" /> },
        { path: 'evidence', element: <PlaceholderPage title="Evidence Center" /> },
        { path: 'performance', element: <PlaceholderPage title="Performance Analytics" /> },
        { path: 'outcome-ledger', element: <PlaceholderPage title="Outcome Ledger" /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
)
