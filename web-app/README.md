# AI-Powered Upskilling Platform — Web Application Frontend

A modern, high-performance web application built with **React 19**, **Vite 8**, and **Tailwind CSS v4** for the EPAM Systems COE AI-Powered Upskilling Platform.

---

## 1. Directory Structure

```
web-app/
├── index.html                   # HTML entry point with Inter font & viewport metadata
├── vite.config.js               # Vite 8 configuration with @vitejs/plugin-react
├── package.json                 # Pure ESM dependencies & scripts
├── public/                      # Static assets (favicons, vector icons)
└── src/
    ├── main.jsx                 # React root renderer with StrictMode & index.css
    ├── App.jsx                  # Top-level shell wrapping AuthProvider & RouterProvider
    ├── router.jsx               # React Router configuration with public & dashboard routes
    ├── index.css                # Tailwind CSS v4 setup & Deep Craft Learning @theme tokens
    │
    ├── assets/                  # Local optimized imagery (hero.png)
    │
    ├── components/              # Modular, reusable component library
    │   ├── ui/                  # Design primitives (Button, Card, Logo, MetricCard, ScoreRing, SkillBar)
    │   ├── layout/              # Shell frames (DashboardShell, Sidebar, MobileNav)
    │   └── auth/                # Interactive authentication forms (login.jsx, signup.jsx)
    │
    ├── pages/                   # Application route views
    │   ├── LandingPage.jsx      # Public product landing page with hero & feature grid
    │   ├── LoginPage.jsx        # Login page wrapper connecting UI with useAuth()
    │   ├── SignupPage.jsx       # Registration page wrapper connecting UI with useAuth()
    │   ├── AuthCallbackPage.jsx # Receives gateway OAuth2 redirect code and handles exchange
    │   ├── DashboardPage.jsx    # Learner overview with stats, next action, & skill rings
    │   ├── AssessmentPage.jsx   # 10-question sequential adaptive diagnostic & gap report
    │   ├── RoadmapPage.jsx      # Topological milestone graph with "Why this step" rationales
    │   ├── SkillGraphPage.jsx   # Knowledge cluster prerequisite graph & cluster mastery
    │   ├── AnalyticsPage.jsx    # Weekly study hours, habit streak, & speed metrics
    │   └── NotFoundPage.jsx     # Graceful 404 handler with return home navigation
    │
    ├── context/                 # Application state providers
    │   ├── AuthContext.jsx      # Central auth provider (user, tokens, session hydration, login/logout)
    │   └── authContextInstance.js # React createContext instance
    │
    ├── hooks/                   # Custom React hooks
    │   └── useAuth.js           # Lightweight hook consuming AuthContext
    │
    ├── services/                # Network & API client layer
    │   ├── api.js               # Centralized fetch wrapper with Bearer token & credential headers
    │   └── authService.js       # Endpoints for email auth, OAuth redirects, and token exchange
    │
    └── data/                    # Local mock dataset & fallback state
        └── mockData.js          # Realistic assessment questions, roadmaps, and profile data
```

---

## 2. Application Routes

| Path | View Component | Access | Description |
| :--- | :--- | :--- | :--- |
| `/` | `LandingPage` | Public | Hero section, value propositions, feature preview, and CTA triggers. |
| `/login` | `LoginPage` | Public | Email/password sign-in and Google/GitHub OAuth entry points. |
| `/signup` | `SignupPage` | Public | Account registration form with live validation and OAuth triggers. |
| `/auth/callback` | `AuthCallbackPage` | Public | Intercepts `?code=` from backend OAuth2 redirect and exchanges for JWT. |
| `/dashboard` | `DashboardPage` | Authenticated | Next actionable learning step, active streak, skill score rings, and quick links. |
| `/assessment` | `AssessmentPage` | Authenticated | 10-question adaptive assessment across 5 knowledge dimensions + gap report. |
| `/roadmap` | `RoadmapPage` | Authenticated | Visual topological roadmap with milestones, rationales, and revision loops. |
| `/graph` | `SkillGraphPage` | Authenticated | Interactive prerequisite tree and domain cluster progress. |
| `/analytics` | `AnalyticsPage` | Authenticated | Learning velocity, hours logged, and streak analytics. |
| `*` | `NotFoundPage` | Public | 404 fallback page. |

---

## 3. Getting Started Locally

### Prerequisites
- Node.js `^20.0.0` or `^24.0.0`
- npm `^10.0.0` or `^11.0.0`

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Environment variables:
```env
# Gateway API base URL (Spring Boot backend)
VITE_API_BASE_URL=http://localhost:8080

# Set to true for frontend development without running the backend
VITE_USE_MOCK_AUTH=true
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 4. Authentication Modes

### Mode A: Mock Mode (Default)
When `VITE_USE_MOCK_AUTH=true`:
- Submitting the login or signup form instantly simulates a successful session.
- Pre-hydrates the application with mock user data (`Learner (Team Unix)`).
- Allows full UI, assessment, roadmap, and analytics testing without running PostgreSQL or Spring Boot.

### Mode B: Live Gateway Mode
When `VITE_USE_MOCK_AUTH=false`:
- Connects to the Spring Boot Gateway running on `http://localhost:8080`.
- OAuth redirects navigate to `http://localhost:8080/oauth2/authorization/{provider}`.
- Single-use authorization codes are exchanged via `POST /api/auth/oauth2/exchange`.
- Access tokens are kept securely in memory (`api.js`), and refresh tokens are handled via HttpOnly cookies.

---

## 5. Development Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the Vite local development server on port `5173` with HMR. |
| `npm run build` | Builds optimized production assets into `dist/`. |
| `npm run lint` | Runs ESLint across all `.js` and `.jsx` files. |
| `npm run preview` | Previews the production build locally. |
