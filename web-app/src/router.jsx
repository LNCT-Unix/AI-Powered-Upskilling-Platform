import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import DashboardShell from './components/layout/DashboardShell';
import RouteErrorBoundary from './components/common/RouteErrorBoundary';

const pageFallback = (
  <div className="min-h-[40vh] grid place-items-center text-sm text-slate-500" role="status">
    Loading…
  </div>
);

const lazyPage = (load) => {
  const Page = lazy(load);
  return (
    <Suspense fallback={pageFallback}>
      <Page />
    </Suspense>
  );
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: lazyPage(() => import('./pages/LandingPage')),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/login',
    element: lazyPage(() => import('./pages/LoginPage')),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/signup',
    element: lazyPage(() => import('./pages/SignupPage')),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/forgot-password',
    element: lazyPage(() => import('./components/auth/forgotPass')),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/auth/callback',
    element: lazyPage(() => import('./pages/AuthCallbackPage')),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/auth/error',
    element: lazyPage(() => import('./pages/AuthErrorPage')),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/verify-email',
    element: lazyPage(() => import('./pages/VerifyEmailPage')),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/onboarding',
    element: lazyPage(() => import('./pages/OnboardingPage')),
    errorElement: <RouteErrorBoundary />,
  },
  {
    // In-app shell — wraps all dashboard pages
    element: <DashboardShell />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/dashboard',  element: lazyPage(() => import('./pages/DashboardPage')) },
      { path: '/assessment', element: lazyPage(() => import('./pages/AssessmentPage')) },
      { path: '/history',    element: lazyPage(() => import('./pages/TestHistoryPage')) },
      { path: '/assessment/history', element: lazyPage(() => import('./pages/TestHistoryPage')) },
      { path: '/graph',      element: lazyPage(() => import('./pages/SkillGraphPage')) },
      { path: '/roadmap',    element: lazyPage(() => import('./pages/RoadmapPage')) },
      { path: '/analytics',  element: lazyPage(() => import('./pages/AnalyticsPage')) },
      { path: '/projects',   element: lazyPage(() => import('./pages/ProjectVerifyPage')) },
      { path: '/career',     element: lazyPage(() => import('./pages/CareerHubPage')) },
    ],
  },
  {
    path: '*',
    element: lazyPage(() => import('./pages/NotFoundPage')),
    errorElement: <RouteErrorBoundary />,
  },
]);
