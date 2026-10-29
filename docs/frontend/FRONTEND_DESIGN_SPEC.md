# Frontend Design Specification & Design System — AI-Powered Upskilling Platform

**Document Status:** Approved Design System & UI/UX Specification (v2.0)  
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
  --color-state-ready: #16a34a;         /* Ready to learn / Unlocked (Emerald) */
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
- **Action Highlight (Diagnostic / Assessment):** `bg-indigo-600 text-white hover:bg-indigo-700 font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm`
- **Disabled State:** `opacity-50 cursor-not-allowed pointer-events-none`

### 3.2 Badges & Status Chips (`Badge.jsx`)
- **Ready to Learn / Mastered:** `bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 font-medium` (with `CheckCircle2` icon).
- **Needs Revision / Gap:** `bg-amber-50 text-amber-800 border border-amber-200 text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 font-medium` (with `AlertCircle` icon).
- **In Progress:** `bg-blue-50 text-blue-800 border border-blue-200 text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 font-medium` (with `Clock` icon).
- **Prerequisite Locked:** `bg-slate-100 text-slate-600 border border-slate-200 text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 font-medium` (with `Lock` icon).

### 3.3 Cards & Content Containers (`Card.jsx`)
- **Structure:** Clean 1px solid border (`border-slate-200`) against crisp white or subtle stone backgrounds.
- **Visual Rhythm:** Generous internal padding (`p-5` to `p-6`), crisp divider lines (`divide-y divide-slate-100`), distinct header/body/footer partitions.
- **Interactive Variant:** Subtle upward translate on hover (`hover:-translate-y-0.5 transition-transform duration-200`) with high-contrast active borders.

---

## 4. Screen-by-Screen UX & Layout Design

### 4.1 Public Landing Page (`/`)
- **Hero Section:**
  - High-impact headline: *"Stop Guessing Your Skills. Get a Verified, Adaptive Roadmap to Job Readiness."*
  - Dual CTA: Primary `[Take 5-Min Diagnostic Test]` and Secondary `[Explore Sample Roadmap]`.
  - Local hero graphic (`src/assets/hero.png`) framed in product preview shell.
- **Embedded Generative AI Chatbot (`LandingChatbot.jsx`):**
  - Interactive chatbot allowing prospective learners to query track competencies, diagnostic mechanics, and curriculum prerequisites.
- **The Competitive Contrast Table:**
  - Compares our adaptive psychometric diagnostic against standard non-adaptive platforms.

### 4.2 Learner Dashboard (`/dashboard`)
- **Next Best Action Card:** Action-oriented card indicating the immediate high-impact skill to study.
- **Weekly Habit & Milestone Tracker:** Streak tracking, daily time budget adherence, and completion stats.
- **Interactive Graph Shortcut:** One-click launch into the interactive skill graph.

### 4.3 Diagnostic Assessment Experience (`/assessment`)
- **Pre-Test Calibration:** Declared known skills selector allowing learners to bypass trivial baselines.
- **Dynamic 1-Question Stepper:** Single-question focus with immediate feedback and category indicators.
- **Comprehensive Post-Test Review Screen:**
  - Ability Level ($\theta$), correct response count, and stop reason.
  - Itemized question review (question stem, user selection, correct answer, tested skill).
  - Unlocked frontier skills matrix ready for study.

### 4.4 Personalized Roadmap Canvas (`/roadmap`)
- **Topological Prerequisite Flow:** Visual milestone roadmap with "Coming Soon" badge as async AI generator integration finalizes.

### 4.5 Skill Graph (`/graph`)
- **Interactive Prerequisite Map (`InteractiveSkillGraph.jsx`):**
  - SVG visualization rendering the 56-skill curriculum across 9 domain clusters with 72 prerequisite dependency links.
  - 2-State Visual Model:
    - **Ready to Learn (`unlocked`):** Green node (`#16a34a`) with checkmark icon denoting mastered skills or accessible frontier nodes whose prerequisites are complete.
    - **Locked (`locked`):** Dashed border with lock icon denoting blocked topics.
  - Interactive Controls:
    - Pan, zoom, and cluster filter buttons.
    - Node selection drawer opening right-hand pane with skill overview, calibrated difficulty, direct prerequisites, and unlocked downstream dependencies.

### 4.6 Progress Analytics (`/analytics`)
- Retention metrics, learning velocity, and weekly time budget fulfillment.

---

## 5. Accessibility, Responsiveness & State Specifications

- **Mobile Navigation:** Dedicated thumb-friendly bottom bar (`MobileNav.jsx`) on viewports `< 768px`.
- **Touch-First Ergonomics:** Strict minimum 44x44px touch bounding boxes across all interactive controls.
- **PWA Standards:** Standalone web app manifest support with brand theme colors and offline state resilience.
