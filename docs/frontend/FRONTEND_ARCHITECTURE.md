# Frontend Architecture Specification — AI-Powered Upskilling Platform

**Document Status:** Architecture Plan & Verified Implementation (v1.0)  
**Role:** Senior Frontend Engineer & UX Architect  
**Target Stack:** React 19, Vite 8, React Router DOM 7, Tailwind CSS v4, Lucide React  

---

## 1. Architectural Principles

1. **Modular Layering:** Organize code into focused, single-responsibility folders (`components/ui`, `components/layout`, `components/auth`, `pages`, `context`, `services`, `hooks`).
2. **Strict Boundary with Backend Services:** Isolate network requests, error parsing, and token storage inside `services/` and `context/`, shielding UI components from raw HTTP contracts.
3. **URL as the Single Source of Truth:** Use standard browser URLs (`react-router-dom`), enabling deep linking, browser history, and seamless OAuth2 redirect interception.
4. **Mock-First Resilience:** Support standalone local development via `VITE_USE_MOCK_AUTH=true` so frontend work never blocks on backend availability.

---

## 2. Implemented Directory Structure

The production codebase is organized into clear, cohesive architectural layers inside `web-app/src/`:

```
web-app/src/
├── main.jsx                     # React entry point with StrictMode & global index.css
├── App.jsx                      # Root application provider wrapping AuthProvider & RouterProvider
├── router.jsx                   # React Router route registry (public landing, auth, dashboard)
├── index.css                    # Tailwind CSS v4 directives & @theme design tokens
│
├── assets/                      # Static local assets (hero.png)
│
├── components/                  # Domain-agnostic & domain-specific UI components
│   ├── ui/                      # Design system primitives (Button, Card, Logo, MetricCard, ScoreRing, SkillBar)
│   ├── layout/                  # Navigation & layout frames (DashboardShell, Sidebar, MobileNav)
│   └── auth/                    # Dedicated authentication components (login.jsx, signup.jsx)
│
├── pages/                       # Application route page components
│   ├── LandingPage.jsx          # Public product landing page with hero & feature highlights
│   ├── LoginPage.jsx            # Sign-in page interacting with useAuth()
│   ├── SignupPage.jsx           # Registration page interacting with useAuth()
│   ├── AuthCallbackPage.jsx     # Handles /auth/callback OAuth2 code exchange
│   ├── DashboardPage.jsx        # Authenticated student command center
│   ├── AssessmentPage.jsx       # 10-question sequential adaptive diagnostic & gap report
│   ├── RoadmapPage.jsx          # Visual milestone roadmap with "Why this step" rationales
│   ├── SkillGraphPage.jsx       # Prerequisite knowledge graph & cluster mastery
│   ├── AnalyticsPage.jsx        # Learning hours, streak velocity, & habit metrics
│   └── NotFoundPage.jsx         # 404 fallback page
│
├── context/                     # Global state providers
│   ├── AuthContext.jsx          # Central auth state & session lifecycle manager
│   └── authContextInstance.js   # React createContext instance
│
├── hooks/                       # Custom utility hooks
│   └── useAuth.js               # Convenience hook consuming AuthContext
│
├── services/                    # API & network boundary
│   ├── api.js                   # Generic fetch client with Bearer tokens & credential forwarding
│   └── authService.js           # Auth endpoint methods (login, register, OAuth redirects, token exchange)
│
└── data/                        # Static and mock datasets
    └── mockData.js              # Comprehensive questions, roadmaps, and profile mock fixtures
```

---

## 3. Client-Side Routing Design

### Route Mapping Specification

| Route URL | Page Component | Access Level | Description |
|---|---|---|---|
| `/` | `LandingPage` | Public | Marketing landing page with hero, workflow, and CTA |
| `/login` | `LoginPage` | Public / Guest | Sign in via Google, GitHub, or email/password |
| `/signup` | `SignupPage` | Public / Guest | Registration form with instant client validation |
| `/auth/callback` | `AuthCallbackPage` | Public | Captures `?code=`, calls backend token exchange, redirects |
| `/dashboard` | `DashboardPage` | Authenticated | Learner home, next actions, habit streak, recent activity |
| `/assessment` | `AssessmentPage` | Authenticated | 10-question adaptive diagnostic assessment & gap report |
| `/roadmap` | `RoadmapPage` | Authenticated | Personalized topological learning path & resources |
| `/graph` | `SkillGraphPage` | Authenticated | Interactive prerequisite skill dependency map |
| `/analytics` | `AnalyticsPage` | Authenticated | Empirical learning progress and weak-area heatmap |
| `*` | `NotFoundPage` | Public | Standard 404 fallback with link back to dashboard |

---

## 4. State Management Strategy

### 1. Global Session State (`AuthContext.jsx`)
- **Managed State:**
  - `user`: `{ id, email, fullName, role }` or `null`
  - `isAuthenticated`: `boolean`
  - `isLoading`: `boolean` (initial session hydration)
- **Lifecycle:**
  - On mount, calls `/api/auth/me` with existing bearer token or calls `/api/auth/refresh` to restore session from the HTTP-only cookie.
  - Exposes `login(email, password)`, `register(details)`, `logout()`, `handleOAuthCallback(code)`.

### 2. Feature & Assessment State
- **Diagnostic Engine:** State is encapsulated with sequential question tracking, adaptive scoring, and dimensional breakdown across 5 engineering domains.
- **Roadmap Progress:** Visual topological milestones with transparent "Why this step" rationales and remediation re-test branches.
