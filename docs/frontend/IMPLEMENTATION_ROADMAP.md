# Implementation Roadmap & Sprint Plan — AI-Powered Upskilling Platform

**Document Status:** Phased Engineering Plan & Status Review (v2.1)  
**Role:** Senior Frontend Engineer & Scrum Lead  
**Execution Strategy:** 6-Phase Master Workflow Lifecycle Alignment  
**Current Milestone:** Sprint 1 Complete • Sprint 2 Active  

---

## 1. Roadmap Overview & Master Workflow

```mermaid
graph TD
    subgraph P1["Phase 1: User Onboarding (COMPLETE)"]
        A1[Start: Visit Website & Landing Chatbot] --> A2[Sign up / Login: OAuth2 or Email+OTP]
        A2 --> A3[Create Profile]
        A3 --> A4[Select Track: Backend Engineering]
        A4 --> A5[Declare Known Skills & Set Budget]
    end

    subgraph P2["Phase 2: Adaptive Knowledge Diagnostic (COMPLETE)"]
        B1[Launch Diagnostic Assessment] --> B2[Dynamic CAT Question 1]
        B2 <-->|Rasch 1-PL Staircase / 5-9 Items| B3[Dynamic Anti-Join Item Selection]
        B2 --> B4[Early Stop Criteria: Level Confirmed]
        B4 --> B5[Generate Diagnostic Report]
        B5 --> B6[Review Item Breakdown & Unlocked Skills]
    end

    subgraph P3["Phase 3: Personalized Roadmap Generation (IN PROGRESS)"]
        C1[Async Roadmap Generation Trigger] --> C2[Order Topological Gaps from Report]
        C2 --> C3[Recommend Resources: Videos, Docs, Practice]
        C3 --> C4[Daily/Weekly Study Plan & Planner]
        C4 --> C5[Roadmap Canvas View: Coming Soon]
    end

    subgraph P4["Phase 4: Learning & Adaptive Evaluation (PLANNED)"]
        D1[Learn Topic in Workspace] --> D2[AI Doubt Assistant & Resources]
        D1 --> D3[Complete Topic & Take Quiz]
        D3 --> D4{Topic Mastered >= 70%?}
        D4 -->|No| D5[Find Weak Subtopics & Suggest Easier Media]
        D5 --> D6[Add Revision Modules]
        D6 --> D7[Re-Test Learner]
        D7 --> D4
        D4 -->|Yes| D8[Mark Completed & Update Progress]
        D8 --> D9[Unlock Next Topic]
    end

    subgraph P5["Phase 5: Practical Skill Verification (PLANNED)"]
        E1[Complete Practical Projects] --> E2[Connect GitHub & Submit]
        E2 --> E3[AI Automated Code Review]
        E3 --> E4[Final Skill Assessment]
        E4 --> E5{Skill Verified?}
        E5 -->|No| E6[Targeted Improvement & Reassessment]
        E6 --> E4
        E5 -->|Yes| E7[Verified Certificate & Badge]
    end

    subgraph P6["Phase 6: Career Development & Loop-Back (PLANNED)"]
        F1[AI Resume & Portfolio Builder] --> F2[AI Mock Interviews & Scored Feedback]
        F2 --> F3[Job & Internship Matches]
        F3 --> F4[Continuous Skill Improvement]
        F4 --> F5[Choose Another Skill Track]
    end

    A5 --> B1
    B6 --> C1
    C5 --> D1
    D9 -->|All Topics Done| E1
    E7 --> F1
    F5 -.->|Loop-Back| A4
```

---

## 2. Phase-by-Phase Implementation Status

### Phase 1: User Onboarding & Profile Setup
- **Status:** **COMPLETED & VERIFIED**
- **Routes:** `/`, `/login`, `/signup`, `/verify-email`, `/auth/callback`, `/auth/error`, `/onboarding`
- **Delivered Capabilities:**
  1. **Landing Page (`/`):** Enterprise presentation with workflow stages, value comparisons, and interactive embedded AI chatbot (`LandingChatbot.jsx`).
  2. **Unified Authentication:** Google OIDC, GitHub OAuth2 with verified email fallback, and email/password signup with 6-digit OTP verification via Gmail SMTP.
  3. **Multi-Step Onboarding Wizard (`/onboarding`):** Language/persona selection, track discovery (`GET /api/v1/assessments/tracks`), and pre-test declared skills calibration (`GET /api/v1/assessments/tracks/{trackId}/skills`).

---

### Phase 2: Initial Knowledge Assessment
- **Status:** **COMPLETED & VERIFIED**
- **Route:** `/assessment`
- **Delivered Capabilities:**
  1. **Adaptive CAT Engine (Rasch 1-PL):** Staircase difficulty adjustments ($\pm 0.35$ logits), 5 to 9 questions, early termination on confirmed level.
  2. **Anti-Join Query Selection:** Indexed candidate selection with LEFT JOIN anti-join on sequential responses.
  3. **Pre-Test Calibration:** Declared skills passed via `knownSkillSlugs` to immediately mark mastered skills and adapt starting difficulty.
  4. **Comprehensive Post-Test Report (`/report`):** Itemized question review (question stem, learner choice, correct answer, tested skill) and `unlockedSkills` array for updating the skill graph.

---

### Phase 3: Personalized Roadmap Generation
- **Status:** **IN PROGRESS (Sprint 2 Delivery)**
- **Routes:** `/roadmap`, `/dashboard`
- **Current State:**
  - Route `/roadmap` is accessible with a "Soon" badge in the navigation sidebar.
  - Asynchronous LLM synthesis worker design in progress in `ai-worker/`.
  - Student Dashboard (`/dashboard`) displays current readiness metrics, streak counter, and action launchers.

---

### Phase 4: Learning & Adaptive Evaluation
- **Status:** **PLANNED (Sprint 3 Delivery)**
- **Route:** `/learn/:topicSlug`
- **Scope:** Dedicated study workspace, topic quizzes, and automated revision module injection upon test failure.

---

### Phase 5: Practical Skill Verification
- **Status:** **PLANNED (Sprint 3 Delivery)**
- **Route:** `/projects`
- **Scope:** Public GitHub repository submission, automated containerized code linting, unit testing, and cryptographically signed verification badges.

---

### Phase 6: Career Development & Loop-Back
- **Status:** **PLANNED (Sprint 4 Delivery)**
- **Route:** `/career`
- **Scope:** AI resume generator, mock interview simulator with scored feedback, and loop-back to new skill tracks.

---

## 3. Supporting Features Delivered

| Feature | Location | Status |
|---|---|---|
| **Interactive Skill Graph** | `web-app/src/pages/SkillGraphPage.jsx` | Completed: 56 skills, 9 clusters, 72 prerequisite edges, 2-state visual filter (Ready to Learn vs Locked). |
| **Progress Analytics** | `web-app/src/pages/AnalyticsPage.jsx` | Completed: Study hours, retention metrics, and velocity indicators. |
| **Landing AI Chatbot** | `web-app/src/components/feature/LandingChatbot.jsx` | Completed: Dynamic question tree and answers regarding curriculum and platform. |
| **Anti-Join Item Selection** | `gateway/.../repository/AssessmentItemRepository.java` | Completed: Indexed candidate anti-join selecting nearest-difficulty items. |
| **Low-Latency Graph Queries** | `gateway/.../service/AssessmentService.java` | Completed: Joined prerequisite pre-fetching eliminating $N+1$ queries. |
