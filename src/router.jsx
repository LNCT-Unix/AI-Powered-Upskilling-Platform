import { createBrowserRouter } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import AssessmentPage from './pages/AssessmentPage';
import SkillGraphPage from './pages/SkillGraphPage';
import RoadmapPage from './pages/RoadmapPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import NotFoundPage from './pages/NotFoundPage';
import DashboardShell from './components/layout/DashboardShell';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallbackPage />,
  },
  {
    element: <DashboardShell />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/assessment',
        element: <AssessmentPage />,
      },
      {
        path: '/graph',
        element: <SkillGraphPage />,
      },
      {
        path: '/roadmap',
        element: <RoadmapPage />,
      },
      {
        path: '/analytics',
        element: <AnalyticsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
