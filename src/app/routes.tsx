import type { RouteObject } from 'react-router'
import { DashboardPage } from '../pages/DashboardPage/DashboardPage.tsx'
import { TransactionDetailRoute } from '../pages/DashboardPage/TransactionDetailRoute.tsx'
import { NotFoundPage } from '../pages/NotFoundPage/NotFoundPage.tsx'
import { AppLayout } from './AppLayout.tsx'
import { UnexpectedError } from './AppErrorBoundary.tsx'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <UnexpectedError />,
    children: [
      {
        path: '',
        element: <DashboardPage />,
        children: [{ path: 'transactions/:transactionId', element: <TransactionDetailRoute /> }],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
