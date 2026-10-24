# AI Engineering Guidelines — Team Unix Frontend

**Project:** AI-Powered Upskilling Platform With Progress Tracker  
**Organization:** EPAM Systems COE Program  
**Repository:** `https://github.com/LNCT-Unix/AI-Powered-Upskilling-Platform`  
**Active Branch:** `frontend`  

---

## 1. Project Context & Boundaries

1. **Dedicated Workspace:** Work exclusively within `C:\Users\ashut\EPAM\UNIX\AI-path-finder` and the currently checked-out `frontend` branch. The frontend application resides inside `web-app/`.
2. **Project Isolation:** This project is strictly separated from any external applications. Never import, reference, or cross-contaminate code, configurations, or credentials.
3. **Authentication Boundary:** Teammates Riya (email auth) and Aadi (OAuth2 & tokens) own the Spring Boot backend authentication service (`gateway/ai-upskilling-platform`). The frontend must remain a consumer of `/oauth2/authorization/*`, `/api/auth/oauth2/exchange`, `/api/auth/me`, `/api/auth/refresh`, and `/api/auth/logout`. Do not build competing auth backends or overwrite teammate contracts.
4. **Git Safety Directives:**
   - Never run `git reset --hard`, `git clean -fd`, or force-push.
   - Never commit secrets, passwords, or OAuth credentials.

---

## 2. Engineering Conventions & Technology Stack

- **Framework:** React 19 (`react`, `react-dom` ^19.3.1).
- **Build System:** Vite 8 (`vite` ^8.3.4) with `@vitejs/plugin-react` (Oxc parser).
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`, `tailwindcss` ^4.3.3) utilizing `@theme` tokens in `src/styles/index.css`.
- **Icons:** `lucide-react` (stroke width 2px, accessible ARIA labels).
- **Routing:** `react-router-dom` (to be installed in Phase 2). Navigation must use real URL paths (`/`, `/dashboard`, `/assessment`, `/roadmap`, `/graph`, `/analytics`, `/auth/callback`).
- **Typography:** Google Fonts `Inter` (`400`, `500`, `600`, `700`, `800`).
- **Code Style:** Pure ESM JavaScript/JSX with standard naming:
  - PascalCase for React components (`Button.jsx`, `DashboardPage.jsx`).
  - camelCase for utility functions and custom hooks (`useAuth.js`, `api.js`).
  - kebab-case for assets and static files (`hero.png`).

---

## 3. Approved Implementation Sequence

All frontend enhancements must proceed in this exact phased order, with explicit user approval required before proceeding from one phase to the next:

1. **Phase 1: Environment & Setup Baseline**
   - Run `npm install` to create `node_modules`.
   - Add `.env.example` defining `VITE_API_BASE_URL=http://localhost:8080`.
   - Validate `npm run build` and `npm run lint`.
2. **Phase 2: Architectural Modularization & Routing**
   - Install `react-router-dom`.
   - Deconstruct monolithic `src/App.jsx` into `components/ui/`, `components/layout/`, and `pages/`.
   - Verify zero functional or visual regression.
3. **Phase 3: Design System Tokens & Visual Polish**
   - Implement the *Deep Craft Learning* design system.
   - Swap the third-party Pinterest URL to the local `src/assets/hero.png`.
   - Build accessible layouts and responsive mobile navigation.
4. **Phase 4: Core Learner Journey & Diagnostic Enhancement**
   - Implement the full 10-question sequential adaptive diagnostic covering all 5 knowledge dimensions.
   - Build the Initial Skill Report screen with categorized gap analysis.
5. **Phase 5: Personalized Roadmap & Progress Tracking**
   - Build topological roadmap canvas with "Why this step" transparent rationales.
   - Implement remediation loops (weak subtopic detection -> revision modules -> re-test).
6. **Phase 6: Gateway & OAuth2 Integration**
   - Wire `/auth/callback` code exchange with Spring Boot gateway.
   - Support mock mode (`VITE_USE_MOCK_AUTH=true`) when backend is offline.
