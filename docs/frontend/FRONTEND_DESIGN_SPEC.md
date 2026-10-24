# Frontend Design Specification & Design System — AI-Powered Upskilling Platform

**Document Status:** Approved Design System & UI/UX Specification (v1.0)  
**Role:** Product Designer & Design Systems Engineer  
**Aesthetic Persona:** *Deep Craft Learning* — A disciplined, high-density, career-focused technical workspace combining the editorial polish of Linear/Stripe with the pedagogical clarity of Duolingo/Coursera.

---

## 1. Design Philosophy & Visual Identity

### The Anti-Generic Manifesto
Most AI education dashboards look like generic marketing landing pages that collapse into card grids displaying empty metric counters. Our visual direction rejects these clichés:
- **No decorative "AI sparkles" or floating gradient orbs:** Intelligence is communicated through precision, clear explanations ("Why this was recommended"), and transparent reasoning.
- **No investor metrics on student screens:** Learners do not need an abstract "Overall Skill Score: 0%"; they need to know **what concept to study next**, **why they stumbled on yesterday's quiz**, and **how far they are from being job-ready**.
- **No emoji substitutes for iconography:** Consistent 2-pixel stroke geometry powered by `lucide-react`.
- **Editorial Typography & Visual Restraint:** Deep obsidian neutrals, warm parchment/stone surfaces, disciplined forest green accents denoting verified mastery, and intentional amber alerts denoting diagnostic review areas.

---

## 2. Design System Tokens

### 2.1 Color Palette
Our color system is built on high-contrast, accessible ratios (WCAG AAA for text, AA for UI elements) utilizing Tailwind CSS v4 `@theme` tokens:

```css
@theme {
  /* Brand Deep Neutral (Canvas & Contrast) */
  --color-canvas-base: #0b0f17;         /* Deep obsidian for dark highlights */
  --color-surface-50: #f8fafc;          /* App background (soft cool tint) */
  --color-surface-100: #f1f5f9;         /* Subdued card background */
  --color-surface-200: #e2e8f0;         /* Structural borders & dividers */
  --color-surface-300: #cbd5e1;         /* Inactive controls & placeholders */

  /* Text Hierarchy */
  --color-text-primary: #0f172a;        /* 900 slate: primary headlines and body */
  --color-text-secondary: #475569;      /* 600 slate: secondary descriptions */
  --color-text-tertiary: #94a3b8;       /* 400 slate: timestamps, metadata */

  /* Primary Accent: Deep Forest & Emerald (Skill Mastery, Verified Progress) */
  --color-primary-50: #ecfdf5;
  --color-primary-100: #d1fae5;
  --color-primary-600: #059669;
  --color-primary-700: #047857;         /* Primary buttons & brand anchor */
  --color-primary-800: #065f46;
  --color-primary-900: #064e3b;

  /* Secondary Accent: Technical Slate / Indigo (System & Architecture) */
  --color-accent-indigo-50: #eef2ff;
  --color-accent-indigo-600: #4f46e5;
  --color-accent-indigo-700: #4338ca;

  /* Diagnostic State Colors (Workflow-Driven) */
  --color-state-mastered: #059669;      /* Verified mastery (Green) */
  --color-state-learning: #2563eb;      /* In progress (Blue) */
  --color-state-revision: #d97706;      /* Weak subtopic / Remediation loop (Amber) */
  --color-state-locked: #94a3b8;        /* Prerequisite unfulfilled (Slate) */
  --color-state-danger: #dc2626;        /* Critical blocker / validation error (Red) */
}
```

### 2.2 Typography Scale
- **Font Family:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`.
- **Code / Monospace:** `JetBrains Mono`, `Fira Code`, `ui-monospace`.
- **Typographic Scale:**
  - `Display / Hero`: `40px` (2.5rem), line-height `1.15`, weight `800`, letter-spacing `-0.03em`.
  - `H1 (Page Title)`: `28px` (1.75rem), line-height `1.2`, weight `700`, letter-spacing `-0.02em`.
  - `H2 (Section Header)`: `20px` (1.25rem), line-height `1.3`, weight `600`, letter-spacing `-0.015em`.
  - `H3 (Card Title)`: `16px` (1.0rem), line-height `1.4`, weight `600`.
  - `Body Regular`: `14px` (0.875rem), line-height `1.5`, weight `400`.
  - `Body Medium`: `14px` (0.875rem), line-height `1.5`, weight `500`.
  - `Caption / Meta`: `12px` (0.75rem), line-height `1.4`, weight `500`, letter-spacing `0.01em`.
  - `Micro Tag`: `10px` (0.625rem), line-height `1.3`, weight `700`, letter-spacing `0.05em`, uppercase.

### 2.3 Spacing, Radius & Elevation
- **Grid Layout:** 8-point base grid (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`).
- **Border Radius:**
  - Control / Tag: `rounded-lg` (`8px`)
  - Standard Card: `rounded-xl` (`12px`)
  - Feature Container / Modal: `rounded-2xl` (`16px`)
  - Pill / Status Chip: `rounded-full` (`9999px`)
- **Shadows (Low Elevation, High Sharpness):**
  - Card standard: `0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)`
  - Card hover: `0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`
  - Popover / Dropdown: `0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -4px rgba(15, 23, 42, 0.08)`

---

## 3. Core Component Library Specifications

### 3.1 Buttons (`Button.jsx`)
- **Primary:** `bg-emerald-700 text-white hover:bg-emerald-800 active:scale-[0.99] font-medium text-sm px-4 py-2.5 rounded-xl shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 transition-all`
- **Secondary:** `bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 font-medium text-sm px-4 py-2.5 rounded-xl transition-all`
- **Outline / Ghost:** `border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm px-4 py-2.5 rounded-xl`
- **Action Highlight (Diagnostic / Assessment):** `bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm`
- **Disabled State:** `opacity-50 cursor-not-allowed pointer-events-none`

### 3.2 Badges & Status Chips (`Badge.jsx`)
- **Verified / Mastered:** `bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 font-medium` (with `CheckCircle2` icon).
- **Needs Revision / Gap:** `bg-amber-50 text-amber-800 border border-amber-200 text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 font-medium` (with `AlertCircle` icon).
- **In Progress:** `bg-blue-50 text-blue-800 border border-blue-200 text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 font-medium` (with `Clock` icon).
- **Prerequisite Locked:** `bg-slate-100 text-slate-600 border border-slate-200 text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 font-medium` (with `Lock` icon).

### 3.3 Cards & Content Containers (`Card.jsx`)
- **Structure:** Clean 1px solid border (`border-slate-200`) against crisp white or subtle stone backgrounds.
- **Visual Rhythm:** Generous internal padding (`p-5` to `p-6`), crisp divider lines (`divide-y divide-slate-100`), distinct header/body/footer partitions.
- **Interactive Variant:** Subtle upward translate on hover (`hover:-translate-y-0.5 transition-transform duration-200`) with high-contrast active borders.

### 3.4 Progress & Diagnostic Indicators
- **Linear Milestone Progress:** Multi-segment bar representing *Mastered* (Emerald), *In Revision* (Amber), *Remaining* (Slate 200).
- **Topological Node Indicator:** Connected nodes displaying progress ring and prerequisite links.

---

## 4. Screen-by-Screen UX & Layout Redesign

### 4.1 Public Landing Page (`/`)
- **Above the Fold:**
  - High-impact headline: *"Stop Guessing Your Skills. Get a Verified, Adaptive Roadmap to Job Readiness."*
  - Dual CTA: Primary `[Take 5-Min Diagnostic Test]` and Secondary `[Explore Sample Roadmap]`.
  - Replaces third-party Pinterest URL with the local optimized hero asset `src/assets/hero.png` framed inside a realistic product preview shell.
- **Workflow Journey Section (The 6 Phases):**
  - Interactive tabs showing the genuine learner progression: *1. Diagnose -> 2. Personalize -> 3. Learn -> 4. Adapt -> 5. Verify -> 6. Career*.
- **The Competitive Contrast Table:**
  - Directly reflects `TeamUnixFinalPPT.pptx` (Slide 8): compares our platform's adaptive diagnostic, verified proof, and habit consistency against Coursera, generic roadmaps, and unverified certifications.
- **Trust & Curriculum Section:**
  - Showcases curriculum tracks (Full-Stack, Data & AI, Cloud Systems) with sample "Why this is recommended" evidence tags.

### 4.2 Learner Dashboard (`/dashboard`)
- **Primary Hero Card — "Your Next Best Action":**
  - Bold, unambiguous call-to-action banner (e.g., *"Continue: Asynchronous JavaScript & Promises · Lesson 3 of 5 (Estimated 25 mins)"*).
  - Clear rationale badge: *"Closing gap identified in Diagnostic Question #4"*.
- **Weekly Habit & Milestone Tracker:**
  - Interactive calendar ribbon tracking study streak, committed time budget (e.g. `45m / day`), and milestones completed this week.
- **Skill Breakdown Matrix (Actionable vs. Vanity):**
  - Lists current target track topics categorized into:
    - *Mastered (Ready for verification)*
    - *In Progress (Active learning)*
    - *Needs Review (Weak subtopics flagged for re-test)*
- **Activity & Submission Feed:**
  - Searchable list of recent quiz submissions, git commits, and code review insights.

### 4.3 Diagnostic Assessment Experience (`/assessment`)
- **10-Question Sequential Stepper:**
  - Renders **one question at a time** (as mandated in `AI_Career_Roadmap_Workflow.pdf`).
  - Top indicator displays current question (`Question 4 of 10`) and knowledge area pill (`Category: Conceptual Understanding`).
  - Progress bar shows completed questions.
- **Adaptive Difficulty Feedback:**
  - Once answered, instant explanation reveals why this question matters to the overall roadmap.
- **Diagnostic Completion Screen (Initial Skill Report):**
  - Generates comprehensive visual report:
    - Baseline level tier (e.g., *Intermediate Level II*).
    - Identified strengths (topics skipped in roadmap).
    - Specific knowledge gaps with direct links to personalized roadmap chapters.
    - CTA: `[Generate My Tailored Roadmap]`.

### 4.4 Personalized Roadmap Canvas (`/roadmap`)
- **Topological Prerequisite Flow:**
  - Replaces the simple 4-item checkbox list with an ordered sequence of modules grouped by milestone.
  - Each item displays:
    - Module Title & Target Skill.
    - Estimated study time (e.g., `35 min`).
    - Format icon (Video, Documentation, Hands-on Exercise).
    - "Why this step" transparent rationale.
    - Action button (`Start Lesson`, `Retest Subtopic`, `Completed`).
- **Remediation Loop Visuals:**
  - When a topic assessment fails, an amber branch visually inserts a "Revision Module" before re-enabling the assessment button.

### 4.5 Skill Graph (`/graph`)
- **Interactive Prerequisite Map:**
  - Upgrades the static 5-box SVG into an interactive diagram with clear directed paths.
  - Nodes visually reflect status:
    - Green checkmark = Mastered prerequisite.
    - Pulsing blue ring = Currently active topic.
    - Slate lock = Blocked by upstream prerequisite.
  - Clicking any node opens a side drawer with topic overview, prerequisite list, and recommended resources.

### 4.6 Progress Analytics (`/analytics`)
- **Empirical Learning Evidence:**
  - Replaces placeholder zeroes with genuine learning progression charts.
  - Retention & Re-test Performance: shows score improvements after revision modules.
  - Weak Area Heatmap: categorizes mistakes by topic area (Syntax vs Theory vs Architecture).

---

## 5. Accessibility, Responsiveness & State Specifications

### 5.1 Mobile & Low-Bandwidth Considerations (PWA Alignment)
- **Fluid Breakpoints:** Mobile (`< 640px`), Tablet (`640px - 1024px`), Desktop (`> 1024px`).
- **Mobile Navigation:** Bottom navigation bar on mobile devices (`Dashboard`, `Roadmap`, `Assessment`, `Analytics`) providing thumb-zone access, transitioning to a fixed vertical sidebar on desktop (`lg:`).
- **Reduced Motion Support:** Respects `prefers-reduced-motion: reduce` by disabling smooth scrolling and transitions.
- **Lightweight Assets:** All SVG icons loaded inline via `lucide-react`. Zero heavy canvas dependencies.

### 5.2 Form States & Micro-Interactions
- **Loading State:** Skeleton loaders matching exact card geometry (`animate-pulse bg-slate-200`) rather than generic spinning circles.
- **Empty States:** Meaningful illustrations and clear next actions (e.g., *"No assessment history yet. Take your first 5-minute diagnostic to map your skills."*).
- **Error States:** Clear explanation of failure with retry buttons and fallback contact instructions.
