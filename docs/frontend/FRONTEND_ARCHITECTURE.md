# Frontend Architecture Specification — AI-Powered Upskilling Platform

**Document Status:** Architecture Plan & Verified Implementation (v2.0)  
**Role:** Senior Frontend Engineer & UX Architect  
**Target Stack:** React 19, Vite 8, React Router DOM 7, Tailwind CSS v4, Lucide React  
**Reference Specification:** 6-Phase Master Website Workflow Diagram  

---

## 1. Architectural Principles

1. **Strict 6-Phase Lifecycle Alignment:** Every frontend module maps directly to one of the 6 phases defined in the master workflow diagram:
   - *Phase 1:* User Onboarding & Skill Background Setup
   - *Phase 2:* Initial Knowledge Diagnostic & Skill Report
   - *Phase 3:* Personalized Roadmap Generation & Study Plan
   - *Phase 4:* In-Depth Learning, AI Doubt Solving & Remediation Loops
   - *Phase 5:* Practical Project Verification & Certification
   - *Phase 6:* Career Development (Resume, Mock Interview, Job Matches) & Skill Stacking Loop
2. **Strict Gateway & Auth Boundary:** Network requests and tokens are isolated in `services/api.js` and `context/AuthContext.jsx`. The frontend remains an authorized consumer of Spring Boot Gateway endpoints (`/api/auth/*`, `/api/v1/*`), with resilient fallback to Mock Auth Mode (`VITE_USE_MOCK_AUTH=true`).
3. **URL-First Navigation:** Deep linking and browser history are maintained across all 12 platform routes via `react-router-dom` v7.
4. **Inclusive Accessibility:** Built-in multi-language localization (English, Hindi, Hinglish) and speech-to-text voice recognition for AI doubt solving.

---

## 2. Directory Structure

```
web-app/src/
├── main.jsx                     # React entry point with StrictMode & global index.css
├── App.jsx                      # Root application provider wrapping AuthProvider & RouterProvider
├── router.jsx                   # React Router route registry across all 6 phases
├── index.css                    # Tailwind CSS v4 directives & @theme design tokens (Deep Craft Learning)
│
├── assets/                      # Static local assets (hero.png)
│
├── components/                  # Domain-agnostic & domain-specific UI components
│   ├── ui/                      # Design system primitives (Button, Card, Logo, MetricCard, ScoreRing, SkillBar)
│   ├── layout/                  # Navigation frames (DashboardShell, Sidebar, MobileNav, LanguageVoiceSelector)
│   └── auth/                    # Dedicated authentication components (login.jsx, signup.jsx)
│
├── pages/                       # Application route page components
│   ├── LandingPage.jsx          # [Phase 1] Public landing page with hero & workflow features
│   ├── LoginPage.jsx            # [Phase 1] Sign-in page with email & OAuth options
│   ├── SignupPage.jsx           # [Phase 1] Registration page with client-side validation
│   ├── AuthCallbackPage.jsx     # [Phase 1] Handles gateway OAuth2 code exchange
│   ├── OnboardingPage.jsx       # [Phase 1] 3-step wizard: Language/Persona -> Skill Track -> Background & Study Budget
│   ├── AssessmentPage.jsx       # [Phase 2] 10-question adaptive diagnostic & Initial Skill Report
│   ├── RoadmapPage.jsx          # [Phase 3] Topological milestone roadmap & "Why this step" rationales
│   ├── DashboardPage.jsx        # [Phase 3/4] Student overview (Next best action, habit streak, stats)
│   ├── LearnWorkspacePage.jsx   # [Phase 4] Topic study workspace (Resource tabs, AI Doubt-Solver chat, Topic Quiz)
│   ├── ProjectVerifyPage.jsx    # [Phase 5] GitHub repository submission, AI code review & certificate
│   ├── CareerHubPage.jsx        # [Phase 6] AI resume builder, mock interview simulator & job matches
│   ├── SkillGraphPage.jsx       # Interactive prerequisite knowledge graph
│   ├── AnalyticsPage.jsx        # Learning hours, velocity, & retention metrics
│   └── NotFoundPage.jsx         # 404 fallback page
│
├── context/                     # Global state providers
│   ├── AuthContext.jsx          # Central user session, tokens, & authentication lifecycle
│   ├── authContextInstance.js   # React createContext instance
│   └── LanguageContext.jsx      # Multi-language state (English, Hindi, Hinglish) & voice assistance
│
├── hooks/                       # Custom utility hooks
│   ├── useAuth.js               # Convenience hook consuming AuthContext
│   ├── useSpeechRecognition.js  # Browser Web Speech API hook for voice-to-text input
│   └── useAdaptiveQuiz.js       # Adaptive diagnostic state machine hook
│
├── services/                    # API & network boundary
│   ├── api.js                   # Central fetch wrapper with Bearer token & cookie credentials
│   └── authService.js           # Endpoints for authentication, OAuth redirects, and token exchange
│
└── data/                        # Local mock fixtures & curriculum specifications
    └── mockData.js              # Comprehensive questions, roadmap nodes, resources, and profiles
```

---

## 3. Client-Side Routing Specification

| Route URL | Page Component | Access Level | Master Workflow Phase | Description |
|---|---|---|---|---|
| `/` | `LandingPage` | Public | Phase 1 | Public landing page with value proposition and CTA |
| `/login` | `LoginPage` | Public | Phase 1 | Sign in via Google, GitHub, or email/password |
| `/signup` | `SignupPage` | Public | Phase 1 | New user registration form |
| `/auth/callback` | `AuthCallbackPage` | Public | Phase 1 | OAuth2 code exchange receiver |
| `/onboarding` | `OnboardingPage` | Authenticated | Phase 1 | Multi-step wizard: Language, Skill Selection, Background |
| `/assessment` | `AssessmentPage` | Authenticated | Phase 2 | 10-question adaptive diagnostic & Initial Skill Report |
| `/dashboard` | `DashboardPage` | Authenticated | Phase 3/4 | Command center: next action, streak, quick links |
| `/roadmap` | `RoadmapPage` | Authenticated | Phase 3/4 | Topological learning path with revision branches |
| `/learn/:topicSlug` | `LearnWorkspacePage` | Authenticated | Phase 4 | Resource tabs, AI doubt solver, topic assessment |
| `/projects` | `ProjectVerifyPage` | Authenticated | Phase 5 | Practical capstones, GitHub review, certificates |
| `/career` | `CareerHubPage` | Authenticated | Phase 6 | AI resume builder, mock interviews, switch skill |
| `/graph` | `SkillGraphPage` | Authenticated | Supporting | Interactive knowledge prerequisite tree |
| `/analytics` | `AnalyticsPage` | Authenticated | Supporting | Study hours, retention metrics, and velocity |
| `*` | `NotFoundPage` | Public | Fallback | 404 page |

---

## 4. Multi-Language & Accessibility Architecture

1. **Localization Engine (`LanguageContext.jsx`):**
   - Supports `en` (English), `hi` (Hindi), and `hinglish` (Conversational Indian English).
   - Stored in `localStorage` and toggled from the navigation bar.
   - Dynamic prompt generation: passes the preferred language to AI learning assistants so doubt explanations are returned in Hinglish, Hindi, or English.
2. **Speech Recognition (`useSpeechRecognition.js`):**
   - Powered by standard browser `SpeechRecognition` / `webkitSpeechRecognition`.
   - Requires zero external dependencies.
   - Microphone icon inside the AI Doubt-Solver input box enables one-click voice queries.
3. **Mobile Navigation (`MobileNav.jsx`):**
   - Fixed bottom action bar on viewports `< 768px` providing one-thumb access to `/dashboard`, `/roadmap`, `/learn`, and `/career`.

---

## 5. The Remediation Loop Architecture (Phase 4)

```
                    +---------------------------+
                    |       Learn Topic         |
                    | (Docs, Videos, Exercises) |
                    +-------------+-------------+
                                  |
                                  v
                    +---------------------------+
                    |   Take Topic Assessment   |
                    +-------------+-------------+
                                  |
                    +-------------+-------------+
                    |  Score >= 70% (Mastered)? |
                    +-------------+-------------+
                           /             \
                   NO     /               \  YES
                         v                 v
          +-----------------------+   +-----------------------+
          |  Find Weak Subtopics  |   |  Mark Topic Completed |
          +-----------+-----------+   +-----------+-----------+
                      |                           |
                      v                           v
          +-----------------------+   +-----------------------+
          | Suggest Easier Media  |   |  Update Progress XP   |
          +-----------+-----------+   +-----------+-----------+
                      |                           |
                      v                           v
          +-----------------------+   +-----------------------+
          |  Attach Revision Node |   |   Unlock Next Topic   |
          +-----------+-----------+   +-----------------------+
                      |
                      v
          +-----------------------+
          |    Re-Test Learner    |
          +-----------------------+
```
