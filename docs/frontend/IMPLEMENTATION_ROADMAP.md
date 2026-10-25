# Implementation Roadmap & Sprint Plan — AI-Powered Upskilling Platform

**Document Status:** Phased Engineering Plan (v2.0)  
**Role:** Senior Frontend Engineer & Scrum Lead  
**Execution Strategy:** 6-Phase Master Workflow Lifecycle Alignment  

---

## 1. Roadmap Overview & Master Workflow

```mermaid
graph TD
    subgraph P1["Phase 1: User Onboarding"]
        A1[Start: Visit Website] --> A2[Sign up / Login]
        A2 --> A3[Create Profile]
        A3 --> A4[Select Skill to Master]
        A4 --> A5[Enter Background & Preferences]
    end

    subgraph P2["Phase 2: Initial Knowledge Assessment"]
        B1[Start AI Diagnostic] --> B2[Ask 10 Adaptive Questions]
        B2 <-->|Repeat until 10 done| B3[Adapt Next Question]
        B2 --> B4[Cover 5 Knowledge Areas]
        B4 --> B5[Analyze Answers & Identify Gaps]
        B5 --> B6[Initial Skill Report]
    end

    subgraph P3["Phase 3: Personalized Roadmap Generation"]
        C1[AI Generates Roadmap] --> C2[Order Topics: Prerequisites to Advanced]
        C2 --> C3[Recommend Resources: Videos, Docs, Practice]
        C3 --> C4[Daily/Weekly Study Plan & Planner]
        C4 --> C5[Roadmap Dashboard]
    end

    subgraph P4["Phase 4: Learning & Adaptive Evaluation"]
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

    subgraph P5["Phase 5: Practical Skill Verification"]
        E1[Complete Practical Projects] --> E2[Connect GitHub & Submit]
        E2 --> E3[AI Project & Code Review]
        E3 --> E4[Final Skill Assessment]
        E4 --> E5{Skill Verified?}
        E5 -->|No| E6[Targeted Improvement & Reassessment]
        E6 --> E4
        E5 -->|Yes| E7[Verified Certificate & Badge]
    end

    subgraph P6["Phase 6: Career Development & Loop-Back"]
        F1[AI Resume & Portfolio Builder] --> F2[AI Mock Interviews & Scored Feedback]
        F2 --> F3[Job & Internship Matches]
        F3 --> F4[Continuous Skill Improvement]
        F4 --> F5[Choose Another Skill]
    end

    A5 --> B1
    B6 --> C1
    C5 --> D1
    D9 -->|All Topics Done| E1
    E7 --> F1
    F5 -.->|Amber Loop-Back| A4
```

---

## 2. Phase-by-Phase Implementation Specifications

### Phase 1: User Onboarding & Profile Setup
- **Routes:** `/`, `/login`, `/signup`, `/auth/callback`, `/onboarding`
- **Core Deliverables:**
  1. **Landing Page (`/`):** High-converting public view detailing platform value propositions, interactive preview, and direct CTA into `/signup`.
  2. **Auth Pages (`/login`, `/signup`):** Email/password and Google/GitHub OAuth with live client validation.
  3. **Multi-Step Onboarding Wizard (`/onboarding`):**
     - *Step 1 (Language & Persona):* Choose English, Hindi, or Hinglish; select learner persona (Career Seeker, Student, etc.).
     - *Step 2 (Skill Selection):* Curated technology tracks (Full-Stack, Backend, Cloud/DevOps, AI/ML).
     - *Step 3 (Background & Budget):* Known topics, self-reported weak areas, and daily study budget (hours/day).
- **Transitions:** Submitting onboarding automatically initializes the baseline state and transitions directly into `/assessment`.

---

### Phase 2: Initial Knowledge Assessment
- **Route:** `/assessment`
- **Core Deliverables:**
  1. **10-Question Sequential Diagnostic:**
     - Evaluates 5 dimensions: Prerequisites, Core Concepts, Theoretical Depth, Syntax/Implementation, and Practical Problem Solving.
     - Single-question focus with real-time feedback and dynamic difficulty adaptation.
  2. **Analysis Engine:** Calculates baseline mastery score and catalogs specific conceptual gaps.
  3. **Initial Skill Report:** Clear visual breakdown of Mastered Topics, Diagnostic Gaps, and Suggested Starting Level.
  4. **Animated AI Roadmap Generation Screen:** Clicking "Generate My Roadmap" displays transparent AI reasoning (pruning mastered prerequisites, inserting revision modules for weak topics, scheduling study blocks) before opening `/roadmap`.

---

### Phase 3: Personalized Roadmap Generation
- **Routes:** `/roadmap`, `/dashboard`
- **Core Deliverables:**
  1. **Topological Roadmap Canvas (`/roadmap`):**
     - Milestones ordered strictly from prerequisites to advanced topics.
     - Clear status chips: `Mastered`, `In-Progress`, `Revision Required`, `Locked`.
     - Transparent "Why this step" rationale flyouts.
  2. **Smart Study Planner:** Schedules topics based on the learner's daily/weekly time budget.
  3. **Student Command Center (`/dashboard`):** Prominently displays the Next Best Action, active habit streak, skill score rings, and quick learning launchers.

---

### Phase 4: Learning & Adaptive Evaluation
- **Route:** `/learn/:topicSlug`
- **Core Deliverables:**
  1. **Dedicated Study Workspace:** Clean tabs for Curated Resources (Documentation, Hand-picked Videos, Interactive Exercises).
  2. **In-Context AI Learning Assistant:**
     - Doubt-solving conversational panel available at all times.
     - Multi-language responses (English, Hindi, Hinglish).
     - Browser Web Speech voice input button.
  3. **Topic Assessment & The Remediation Loop:**
     - "Complete & Take Topic Quiz" evaluation button.
     - **Pass (>= 70%):** Mark topic completed -> Award XP & update habit streak -> Unlock next topic.
     - **Fail (< 70%):** Identify weak subtopics -> Suggest bite-sized remedial resources -> Dynamically attach Revision Module node to the roadmap -> Re-test learner until mastered.

---

### Phase 5: Practical Skill Verification
- **Route:** `/projects`
- **Core Deliverables:**
  1. **Capstone Projects Workspace:** Practical real-world project briefs aligned with the learner's track.
  2. **GitHub Submission:** Enter repository URL or link via GitHub OAuth.
  3. **AI Automated Code Review:** Instant static analysis covering code architecture, test coverage, code quality, and security best practices.
  4. **Verification & Badging:** Passing projects issue a cryptographically verifiable certificate and credential badge for resumes/LinkedIn.

---

### Phase 6: Career Development & Loop-Back
- **Route:** `/career`
- **Core Deliverables:**
  1. **AI Resume & Portfolio Builder:** Automatically highlights verified skills and completed capstone projects.
  2. **AI Mock Technical Interview Simulator:** Question-and-answer simulator with scoring and actionable feedback.
  3. **Job & Internship Matches:** Curated entry-level and mid-level opportunities matching verified skills.
  4. **"Choose Another Skill to Master" (Loop-Back):** Returns learner to Phase 1 (`Select skill to master`), allowing seamless multi-skill credential stacking.
