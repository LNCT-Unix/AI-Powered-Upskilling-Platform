# AI Upskilling Platform — Redesign Audit & Architecture Plan

**Date:** October 25, 2026  
**Auditor:** Senior Product Designer & Frontend Architect  
**Workspace:** `web-app/`  
**Active Git Branch:** `new-frontend`  
**Target Design Direction:** Minimal, professional, light-themed, analytics-first with navy, slate, and indigo accents.

---

## 1. Executive Summary & Objective

The objective of this redesign is to elevate the AI Upskilling Platform into a high-trust, production-ready, analytics-first learning product for college students, job seekers, and working professionals. 

The previous implementation suffered from visual dissonance:
- Playful and distracting lime/yellow/amber neon gradients, weird asymmetrical "leaf" corner radii, and gratuitous hover tilts.
- Disjointed authentication screens styled in pitch-black night mode (`#0b1120`) while all other screens were on light canvas.
- Decorative cards lacking clear information density and visual hierarchy.
- Dashboard metrics that were either hardcoded to zero or not dynamically tied to user activity and diagnostic findings.

This redesign establishes a unified, elegant, light-themed design system using a disciplined palette of navy (`#0f172a`), slate (`#334155`, `#64748b`, `#f8fafc`), and indigo (`#4f46e5`), supported by semantic emerald for mastery and amber for revision.

---

## 2. Technology & Architecture Baseline

| Layer | Specification | Status |
| :--- | :--- | :--- |
| **Framework** | React 19 (`19.3.1`), `react-dom` (`19.3.1`) ESM | Verified |
| **Build Tooling** | Vite 8 (`8.3.4`) with `@vitejs/plugin-react` | Verified |
| **Styling** | Tailwind CSS v4 (`4.3.3`) via `@tailwindcss/vite` | Verified |
| **Routing** | `react-router-dom` v7 (`7.18.4`) with `createBrowserRouter` | Verified |
| **Iconography** | `lucide-react` (`1.61.0`) | Verified |
| **Linter** | ESLint 10 (`eslint.config.js`) | Baseline passes (0 errors) |
| **Production Build** | `vite build` | Baseline passes (1.05s, 0 errors) |
| **Backend Contracts** | Spring Boot Gateway at `http://localhost:8080` (`/api/auth/*`, `/api/v1/*`) | Resilient via `VITE_USE_MOCK_AUTH=true` |

---

## 3. Complete Route & Component Inventory

| Route | View Component | Shell | Access | Current Status & Issues | Planned Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`/`** | `LandingPage.jsx` | Standalone | Public | Cluttered with lime/yellow blobs, leaf cards, multi-color badges. | **Refactor**: Clean enterprise-grade hero, clear product value props, track previews, social proof, high-trust CTAs. |
| **`/login`** | `LoginPage.jsx` + `login.jsx` | Standalone | Public | Completely dark background (`#0b1120`), jarring mismatch with light app. | **Refactor**: Premium light-card layout, preserve all validation, password toggle, OAuth & error states. |
| **`/signup`** | `SignupPage.jsx` + `signup.jsx` | Standalone | Public | Dark background, same visual disconnect as login. | **Refactor**: Premium light-card layout, live validation, OAuth triggers. |
| **`/auth/callback`** | `AuthCallbackPage.jsx` | Standalone | Public | Basic card with green loader. | **Refine**: Crisp loading, success, and error feedback states with retry actions. |
| **`/onboarding`** | `OnboardingPage.jsx` | Standalone | Auth/Public | 3-step wizard with high-saturation cards. | **Refactor**: Stepper progress, clear typography, accessible track cards, study budget selector. |
| **`/dashboard`** | `DashboardPage.jsx` | `DashboardShell` | Auth | Zero metrics, leaf cards, weak hierarchy, unlinked to user session. | **Redesign First**: Analytics-first layout, readiness score, milestone tracker, recommended next action, activity search. |
| **`/assessment`** | `AssessmentPage.jsx` | `DashboardShell` | Auth | Functional 10-question test & gap report, but uses leaf cards and lime accents. | **Refine**: Distraction-free test taking, crisp option selector, comprehensive post-test gap report. |
| **`/roadmap`** | `RoadmapPage.jsx` | `DashboardShell` | Auth | Good topology and planner, but gradient leaf cards and heavy yellow tints. | **Refactor**: Clean timeline visualization, clear milestone nodes, rationale drawers ("Why this step"), study planner. |
| **`/graph`** | `SkillGraphPage.jsx` | `DashboardShell` | Auth | Static SVG tree with basic boxes. | **Refine**: Interactive, clean graph with hover states, status pills, and prerequisite legend. |
| **`/analytics`** | `AnalyticsPage.jsx` | `DashboardShell` | Auth | Basic repetition of cards with zero scores. | **Refactor**: Actionable analytics, dimension scores across 5 areas, learning velocity, and habit tracking. |
| **`*`** | `NotFoundPage.jsx` | Standalone | Fallback | Simple card. | **Refine**: Clean 404 screen with search and navigation home. |

---

## 4. Shared UI Components Inventory & Refactoring Plan

| Component | File Path | Current State | Planned Refactoring |
| :--- | :--- | :--- | :--- |
| **`Button`** | `src/components/ui/Button.jsx` | 6 loud gradients (`yellow`, `coral`, `sky`), 4 shapes (`leaf`, `squircle`, `pill`). | Refactor to professional tokens: `primary` (navy/slate-900), `secondary` (slate-100), `outline` (slate-300 border), `ghost`, `danger`. Uniform `rounded-lg`, visible focus ring, disabled states. |
| **`Card`** | `src/components/ui/Card.jsx` | Default lime/yellow gradient, leaf corners, glowing pseudo-elements. | Refactor to clean, crisp white surface (`bg-white`), subtle border (`border-slate-200/80`), gentle shadow (`shadow-xs`), `rounded-xl`. |
| **`MetricCard`** | `src/components/ui/MetricCard.jsx` | Multi-tint loud gradients, rotating icons, expanding progress bars. | Refactor to analytics-first KPI card: subtle icon container, bold tabular value, trend badge, context label. |
| **`ScoreRing`** | `src/components/ui/ScoreRing.jsx` | Fixed dark-green SVG circle with hardcoded score display. | Polish SVG dial with navy/indigo stroke, smooth stroke-dasharray animation, accessible ARIA attributes. |
| **`SkillBar`** | `src/components/ui/SkillBar.jsx` | Green progress bar. | Refine typography, slate-100 track, smooth transition, score percentage pill. |
| **`Badge`** *(New)* | `src/components/ui/Badge.jsx` | Did not exist (ad-hoc inline spans). | Create standardized badge component with semantic variants: `neutral`, `indigo`, `emerald`, `amber`, `rose`. |
| **`DashboardShell`** | `src/components/layout/DashboardShell.jsx` | Green topbar elements, sample notification alert, cluttered header. | Clean sticky header with brand, language switcher, notification trigger, user profile menu, and responsive layout. |
| **`Sidebar`** | `src/components/layout/Sidebar.jsx` | Green-900 active links, yellow help box. | Crisp navy/slate navigation, active indicator, workspace switcher, track summary. |
| **`MobileNav`** | `src/components/layout/MobileNav.jsx` | 5 bottom links with green highlights. | Ergonomic 44px+ tap targets, subtle active indicator, safe-area inset support. |

---

## 5. Baseline Test & Build Status

- **Build Check (`npm run build`):** PASSED. 0 errors, 1973 modules transformed.
- **Lint Check (`npm run lint`):** PASSED. 0 warnings, 0 errors.
- **Auth Contract Resilience:** Verified. Local `.env` initialized with `VITE_USE_MOCK_AUTH=true` ensuring offline autonomy while preserving live gateway compatibility.

---

## 6. Staged Implementation Plan

- **Stage 1 (Phase 2):** Design System Tokens & Shared Shell
  - Update `src/index.css` with clean light-theme tokens (slate, navy, indigo, emerald, amber).
  - Refactor UI primitives (`Button.jsx`, `Card.jsx`, `MetricCard.jsx`, `ScoreRing.jsx`, `SkillBar.jsx`, new `Badge.jsx`).
  - Redesign `DashboardShell.jsx`, `Sidebar.jsx`, `MobileNav.jsx`, and `Logo.jsx`.
- **Stage 2 (Phase 3):** Representative Dashboard Redesign
  - Redesign `DashboardPage.jsx` into an analytics-first, action-oriented student command center.
  - Dynamically read diagnostic/onboarding state when available.
  - Verify responsive behavior across desktop, tablet, and mobile.
- **Stage 3 (Phase 4):** Redesign Remaining Pages
  - Auth screens (`login.jsx`, `signup.jsx`, `LoginPage.jsx`, `SignupPage.jsx`) -> Clean light theme.
  - `LandingPage.jsx` -> Minimal, premium enterprise presentation.
  - `OnboardingPage.jsx` -> 3-step guided wizard.
  - `AssessmentPage.jsx` -> Distraction-free adaptive diagnostic test and comprehensive gap report.
  - `RoadmapPage.jsx` -> Topological roadmap with interactive milestones, study planner, and rationales.
  - `SkillGraphPage.jsx` -> Interactive skill relationship map.
  - `AnalyticsPage.jsx` -> Learning velocity, skill radar, and progress tracker.
  - `AuthCallbackPage.jsx` and `NotFoundPage.jsx` -> Polished feedback states.
- **Stage 4 (Phase 6 & 7):** Responsive Verification, Accessibility Auditing & Build Validation
  - Run `npm run lint` and `npm run build`.
  - Validate across breakpoints (375px mobile, 768px tablet, 1280px desktop, 1600px wide).
  - Verify WCAG contrast, keyboard navigation, and zero regressions.
