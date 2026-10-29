# AI-Powered Upskilling Platform — Web Application Frontend

A modern, high-performance web application built with **React 19**, **Vite**, and **Tailwind CSS v4** for the EPAM Systems CoE AI-Powered Upskilling Platform.

---

## 1. Directory Structure

```
web-app/
├── index.html                   # HTML entry point with Inter font & viewport metadata
├── vite.config.js               # Vite configuration with @vitejs/plugin-react & tailwindcss
├── package.json                 # Pure ESM dependencies & scripts
├── public/                      # Static assets (favicons, vector icons)
└── src/
    ├── main.jsx                 # React root renderer with StrictMode & index.css
    ├── App.jsx                  # Top-level shell wrapping AuthProvider & RouterProvider
    ├── router.jsx               # React Router configuration with public & protected routes
    ├── index.css                # Tailwind CSS v4 setup & Deep Craft Learning @theme tokens
    │
    ├── assets/                  # Local optimized imagery (hero.png)
    │
    ├── components/              # Modular, reusable component library
    │   ├── ui/                  # Design primitives (Button, Card, Logo, MetricCard, ScoreRing, SkillBar, Badge)
    │   ├── layout/              # Shell frames (DashboardShell, Sidebar, MobileNav)
    │   ├── auth/                # Authentication forms (login.jsx, signup.jsx, forgotPass.jsx, AuthView.jsx)
    │   ├── feature/             # Feature widgets (LandingChatbot.jsx, AskAIPanel.jsx)
    │   └── graph/               # Prerequisite graph engine (InteractiveSkillGraph.jsx, graphModel.js)
    │
    ├── pages/                   # Application route views across all 6 phases
    │   ├── LandingPage.jsx      # [Phase 1] Public landing page with hero, comparison matrix & AI chatbot
    │   ├── LoginPage.jsx        # [Phase 1] Login page wrapper connecting UI with useAuth()
    │   ├── SignupPage.jsx       # [Phase 1] Registration page wrapper connecting UI with useAuth()
    │   ├── VerifyEmailPage.jsx  # [Phase 1] 6-digit OTP email verification screen
    │   ├── AuthCallbackPage.jsx # [Phase 1] Receives gateway OAuth2 redirect code and handles exchange
    │   ├── AuthErrorPage.jsx    # [Phase 1] Graceful OAuth failure handler with error resolution
    │   ├── OnboardingPage.jsx   # [Phase 1] Multi-step wizard: Track Picker -> Declared Skill Calibration -> Study Budget
    │   ├── AssessmentPage.jsx   # [Phase 2] Adaptive CAT diagnostic runner & comprehensive post-test review
    │   ├── DashboardPage.jsx    # [Phase 3/4] Student overview (Next best action, habit streak, stats)
    │   ├── RoadmapPage.jsx      # [Phase 3/4] Visual topological roadmap view (Coming Soon)
    │   ├── ProjectVerifyPage.jsx # [Phase 5] GitHub repository submission, code review & certificate
    │   ├── CareerHubPage.jsx    # [Phase 6] AI resume builder, mock interview simulator & job matches
    │   ├── SkillGraphPage.jsx   # Interactive prerequisite tree (56 skills, 9 clusters, 2-state visual filter)
    │   ├── AnalyticsPage.jsx    # Weekly study hours, habit streak, & speed metrics
    │   └── NotFoundPage.jsx     # Graceful 404 handler with return home navigation
    │
    ├── context/                 # Application state providers
    │   ├── AuthContext.jsx      # Central auth provider (user, tokens, session hydration, login/logout)
    │   ├── authContextInstance.js # React createContext instance
    │   ├── LanguageContext.jsx  # Multi-language localization (English, Hindi, Hinglish) & voice state
    │   └── languageContextInstance.js # React createContext instance
    │
    ├── hooks/                   # Custom React hooks
    │   ├── useAuth.js           # Lightweight hook consuming AuthContext
    │   └── useLanguage.js       # Multi-language localization hook
    │
    ├── services/                # Network & API client layer
    │   ├── api.js               # Centralized fetch wrapper with Bearer token & credential headers
    │   ├── authService.js       # Endpoints for email auth, OTP verification, password reset, and OAuth
    │   └── assessmentService.js # Track discovery, pre-test calibration, adaptive quiz, & reports
    │
    └── data/                    # Local mock dataset & fallback state
        ├── chatbotQuestions.js  # Landing chatbot question trees and responses
        └── mockData.js          # Fallback curriculum and assessment data
```

---

## 2. Application Route Map

| Path | View Component | Access | Workflow Phase | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `LandingPage` | Public | Phase 1 | Hero section, value propositions, feature preview, and embedded AI chatbot. |
| `/login` | `LoginPage` | Public | Phase 1 | Email/password sign-in and Google/GitHub OAuth entry points. |
| `/signup` | `SignupPage` | Public | Phase 1 | Registration with client validation and OTP verification trigger. |
| `/verify-email` | `VerifyEmailPage` | Public | Phase 1 | 6-digit email OTP verification screen. |
| `/auth/callback` | `AuthCallbackPage` | Public | Phase 1 | Intercepts `?code=` from backend OAuth2 redirect and exchanges for JWT. |
| `/auth/error` | `AuthErrorPage` | Public | Phase 1 | Actionable OAuth error screen with recovery instructions. |
| `/onboarding` | `OnboardingPage` | Authenticated | Phase 1 | Track picker, declared familiar skills checklist, and study budget. |
| `/assessment` | `AssessmentPage` | Authenticated | Phase 2 | 1-PL Rasch CAT diagnostic test and comprehensive post-test review report. |
| `/dashboard` | `DashboardPage` | Authenticated | Phase 3/4 | Student command center: next best action, habit streak, and quick launchers. |
| `/roadmap` | `RoadmapPage` | Authenticated | Phase 3/4 | Topological milestone roadmap (Coming Soon badge). |
| `/graph` | `SkillGraphPage` | Authenticated | Supporting | Interactive 56-skill prerequisite tree with 2-state visual filter (Ready to Learn vs Locked). |
| `/projects` | `ProjectVerifyPage` | Authenticated | Phase 5 | GitHub capstone project submission, code review & certificates. |
| `/career` | `CareerHubPage` | Authenticated | Phase 6 | AI resume builder, technical mock interview simulator, and career opportunities. |
| `/analytics` | `AnalyticsPage` | Authenticated | Supporting | Learning velocity, hours logged, and streak analytics. |
| `*` | `NotFoundPage` | Public | Fallback | 404 fallback page. |

---

## 3. Getting Started Locally

### Prerequisites
- Node.js `^20.0.0` or `^22.0.0`
- npm `^10.0.0`

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env`:
```env
# Gateway API base URL (Spring Boot backend)
VITE_API_BASE_URL=http://localhost:8080

# Set to true for frontend development without running the backend
VITE_USE_MOCK_AUTH=false
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 4. Authentication Modes

### Mode A: Mock Mode
When `VITE_USE_MOCK_AUTH=true`:
- Submitting login or signup simulates a successful session immediately.
- Pre-hydrates the application with mock user data.
- Allows testing UI, interactive graphs, and mock diagnostics without running PostgreSQL or Spring Boot.

### Mode B: Live Gateway Mode
When `VITE_USE_MOCK_AUTH=false`:
- Connects to Spring Boot Gateway at `http://localhost:8080`.
- Supports Google OIDC, GitHub OAuth2, and Email/Password with 6-digit OTP verification via Gmail SMTP.
- Handles password reset OTP requests and verification.
- Access tokens are stored in-memory; refresh tokens are stored in secure HttpOnly cookies.

---

## 5. Development Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server on port `5173` with HMR. |
| `npm run build` | Builds optimized production assets into `dist/`. |
| `npm run lint` | Runs ESLint across all `.js` and `.jsx` files. |
| `npm run preview` | Previews the production build locally. |

---

## 6. Interactive Skill Graph & 2-State Visual Model

The skill graph engine (`InteractiveSkillGraph.jsx`) renders a 56-node Directed Acyclic Graph (DAG) for the Backend track across 9 domain clusters:
- **Ready to Learn (`unlocked`):** Green border and checkmark icon. Represents nodes that are either already mastered or have all prerequisite parent nodes mastered and are immediately actionable.
- **Locked (`locked`):** Dashed grey border and lock icon. Represents blocked nodes where prerequisites remain incomplete.
- **Interactive Controls:** Node selection opens a right-hand drawer showing skill difficulty, direct prerequisites, and unlocked downstream dependencies.
