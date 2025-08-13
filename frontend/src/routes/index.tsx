import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy } from 'react';

const TendersPage = lazy(() => import('@/pages/TendersPage').then(m => ({ default: m.TendersPage })));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/tenders" replace />,
  },
  {
    path: '/tenders',
    element: <TendersPage />,
  },
  {
    path: '/t/:id',
    element: <TendersPage />,
  },
]);
