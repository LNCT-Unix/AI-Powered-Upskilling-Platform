import { createBrowserRouter } from 'react-router-dom';
import LandingPage        from './pages/LandingPage';
import LoginPage          from './pages/LoginPage';
import SignupPage         from './pages/SignupPage';
import DashboardPage      from './pages/DashboardPage';
import AssessmentPage     from './pages/AssessmentPage';
import SkillGraphPage     from './pages/SkillGraphPage';
import RoadmapPage        from './pages/RoadmapPage';
import AnalyticsPage      from './pages/AnalyticsPage';
import OnboardingPage     from './pages/OnboardingPage';
import AuthCallbackPage   from './pages/AuthCallbackPage';
import AuthErrorPage      from './pages/AuthErrorPage';
import VerifyEmailPage    from './pages/VerifyEmailPage';
import NotFoundPage       from './pages/NotFoundPage';
import ProjectVerifyPage  from './pages/ProjectVerifyPage';
import CareerHubPage      from './pages/CareerHubPage';
import DashboardShell     from './components/layout/DashboardShell';
import ForgotPass         from './components/auth/forgotPass';

export const router = createBrowserRouter([
  { path: '/',               element: <LandingPage /> },
  { path: '/login',          element: <LoginPage /> },
  { path: '/signup',         element: <SignupPage /> },
  { path: '/forgot-password',element: <ForgotPass /> },
  { path: '/auth/callback',  element: <AuthCallbackPage /> },
  { path: '/auth/error',     element: <AuthErrorPage /> },
  { path: '/verify-email',   element: <VerifyEmailPage /> },
  { path: '/onboarding',     element: <OnboardingPage /> },
  {
    // In-app shell — wraps all dashboard pages
    element: <DashboardShell />,
    children: [
      { path: '/dashboard',  element: <DashboardPage /> },
      { path: '/assessment', element: <AssessmentPage /> },
      { path: '/graph',      element: <SkillGraphPage /> },
      { path: '/roadmap',    element: <RoadmapPage /> },
      { path: '/analytics',  element: <AnalyticsPage /> },
      { path: '/projects',   element: <ProjectVerifyPage /> },
      { path: '/career',     element: <CareerHubPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
