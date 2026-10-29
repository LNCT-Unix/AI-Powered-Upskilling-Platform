# Architectural Decisions & Team Alignment Log

> **Document Status:** Sprint 1 Review (All Prior Questions Resolved) & Sprint 2/3 Roadmap Log  
> **Stakeholders:** Team Unix Frontend, Gateway/Auth Leads, AI Worker Team, Product Mentor  
> **Last Updated:** October 2026  

---

## 📑 Table of Contents

1. [Sprint 1 Resolved Decisions (Q1 – Q7)](#1-sprint-1-resolved-decisions-q1--q7)
   - [Q1: CORS Configuration on Spring Boot Gateway](#q1-cors-configuration-on-spring-boot-gateway)
   - [Q2: Email/Password Authentication API Contract](#q2-emailpassword-authentication-api-contract)
   - [Q3: GitHub OAuth App Localhost Setup](#q3-github-oauth-app-localhost-setup)
   - [Q4: Diagnostic Questions & Dynamic Roadmap Ownership](#q4-diagnostic-questions--dynamic-roadmap-ownership)
   - [Q5: Roadmap & Assessment Persistence Schema](#q5-roadmap--assessment-persistence-schema)
   - [Q6: Submodule Gitlink Resolution](#q6-submodule-gitlink-resolution)
   - [Q7: Initial Launch Skill Tracks for MVP](#q7-initial-launch-skill-tracks-for-mvp)
2. [Active Sprint 2 / 3 Alignment Points](#2-active-sprint-2--3-alignment-points)
   - [Q8: Asynchronous Roadmap Generation & Queueing Architecture](#q8-asynchronous-roadmap-generation--queueing-architecture)
   - [Q9: Automated Capstone GitHub Auditing Pipeline](#q9-automated-capstone-github-auditing-pipeline)
   - [Q10: OpenRouter Model Routing & Cost Capping](#q10-openrouter-model-routing--cost-capping)

---

## 1. Sprint 1 Resolved Decisions (Q1 – Q7)

### Q1: CORS Configuration on Spring Boot Gateway
- **Status:** **RESOLVED**
- **Resolution:** Configured in `SecurityConfig.java` and `AuthProperties.java` with `allowCredentials=true` and `allowedOrigins=["http://localhost:5173", "http://127.0.0.1:5173"]`. The browser successfully transmits the secure, `HttpOnly` `refresh_token` cookie across ports during local development.

### Q2: Email/Password Authentication API Contract
- **Status:** **RESOLVED**
- **Resolution:** Fully implemented in `EmailAuthController.java` and `PasswordResetController.java`:
  - `POST /api/auth/register` (Accepts `{ fullName, email, password }`, sends 6-digit OTP via Gmail SMTP).
  - `POST /api/auth/email-verification/confirm` (alias `/api/auth/email-verification/verify-otp`).
  - `POST /api/auth/email-verification/resend`.
  - `POST /api/auth/login`.
  - `POST /api/auth/forgot-password`, `POST /api/auth/verify-reset-otp`, `POST /api/auth/reset-password`.

### Q3: GitHub OAuth App Localhost Setup
- **Status:** **RESOLVED**
- **Resolution:** Default developer credentials configured in `application.properties`:
  - Client ID: `Ov23li1uXQnIYi33lg5c`
  - Callback: `http://localhost:8080/login/oauth2/code/github`
  - Secret provided via environment variable `GITHUB_CLIENT_SECRET`.

### Q4: Diagnostic Questions & Dynamic Roadmap Ownership
- **Status:** **RESOLVED**
- **Resolution:** All client traffic routes exclusively through the Spring Boot Gateway (`/api/v1/assessments`). The gateway runs a 1-PL Rasch CAT engine with indexed anti-join item selection. The AI Worker (`ai-worker/`) is isolated behind the private `X-Internal-API-Key` boundary and called only for generative roadmap synthesis and candidate question drafting.

### Q5: Roadmap & Assessment Persistence Schema
- **Status:** **RESOLVED**
- **Resolution:** Implemented in PostgreSQL with composite performance indexes:
  - Tables: `tracks`, `skills`, `assessment_items`, `assessments`, `assessment_responses`, `assessment_skill_results`.
  - Composite indexes on `assessments(user_id, track_id, status)` and `assessment_items(track_id, status, difficulty)`.

### Q6: Submodule Gitlink Resolution
- **Status:** **RESOLVED**
- **Resolution:** Git index cleaned. The repository maintains a clean root without orphan submodules.

### Q7: Initial Launch Skill Tracks for MVP
- **Status:** **RESOLVED**
- **Resolution:** **Backend Engineering** (`backend-engineering`) launched as primary track with:
  - 56 atomic skills across 9 domain clusters.
  - 72 prerequisite edges validated on startup.
  - Calibrated question bank seeded in database with indexed candidate queries.
  - Pre-test declared skills calibration (`knownSkillSlugs`).

---

## 2. Active Sprint 2 / 3 Alignment Points

### Q8: Asynchronous Roadmap Generation & Queueing Architecture
- **Context:** When a learner finishes their diagnostic assessment, generating a full 4-phase roadmap involves an LLM synthesis call taking 3–6 seconds.
- **Decision Needed:** Should the Gateway initiate roadmap synthesis via an asynchronous Spring task (`@Async` with webhook) or publish an event to BullMQ/RabbitMQ for `ai-worker` to consume?
- **Current Recommendation:** Start with an HTTP POST from Gateway to `ai-worker/internal/roadmap/generate` with a processing status flag (`GENERATING` -> `READY`) stored on `roadmap` records in PostgreSQL.

### Q9: Automated Capstone GitHub Auditing Pipeline
- **Context:** Phase 5 requires automated verification of learner-submitted public GitHub repositories.
- **Decision Needed:** How should code quality and architectural checks be executed safely?
- **Current Recommendation:** Run stateless ephemeral Docker containers or GitHub Actions matrix to execute linting, unit tests, and security scans (Trivy), returning an audit JSON report to Gateway.

### Q10: OpenRouter Model Routing & Cost Capping
- **Context:** `ai-worker` supports multi-model LLM generation via OpenRouter.
- **Decision Needed:** Which models should be the default production choices?
- **Current Recommendation:** Use `google/gemini-2.0-flash` for high-throughput question generation (fast latency, lower token cost) and `anthropic/claude-3-haiku` as secondary fallback.
