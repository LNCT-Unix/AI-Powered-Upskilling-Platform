# Frontend Repository Audit — AI-Powered Upskilling Platform

**Audit Date:** October 24, 2026  
**Auditor:** Senior Frontend Engineer & Design Systems Engineer  
**Repository:** `https://github.com/LNCT-Unix/AI-Powered-Upskilling-Platform`  
**Inspected Branch:** `frontend` (commit `7781838` - "initial frontend")  
**Local Workspace:** `C:\Users\ashut\EPAM\UNIX\AI-path-finder`  
**Audit Type:** Read-Only Source Code Audit  

---

## 1. Executive Summary

The `frontend` branch currently hosts a lightweight starter project built with **React 19, Vite 8, and Tailwind CSS v4**. While the application visually displays elements of a learning platform, source code inspection reveals that it is currently an **unmodularized, single-file prototype (30 KB across 112 lines)** operating entirely on client-local state and static constants.

No connection to the backend gateway (`gateway/ai-upskilling-platform`) exists, no authentication is wired, no client-side router is installed, and dependencies have not yet been installed (`node_modules` does not exist). The visual presentation relies on generic SaaS layout tropes and hardcoded mock data.

---

## 2. Environment & Dependency Status

### Node & Package Manager Runtime
- **Host Runtime:** Node.js `v24.12.0`, npm `11.6.2`.
- **Lockfile Version:** `package-lock.json` (lockfileVersion 3).
- **Status:** Satisfies modern React 19 and Vite 8 requirements. However, `node_modules` does not exist locally; `npm install` has not been run in this workspace.

### Package Manifest Analysis (`package.json`)
```json
{
  "name": "aiupskillingpath",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "lucide-react": "^1.61.0",
    "react": "^19.3.1",
    "react-dom": "^19.3.1",
    "tailwindcss": "^4.3.3"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "@vitejs/plugin-react": "^6.1.2",
    "eslint": "^10.13.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.7",
    "globals": "^17.13.0",
    "vite": "^8.3.4"
  }
}
```

### Critical Dependency Deficits
1. **Routing:** `react-router-dom` is **NOT installed**. Navigation is simulated via React state (`useState('landing')`).
2. **State & Cache Management:** No state management (`@tanstack/react-query`, `zustand`, `redux-toolkit`) is installed.
3. **HTTP Client:** Neither `axios` nor custom `fetch` interceptors exist.
4. **Testing Infrastructure:** Zero test frameworks (Vitest, Jest, React Testing Library, Playwright) are present.
5. **Code Quality:** ESLint 10 is configured via `eslint.config.js`, but Prettier formatting is not configured.

---

## 3. Git Tree & Submodule Anomaly Analysis

Running `git ls-tree HEAD` yields:
```
100644 blob a547bf36d8d11a4f89c59c144f24795749086dd1  .gitignore
160000 commit 006ff93fe5519a3425e44e3d52bc20e6a849d8a4 AI-Powered-Upskilling-Platform
100644 blob a36934d874c7fbc51aecd1c66dffc106f60693a9  README.md
100644 blob ea36dd3dc45ddadb9d25dd5e1c74a706dd61a6a9  eslint.config.js
100644 blob cdfa7f4f15049c4734f2c39ea8bd8d80ba03e4e5  index.html
100644 blob c9d142a022a8fc08646c6ab9f7d49f69a00d0a9a  package-lock.json
100644 blob 52827de26411321ab1ef9edf8545d9b444b4da07  package.json
040000 tree 8bbb5ee6c07004e372ddd3fd49ee75964c2c9e75  public
040000 tree b4a31247ee241aa8320764bca035556e55d01958  src
100644 blob b726b922a8da7ef92d4dc077bd37a61e5307b7b7  vite.config.js
```

### Gitlink Investigation: `AI-Powered-Upskilling-Platform`
- **Finding:** Git mode `160000` defines a submodule commit reference to `006ff93fe5519a3425e44e3d52bc20e6a849d8a4`.
- **Commit History:** Inspecting `006ff93fe` reveals it is the initial backend commit ("backend initialized") on branch `main`.
- **Cause:** When teammate Manvi initialized the frontend repository, an inner clone or checkout of the repository existed within the working tree and was staged with `git add .`.
- **Status:** Because no `.gitmodules` file exists, Git cannot clone or update this entry. Locally, it presents as an empty directory (`AI-Powered-Upskilling-Platform/`).
- **Safety Directive:** In compliance with project safety rules, this entry will remain completely untouched during the specification and audit phases.

---

## 4. Current File Tree & Architectural Limitations

```
AI-path-finder/
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── README.md
├── vite.config.js
├── public/
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── App.css          (Orphaned / Unused)
    ├── App.jsx          (Monolithic codebase: 30,818 bytes, 112 lines)
    ├── index.css        (Tailwind v4 @theme configuration)
    ├── main.jsx         (Mounts App inside StrictMode)
    └── assets/
        ├── hero.png     (13 KB local image - unreferenced)
        ├── react.svg    (Vite template artifact)
        └── vite.svg     (Vite template artifact)
```

### Architectural Deficits in `src/App.jsx`
1. **Monolithic Anti-Pattern:** All 14 visual elements and views reside in a single file:
   - Components: `Button`, `Logo`, `Card`, `SkillBar`, `ScoreRing`, `MetricCard`
   - Layouts: `DashboardShell`, `Landing`
   - Views: `Dashboard`, `AssessmentPage`, `GraphPage`, `RoadmapPage`, `AnalyticsPage`, `PlaceholderPage`
   - Root: `App`
2. **State Ephemerality:** All user interactions (diagnostic answers, roadmap checkmarks, search queries) are held in component-level `useState`. Navigating between views unmounts the active component, immediately destroying user progress.
3. **No Browser History or Deep Linking:** Because navigation uses `useState('landing')`, the browser URL bar never updates. Refreshing the browser resets the user to the landing page. Users cannot share or bookmark direct links to `/dashboard` or `/assessment`.
4. **Third-Party External Asset Leak:** In `src/App.jsx:L10`:
   ```javascript
   const HERO_IMAGE = 'https://i.pinimg.com/736x/84/dd/e6/84dde6e4a1641f19a2f53577ec4b9f4c.jpg';
   ```
   This introduces a hard external dependency on a Pinterest CDN URL that can break at any time due to rate limiting or referrer blocking. Meanwhile, a local asset (`src/assets/hero.png`) sits unutilized in the repository.
5. **Orphaned CSS:** `src/App.css` defines `@import "tailwindcss";` but is not imported in `main.jsx` or `App.jsx`.

---

## 5. Screen-by-Screen Source Verification

| Screen / View | Claimed Functionality | Actual Code Implementation | Verification Verdict |
|---|---|---|---|
| **Landing Page** | Platform marketing, value proposition, feature preview | Static layout in `Landing()`. Features, steps, and hero preview render from static data. Navigation buttons call `go('assessment')` or `go('dashboard')`. | **Verified functional prototype.** Clean markup, but generic aesthetic. |
| **Dashboard** | Personalized learner home, skill metrics, streak, activity tracker | Static view in `Dashboard()`. Overall score ring hardcoded to 0. Mastered skills hardcoded to "0 / 18". Learning streak hardcoded to 12 days. Activity log supports local text search and tab filtering over 4 static items. | **UI Placeholder Only.** Zero dynamic data. |
| **Diagnostic Assessment** | Adaptive diagnostic test measuring 5 knowledge areas | In `AssessmentPage()`, 4 static multiple-choice questions (JavaScript, SQL, React, Data Structures) are mapped. Renders radio buttons and compares with hardcoded indices. Displays note: *"This is a local practice result, not an AI-generated or backend assessment."* | **Partially Implemented.** Missing 10-question adaptive model across 5 areas. |
| **Skill Graph** | Interactive prerequisite skill dependency map | In `GraphPage()`, renders a fixed `<svg>` element with static dashed lines and 5 absolutely-positioned cards (`Programming basics`, `JavaScript`, `Data structures`, `React`, `System design`). | **UI Placeholder Only.** No interactivity, zooming, or dynamic relationships. |
| **Roadmap** | Personalized step-by-step learning progression | In `RoadmapPage()`, 4 hardcoded items (`JavaScript closures`, `Practice React Hooks`, `Binary trees explained`, `SQL joins practice`). Checkmark toggle updates a local `done` array. | **UI Placeholder Only.** Resets upon navigating away. No API persistence. |
| **Analytics** | Learner performance, assessments completed, score trends | In `AnalyticsPage()`, 3 metric cards with hardcoded values ("0%", "0", "0 days"), repeating the static `skills` and `activities` arrays from `App.jsx`. | **UI Placeholder Only.** No dynamic metrics or charting library. |
| **Authentication / User Profile** | User login, profile display, session management | Header displays static text *"Student account / Sample profile"*. Clicking the notification icon executes `window.alert('You’re all caught up!...')`. No login modal, token storage, or callback routes. | **Not Found.** Completely absent. |

---

## 6. Technical Risks & Constraints

1. **OAuth2 Redirect Failure Risk (Critical):** The Spring Boot backend gateway redirects to `http://localhost:5173/auth/callback?code=<ONE_TIME_CODE>`. Without a URL router or query param parser, this redirect will load the default landing page and lose the authorization code.
2. **Maintenance Bottleneck:** Any concurrent work on the frontend will cause merge conflicts as long as all views remain inside `src/App.jsx`.
3. **Data Loss on Navigation:** Without global state or persistent caching, users taking a multi-step diagnostic or checking roadmap tasks lose their progress if they switch tabs.
4. **Theme Inconsistency:** `src/index.css` specifies `--color-navy-*` tokens in `@theme`, but `App.jsx` uses hardcoded Tailwind green/slate utility classes, causing design system drift.
