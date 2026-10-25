# Project Documentation — AI-Powered Upskilling Platform

Welcome to the central documentation hub for the **AI-Powered Upskilling Platform With Progress Tracker** (Team Unix / EPAM Systems COE Program).

---

## 1. Documentation Map & Sitemap

| Document | Purpose | Audience | Status |
| :--- | :--- | :--- | :--- |
| **[`PRODUCT_OVERVIEW.md`](./PRODUCT_OVERVIEW.md)** | Product vision, 5 core user personas, value proposition, and key feature roadmap. | Everyone / Product | Baseline Spec |
| **[`api/GATEWAY_API_REFERENCE.md`](./api/GATEWAY_API_REFERENCE.md)** | Complete Gateway REST API documentation: OAuth2, session hydration, refresh, and adaptive assessment endpoints with sample fetch calls and JSON payloads. | Frontend & Backend Teams | Active Contract |
| **[`frontend/ASSESSMENT_INTEGRATION_GUIDE.md`](./frontend/ASSESSMENT_INTEGRATION_GUIDE.md)** | Step-by-step guide for wiring React assessment pages, adaptive engine state transitions, and custom hooks. | Frontend Engineers | Active Guide |
| **[`frontend/FRONTEND_ARCHITECTURE.md`](./frontend/FRONTEND_ARCHITECTURE.md)** | Modular frontend architecture, directory hierarchy, state boundaries, and tech stack. | Frontend Engineers | Implemented |
| **[`frontend/FRONTEND_DESIGN_SPEC.md`](./frontend/FRONTEND_DESIGN_SPEC.md)** | *Deep Craft Learning* design system tokens, color palettes, typography, and UI rules. | Frontend / Designers | Active System |
| **[`frontend/OAUTH_INTEGRATION.md`](./frontend/OAUTH_INTEGRATION.md)** | OAuth2 authorization flow, code exchange handshake, and token interceptor boundaries. | Frontend & Gateway | Active Contract |
| **[`frontend/IMPLEMENTATION_ROADMAP.md`](./frontend/IMPLEMENTATION_ROADMAP.md)** | Phased sprint plan and execution milestone details (Phase 1 through Phase 6). | Engineering Team | Reference |
| **[`frontend/FRONTEND_AUDIT.md`](./frontend/FRONTEND_AUDIT.md)** | Historical source code audit from initial prototype phase. | Engineering Team | Archive |
| **[`authentication/AUTHENTICATION_TEAM_CONTRACT.md`](./authentication/AUTHENTICATION_TEAM_CONTRACT.md)** | Teammate contracts for Spring Boot auth (Riya: email auth; Aadi: OAuth2 & tokens). | Backend & Gateway | v1.0 Implemented |
| **[`authentication/ENVIRONMENT.md`](./authentication/ENVIRONMENT.md)** | Environment variables, local setup instructions, Docker, and PostgreSQL configuration. | Full Team | Verified |

---

## 2. System Architecture & Component Roles

```
                                  +------------------------------+
                                  |     Web Client (React 19)   |
                                  |    Vite 8 • Tailwind v4      |
                                  |       port :5173             |
                                  +--------------+---------------+
                                                 |
                       HTTP / REST (/api/*)      | OAuth2 Redirects
                       Bearer Token & Cookies    |
                                                 v
                                  +------------------------------+
                                  |  Spring Boot Gateway Service |
                                  |    SecurityConfig • JWT Auth |
                                  |       port :8080             |
                                  +--------------+---------------+
                                                 |
                               +-----------------+-----------------+
                               |                                   |
                               v                                   v
                 +---------------------------+       +---------------------------+
                 |    PostgreSQL Database    |       |      AI Worker Service    |
                 |  Users • Assessments      |       |  Adaptive Engine • LLM    |
                 |  OAuth • Roadmaps         |       |      port :8000           |
                 +---------------------------+       +---------------------------+
```

---

## 3. Team Ownership Boundaries

| Domain | Owners | Primary Codebase Location | Responsibilities |
| :--- | :--- | :--- | :--- |
| **Frontend Application** | Team Unix Frontend | `web-app/` | React 19 UI, route navigation, client state, responsive layouts, diagnostic quizzes, roadmap visualization. |
| **Gateway & OAuth2 Backend** | Aadi & Riya | `gateway/ai-upskilling-platform/` | Spring Boot security, OAuth2 providers (Google/GitHub), JWT issuance, user database, CORS configuration. |
| **AI Assessment Engine** | AI Worker Team | `ai-worker/` & Gateway assessment module | Dynamic question generation, diagnostic scoring algorithms, personalized skill-gap analysis. |

---

## 4. Frontend Quick Links

- Application Source: [`web-app/`](../web-app/)
- Application Developer Guide: [`web-app/README.md`](../web-app/README.md)
- Auth Component Specs: [`web-app/src/components/auth/README.md`](../web-app/src/components/auth/README.md)
- Design System Tokens: [`web-app/src/index.css`](../web-app/src/index.css)
