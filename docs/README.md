# Project Documentation — AI-Powered Upskilling Platform

Welcome to the central documentation hub for the **AI-Powered Upskilling Platform With Progress Tracker** (Team Unix / EPAM Systems CoE Program).

---

## 1. Documentation Map & Sitemap

| Document | Purpose | Audience | Status |
| :--- | :--- | :--- | :--- |
| **[`context.md`](../context.md)** | Deep technical specification, psychometric formulas, DAG graph schemas, and invariants for AI agents and engineering leads. | Core Team & AI Assistants | Active Source of Truth |
| **[`PRODUCT_OVERVIEW.md`](./PRODUCT_OVERVIEW.md)** | Product vision, 5 core user personas, value proposition, and key feature roadmap across all 6 phases. | Everyone / Product | Baseline Spec |
| **[`OPEN_QUESTIONS.md`](./OPEN_QUESTIONS.md)** | Architectural decisions log, Sprint 1 resolution report, and Sprint 2/3 alignment topics. | Engineering Leads & Mentors | Sprint 1 Closed / Sprint 2 Active |
| **[`api/GATEWAY_API_REFERENCE.md`](./api/GATEWAY_API_REFERENCE.md)** | Complete Gateway REST API documentation: OAuth2, email registration, OTP verification, password reset, adaptive CAT assessment, tracks onboarding, and `/report` endpoint. | Frontend & Backend Teams | Active Contract |
| **[`frontend/ASSESSMENT_INTEGRATION_GUIDE.md`](./frontend/ASSESSMENT_INTEGRATION_GUIDE.md)** | Step-by-step guide for wiring React assessment pages, declared skills pre-test calibration, adaptive state transitions, and reports. | Frontend Engineers | Active Guide |
| **[`frontend/FRONTEND_ARCHITECTURE.md`](./frontend/FRONTEND_ARCHITECTURE.md)** | Modular frontend architecture, directory hierarchy, state boundaries, routing map, and tech stack. | Frontend Engineers | Implemented |
| **[`frontend/FRONTEND_DESIGN_SPEC.md`](./frontend/FRONTEND_DESIGN_SPEC.md)** | *Deep Craft Learning* design system tokens, color palettes, typography, UI rules, and 2-state graph visualization. | Frontend / Designers | Active System |
| **[`frontend/OAUTH_INTEGRATION.md`](./frontend/OAUTH_INTEGRATION.md)** | OAuth2 authorization flow, code exchange handshake, and token interceptor boundaries. | Frontend & Gateway | Active Contract |
| **[`frontend/IMPLEMENTATION_ROADMAP.md`](./frontend/IMPLEMENTATION_ROADMAP.md)** | Phased sprint plan and execution milestone details (Phase 1 through Phase 6). | Engineering Team | Reference |
| **[`frontend/FRONTEND_AUDIT.md`](./frontend/FRONTEND_AUDIT.md)** | Historical source code audit from initial prototype phase. | Engineering Team | Archive |
| **[`authentication/AUTHENTICATION_TEAM_CONTRACT.md`](./authentication/AUTHENTICATION_TEAM_CONTRACT.md)** | Teammate contracts for Spring Boot auth (Riya: email auth & OTP; Aadi: OAuth2 & tokens). | Backend & Gateway | v1.0 Implemented |
| **[`authentication/OAUTH_INTEGRATION_GUIDE.md`](./authentication/OAUTH_INTEGRATION_GUIDE.md)** | Full-stack OAuth2/OIDC integration guide, sequence diagrams, GitHub/Google setups, troubleshooting & error codes. | Full Team & Frontend | Active Guide |
| **[`authentication/ENVIRONMENT.md`](./authentication/ENVIRONMENT.md)** | Environment variables, local setup instructions, Gmail SMTP, and PostgreSQL configuration. | Full Team | Verified |

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
                                  |  SecurityConfig • JWT Auth   |
                                  |  Rasch CAT • Adaptive Engine |
                                  |       port :8080             |
                                  +--------------+---------------+
                                                 |
                               +-----------------+-----------------+
                               |                                   |
                               v                                   v
                 +---------------------------+       +---------------------------+
                 |    PostgreSQL Database    |       |      AI Worker Service    |
                 |  Users • Assessments      |       |  Adaptive Engine • LLM    |
                 |  OAuth • 56 Skills DAG    |       |       port :3001          |
                 +---------------------------+       +---------------------------+
```

---

## 3. Subsystem Documentation Quick Links

- **Backend Gateway Service:** [`gateway/README.md`](../gateway/README.md)
  - Java 21, Spring Boot 3.x, Item Response Theory (1-PL Rasch Model), Gmail SMTP OTP verification.
- **Frontend Web Application:** [`web-app/README.md`](../web-app/README.md)
  - React 19, Vite, Tailwind CSS v4, Lucide icons, Interactive Skill Graph, Landing Page AI Chatbot.
- **AI Worker Microservice:** [`ai-worker/README.md`](../ai-worker/README.md)
  - Node.js 20+, Express, OpenRouter multi-model LLM orchestration, `X-Internal-API-Key` boundary.
- **Mobile Client Architecture:** [`mobile-app/README.md`](../mobile-app/README.md)
  - `X-Client-Platform: mobile` header support, deep-link authentication, secure token storage.
- **System Context Knowledge Base:** [`context.md`](../context.md)
  - Master technical specification for AI agents and engineering leads.
