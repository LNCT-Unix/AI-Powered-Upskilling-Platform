# Open Questions & Team Alignment Points

**Document Status:** Pending Decisions & Confirmation Log (v1.0)  
**Stakeholders:** Team Unix Frontend, Gateway/Auth Leads (Aadi, Riya), AI/Worker Leads, Product Mentor  

---

## 1. Authentication & Backend Gateway Integration

### Q1: CORS Configuration on Spring Boot Gateway
- **Context:** The frontend Vite development server operates on `http://localhost:5173`, while the Spring Boot backend runs on `http://localhost:8080`.
- **Question:** Has `APP_CORS_ALLOWED_ORIGINS` in `gateway/ai-upskilling-platform` been configured with `allowCredentials=true` to permit the browser to send and receive the `refresh_token` HttpOnly cookie across ports during local development?
- **Action Required:** Confirmation from Aadi regarding `SecurityConfig.java` CORS bean settings.

### Q2: Email/Password Authentication API Contract
- **Context:** `AUTHENTICATION_TEAM_CONTRACT.md` documents OAuth2 endpoints (`/oauth2/authorization/*`, `/api/auth/oauth2/exchange`, `/api/auth/me`), but specifies that Riya owns email registration and password hashing.
- **Question:** What are the exact endpoint paths, request payloads, and response formats for email registration (`/api/auth/register`?) and password login (`/api/auth/login`?)?
- **Action Required:** Riya to document the email authentication endpoints or provide a Swagger/OpenAPI definition.

### Q3: GitHub OAuth App Multi-Developer Localhost Configuration
- **Context:** GitHub OAuth applications only support a single Authorization Callback URL per client ID.
- **Question:** Does each frontend engineer need their own local GitHub OAuth application credentials, or will the team share a shared development client ID pointing to `http://localhost:8080/login/oauth2/code/github`?
- **Action Required:** Team Unix gateway lead to confirm local development credential distribution.

---

## 2. AI Worker & Data Architecture

### Q4: Diagnostic Questions & Dynamic Roadmap API Ownership
- **Context:** The repository root on `origin/main` contains an `ai-worker` directory alongside `gateway` and `web-app`.
- **Question:** Will the 10 diagnostic assessment questions and personalized roadmap nodes be served through the Spring Boot Gateway (e.g. `/api/v1/diagnostic/questions`, `/api/v1/roadmap/generate`) which proxies to `ai-worker`, or does the frontend communicate with an AI microservice directly?
- **Recommendation:** All frontend traffic should route exclusively through the gateway (`http://localhost:8080`) to ensure centralized authentication token validation and rate limiting.

### Q5: Roadmap Persistence Schema in PostgreSQL
- **Context:** When a learner completes a diagnostic test or toggles a roadmap milestone, this state must persist across sessions.
- **Question:** Has the database schema for learner roadmap nodes, topic mastery statuses, and assessment submission histories been finalized in `gateway/ai-upskilling-platform`?
- **Action Required:** Review `Sprint-1 docs/sprint-api-and-database-reference.pdf` with backend data lead.

---

## 3. Repository & Git Hygiene

### Q6: Submodule Gitlink Resolution (`AI-Powered-Upskilling-Platform`)
- **Context:** The tree contains an orphan gitlink `160000 commit 006ff93fe` named `AI-Powered-Upskilling-Platform` without a `.gitmodules` entry, created during initial frontend setup.
- **Question:** When the implementation phase begins, can we safely remove this orphan gitlink from the Git index (`git rm --cached AI-Powered-Upskilling-Platform`) so it does not confuse git clone operations or CI/CD pipelines?
- **Action Required:** Approval from repository administrator / team lead before staging index changes.

---

## 4. Product & Curriculum Decisions

### Q7: Initial Launch Skill Tracks for MVP
- **Context:** The platform supports personalized roadmaps for any skill, but MVP requires curated, high-quality assessment questions and vetted resources.
- **Question:** Which technology tracks should be prioritized for the Sprint 1–2 launch?
  - *Option A:* Full-Stack Web Development (JavaScript, React, Node.js, SQL).
  - *Option B:* Data Science & Machine Learning (Python, Pandas, SQL, Scikit-learn).
  - *Option C:* Both tracks with 10 diagnostic questions each.
- **Action Required:** Product alignment during next team standup.
