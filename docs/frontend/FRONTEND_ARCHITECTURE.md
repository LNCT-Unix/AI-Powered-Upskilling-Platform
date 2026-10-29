# Frontend Architecture Specification — AI-Powered Upskilling Platform

**Document Status:** Architecture Plan & Verified Implementation (v2.2)  
**Role:** Senior Frontend Engineer & UX Architect  
**Target Stack:** React 19, Vite, React Router DOM, Tailwind CSS v4, Lucide React  
**Target Delivery:** Progressive Web App (PWA) + Cross-Platform Mobile Application (via Capacitor)  
**Reference Specification:** 6-Phase Master Website Workflow Diagram  

---

## 1. Architectural Principles

1. **Strict 6-Phase Lifecycle Alignment:** Every frontend module maps directly to one of the 6 phases defined in the master workflow diagram:
   - *Phase 1:* User Onboarding, Track Selection & Declared Skill Calibration
   - *Phase 2:* Initial Knowledge Diagnostic (IRT Rasch CAT) & Detailed Post-Test Report
   - *Phase 3:* Personalized Roadmap Generation & Milestone Planning
   - *Phase 4:* In-Depth Learning, AI Doubt Solving & Remediation Loops
   - *Phase 5:* Practical Project Verification & Automated Code Audits
   - *Phase 6:* Career Development (AI Resume Builder, Mock Interviews, Placement Hub)
2. **Cross-Platform Delivery (PWA & Capacitor):** Engineered from the ground up with mobile-first ergonomics, safe-area insets, and touch target minimums. Supports mobile token delivery with `X-Client-Platform: mobile`.
3. **Strict Gateway & Auth Boundary:** In-memory JWT access token management, HttpOnly refresh token cookies, silent token rotation, and robust offline fallback via `VITE_USE_MOCK_AUTH=true`.
4. **URL-First Navigation:** Deep linking and browser history are maintained across all platform routes via `react-router-dom`.
5. **Interactive Data Visualizations:** Custom D3 / SVG graph modeling for prerequisite competency trees, rendered in `InteractiveSkillGraph.jsx` with a clean 2-state visual filter: *Ready to Learn* vs *Locked*.
6. **Built-in Generative AI Chatbot:** Interactive landing page chatbot (`LandingChatbot.jsx`) answering learner curriculum and platform questions.

---

## 2. Directory Structure

```
web-app/src/
├── main.jsx                     # React entry point with StrictMode & global index.css
├── App.jsx                      # Root application provider wrapping AuthProvider & RouterProvider
├── router.jsx                   # React Router route registry across all platform views
├── index.css                    # Tailwind CSS v4 directives & @theme design tokens
│
├── assets/                      # Static local assets (hero.png)
│
├── components/                  # Domain-agnostic & domain-specific UI components
│   ├── ui/                      # Design system primitives (Button, Card, Logo, MetricCard, ScoreRing, SkillBar, Badge)
│   ├── layout/                  # Navigation frames (DashboardShell, Sidebar, MobileNav)
│   ├── auth/                    # Authentication forms (login.jsx, signup.jsx, forgotPass.jsx, AuthView.jsx)
│   ├── feature/                 # Feature-specific widgets (LandingChatbot.jsx, AskAIPanel.jsx)
│   └── graph/                   # Competency graph engine (InteractiveSkillGraph.jsx, graphModel.js)
│
├── pages/                       # Application route page components
│   ├── LandingPage.jsx          # [Phase 1] Public landing page with hero, workflow features & AI chatbot
│   ├── LoginPage.jsx            # [Phase 1] Sign-in page with email & OAuth options
│   ├── SignupPage.jsx           # [Phase 1] Registration page with client-side validation
│   ├── VerifyEmailPage.jsx      # [Phase 1] 6-digit OTP email verification screen
│   ├── AuthCallbackPage.jsx     # [Phase 1] Handles gateway OAuth2 code exchange
│   ├── AuthErrorPage.jsx        # [Phase 1] Graceful OAuth failure handler with error resolution
│   ├── OnboardingPage.jsx       # [Phase 1] 3-step wizard: Language/Persona -> Track Selection -> Declared Skills & Budget
│   ├── AssessmentPage.jsx       # [Phase 2] Adaptive CAT diagnostic runner & comprehensive post-test review
│   ├── DashboardPage.jsx        # [Phase 3/4] Student overview (Next best action, habit streak, stats)
│   ├── RoadmapPage.jsx          # [Phase 3] Visual topological roadmap view (Coming Soon)
│   ├── ProjectVerifyPage.jsx    # [Phase 5] GitHub repository submission & code review
│   ├── CareerHubPage.jsx        # [Phase 6] AI resume builder, mock interview simulator & job matches
│   ├── SkillGraphPage.jsx       # Interactive prerequisite knowledge graph view
│   ├── AnalyticsPage.jsx        # Learning hours, velocity, & skill retention metrics
│   └── NotFoundPage.jsx         # 404 fallback page
│
├── context/                     # Global state providers
│   ├── AuthContext.jsx          # Central user session, tokens, & authentication lifecycle
│   ├── authContextInstance.js   # React createContext instance
│   ├── LanguageContext.jsx      # Multi-language state (English, Hindi, Hinglish) & voice assistance
│   └── languageContextInstance.js # React createContext instance
│
├── hooks/                       # Custom utility hooks
│   ├── useAuth.js               # Convenience hook consuming AuthContext
│   └── useLanguage.js           # Multi-language localization hook
│
├── services/                    # API & network boundary
│   ├── api.js                   # Central fetch wrapper with Bearer token & cookie credentials
│   ├── authService.js           # Endpoints for email auth, OTP confirmation, password reset & OAuth
│   └── assessmentService.js     # Track discovery, pre-test calibration, adaptive quiz, & reports
│
└── data/                        # Local mock fixtures & curriculum data
    ├── chatbotQuestions.js      # Landing chatbot question trees and responses
    └── mockData.js              # Fallback curriculum and assessment data
```

---

## 3. Client-Side Routing Specification

| Route URL | Page Component | Access Level | Master Workflow Phase | Description |
|---|---|---|---|---|
| `/` | `LandingPage` | Public | Phase 1 | Landing page with value props, preview, and landing AI chatbot |
| `/login` | `LoginPage` | Public | Phase 1 | Sign in via Google, GitHub, or email/password |
| `/signup` | `SignupPage` | Public | Phase 1 | Registration with client validation and OTP trigger |
| `/verify-email` | `VerifyEmailPage` | Public | Phase 1 | 6-digit OTP verification screen |
| `/auth/callback` | `AuthCallbackPage` | Public | Phase 1 | OAuth2 code exchange receiver |
| `/auth/error` | `AuthErrorPage` | Public | Phase 1 | OAuth failure guidance and retry actions |
| `/onboarding` | `OnboardingPage` | Authenticated | Phase 1 | Multi-step wizard: Track Selection & Declared Skill Calibration |
| `/assessment` | `AssessmentPage` | Authenticated | Phase 2 | Adaptive CAT diagnostic & detailed post-test gap report |
| `/dashboard` | `DashboardPage` | Authenticated | Phase 3/4 | Command center: next action, streak, quick links |
| `/roadmap` | `RoadmapPage` | Authenticated | Phase 3/4 | Topological learning path (Coming Soon badge) |
| `/graph` | `SkillGraphPage` | Authenticated | Supporting | Interactive 56-skill prerequisite tree with 2-state filter |
| `/projects` | `ProjectVerifyPage` | Authenticated | Phase 5 | Practical capstones, GitHub review, certificates |
| `/career` | `CareerHubPage` | Authenticated | Phase 6 | AI resume builder, mock interviews, job matches |
| `/analytics` | `AnalyticsPage` | Authenticated | Supporting | Study hours, retention metrics, and velocity |
| `*` | `NotFoundPage` | Public | Fallback | 404 page |

---

## 4. Multi-Language & Accessibility Architecture

1. **Localization Engine (`LanguageContext.jsx`):**
   - Supports `en` (English), `hi` (Hindi), and `hinglish` (Conversational Indian English).
   - Stored in `localStorage` and toggled from the navigation bar.
2. **Mobile Navigation (`MobileNav.jsx`):**
   - Fixed bottom action bar on viewports `< 768px` providing one-thumb access to core routes.
3. **Interactive Graph UI:**
   - 2-State Visual Legend: **Ready to Learn** (green nodes) vs **Locked** (dashed grey nodes).
   - Cluster filtering across all 9 curriculum clusters (Foundations, Web APIs, Databases, Security, Architecture, Performance, Async, Quality, DevOps).
