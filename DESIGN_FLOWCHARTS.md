# AI-Powered Upskilling Platform — System Design & Flowchart Specifications (Implemented System)

> **Document Scope:** Production-Ready & Implemented Subsystems Only  
> **Repository:** `LNCT-Unix/AI-Powered-Upskilling-Platform`  
> **Authors:** Team Unix (Lakshmi Narain College of Technology, Bhopal)  
> **Lead Maintainer:** Dev Sharma  
> **Last Updated:** October 2026  

---

## 📑 Table of Contents

1. [High-Level Design (HLD)](#1-high-level-design-hld)
   - [1.1 Current System Architecture & Runtime Topology](#11-current-system-architecture--runtime-topology)
   - [1.2 Dual-Persona Platform Lifecycle (Learner & Mentor)](#12-dual-persona-platform-lifecycle-learner--mentor)
2. [System Design](#2-system-design)
   - [2.1 Network Ingress, Security Filters & Communication Protocols](#21-network-ingress-security-filters--communication-protocols)
   - [2.2 In-Memory JWT & Refresh Token Anti-Theft Rotation State Machine](#22-in-memory-jwt--refresh-token-anti-theft-rotation-state-machine)
   - [2.3 Relational Persistence Model (PostgreSQL ER Diagram)](#23-relational-persistence-model-postgresql-er-diagram)
   - [2.4 Database Query Performance: Indexed Anti-Join Item Selection](#24-database-query-performance-indexed-anti-join-item-selection)
3. [Low-Level Design (LLD) — Implemented Features](#3-low-level-design-lld--implemented-features)
   - [3.1 Feature 1: Authentication & Identity Management](#31-feature-1-authentication--identity-management)
   - [3.2 Feature 2: IRT 1-PL Rasch Computerized Adaptive Testing (CAT) Engine](#32-feature-2-irt-1-pl-rasch-computerized-adaptive-testing-cat-engine)
   - [3.3 Feature 3: Topological Skill Graph (DAG) & Dynamic State Transitions](#33-feature-3-topological-skill-graph-dag--dynamic-state-transitions)
   - [3.4 Feature 4: Test History & Psychometric Evaluation Tracking](#34-feature-4-test-history--psychometric-evaluation-tracking)
   - [3.5 Feature 5: Mentor Workspace, Cohort Analytics & Invite Key Linking](#35-feature-5-mentor-workspace-cohort-analytics--invite-key-linking)
4. [Active Engineering Invariants & Data Flow Matrix](#4-active-engineering-invariants--data-flow-matrix)

---

# 1. High-Level Design (HLD)

The High-Level Design illustrates the actual running architecture: the React 19 Single Page Application, the Ingress/Tunnel layer, the Spring Boot Gateway containing all business logic, the PostgreSQL persistence store, and external Identity/SMTP integrations.

### 1.1 Current System Architecture & Runtime Topology

```mermaid
flowchart TB
    subgraph ClientTier ["1. Client Tier (Presentation Layer)"]
        direction LR
        WEB["🌐 Learner Web App<br/>(React 19 / Vite / TailwindCSS)<br/>Dashboard • Quiz • Graph • History"]
        MENTOR_UI["👨‍🏫 Mentor Portal UI<br/>(React 19 Sub-Routes)<br/>Roster • Key Management • Cohort Analytics"]
    end

    subgraph IngressTier ["2. Ingress & Edge Proxy"]
        direction TB
        CF["🛡️ Cloudflare Edge<br/>SSL/TLS Termination • Security Shield"]
        TUNNEL["🚇 Cloudflare Tunnel Connector<br/>merit-symbols-tenant-pub.trycloudflare.com"]
        CF --> TUNNEL
    end

    subgraph CoreBackendTier ["3. Backend Core Gateway (Spring Boot 3.2+ / Java 21 / Port 8080)"]
        direction TB
        SEC_FILTER["🔒 Security Filter Chain<br/>CORS • RateLimiter • JWT OncePerRequestFilter"]
        
        subgraph ImplementedModules ["Active Domain Services"]
            AUTH_MOD["🔑 Authentication & Identity<br/>EmailAuthController • MentorAuthController • OAuth2"]
            CAT_MOD["🎯 Psychometric IRT CAT Engine<br/>AssessmentService • Rasch 1-PL Estimator"]
            GRAPH_MOD["🕸️ Skill Graph DAG Subsystem<br/>AssessmentDataLoader • DFS Cycle Verifier"]
            MENTOR_MOD["👥 Mentor & Cohort Subsystem<br/>MentorKeyService • StudentMentorLinkService"]
            HIST_MOD["📊 Test History & Analytics<br/>AssessmentHistoryService"]
        end
        SEC_FILTER --> ImplementedModules
    end

    subgraph DataTier ["4. Persistent Storage (PostgreSQL 16)"]
        direction TB
        POSTGRES[("🐘 PostgreSQL 16 (Neon Cloud / Local)<br/>citext • UUID • HikariCP Pool<br/>users, refresh_tokens, assessments, skills, mentor_keys")]
    end

    subgraph ExternalServices ["5. External Integrations"]
        direction LR
        GOOGLE_AUTH["🔑 Google Identity<br/>(OAuth 2.0 / OIDC)"]
        GITHUB_AUTH["🐙 GitHub Identity<br/>(OAuth 2.0)"]
        GMAIL_SMTP["✉️ Gmail SMTP<br/>(smtp.gmail.com:587)"]
    end

    %% Client Ingress
    WEB & MENTOR_UI -->|HTTPS / REST / JSON| CF
    TUNNEL -->|HTTP Forward| SEC_FILTER

    %% Gateway to Database
    ImplementedModules <-->|JDBC Transactions / HikariCP| POSTGRES

    %% Gateway to External Auth / SMTP
    AUTH_MOD <-->|OAuth2 Authorization Code| GOOGLE_AUTH & GITHUB_AUTH
    AUTH_MOD -->|STARTTLS / SMTP| GMAIL_SMTP

    classDef client fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1;
    classDef edge fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#334155;
    classDef gateway fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#5b21b6;
    classDef storage fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;
    classDef external fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#991b1b;

    class WEB,MENTOR_UI client;
    class CF,TUNNEL edge;
    class SEC_FILTER,AUTH_MOD,CAT_MOD,GRAPH_MOD,MENTOR_MOD,HIST_MOD gateway;
    class POSTGRES storage;
    class GOOGLE_AUTH,GITHUB_AUTH,GMAIL_SMTP external;
```

---

### 1.2 Dual-Persona Platform Lifecycle (Learner & Mentor)

```mermaid
flowchart TD
    subgraph StudentJourney ["🎓 Implemented Learner Journey"]
        direction TB
        S1(["🔑 Register / Login<br/>(OAuth2 or Email + OTP)"]) --> S2["📊 Learner Dashboard<br/>(/dashboard)"]
        S2 --> S3["🎯 Start Diagnostic Test<br/>(/assessment • Max 9 MCQs)"]
        S3 --> S4["📋 Test Result Reveal<br/>(Scorecard • Ability θ • Baseline Level)"]
        S4 --> S5["🕸️ Interactive Skill Graph<br/>(/graph • 56 Skills in 9 Clusters)"]
        S5 --> S6["📜 Review Past Assessment Runs<br/>(/history • Latent Trajectory)"]
        S6 --> S7["🔗 Enter Mentor Invite Key<br/>(Link account to institutional mentor)"]
    end

    subgraph MentorJourney ["👨‍🏫 Implemented Mentor Journey"]
        direction TB
        M1(["🔑 Register as Mentor<br/>(Full Name • Designation • Org)"]) --> M2["📊 Mentor Command Center<br/>(/mentor)"]
        M2 --> M3["🔑 Generate Cohort Invite Key<br/>(/mentor/key • e.g., MENTOR-UNIX-XXXX)"]
        M3 -.->|Key shared with students| S7
        S7 -.-> M4["👥 Student Roster & Live Tracking<br/>(/mentor/students)"]
        M4 --> M5["📈 Cohort Test Analytics<br/>(/mentor/analytics • Average θ & Weaknesses)"]
        M5 --> M6["🏆 Student Skills Audit<br/>(/mentor/skills • Mastered vs Stuck Nodes)"]
    end

    classDef student fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e40af;
    classDef mentor fill:#faf5ff,stroke:#a855f7,stroke-width:2px,color:#6b21a8;

    class S1,S2,S3,S4,S5,S6,S7 student;
    class M1,M2,M3,M4,M5,M6 mentor;
```

---

# 2. System Design

### 2.1 Network Ingress, Security Filters & Communication Protocols

```mermaid
flowchart LR
    subgraph PublicClient ["Client Layer"]
        SPA["Browser Client<br/>React 19 SPA"]
    end

    subgraph EdgeLayer ["Ingress & Proxy"]
        CF["Cloudflare Edge & Tunnel<br/>HTTPS :443 Termination"]
    end

    subgraph GatewayCore ["Spring Boot Gateway (Port 8080)"]
        CORS["CORS Filter<br/>Allowed Origins: localhost:5173, etc."]
        RATE["Rate Limiter Filter<br/>Cooldown: 60s for OTP sends"]
        JWT_FILTER["OncePerRequestFilter<br/>Bearer Token Authentication"]
        CONTROLLER["REST Controllers<br/>@RestController"]
    end

    subgraph StorageLayer ["PostgreSQL 16"]
        DB[("PostgreSQL Database<br/>HikariCP Connection Pool")]
    end

    SPA -->|HTTPS / JSON| CF
    CF -->|HTTP Forward| CORS
    CORS --> RATE
    RATE --> JWT_FILTER
    JWT_FILTER --> CONTROLLER
    CONTROLLER -->|HikariCP JDBC| DB

    classDef pub fill:#f8fafc,stroke:#94a3b8,stroke-width:1.5px,color:#0f172a;
    classDef ing fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1;
    classDef gwy fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#581c87;
    classDef dbs fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;

    class SPA pub;
    class CF ing;
    class CORS,RATE,JWT_FILTER,CONTROLLER gwy;
    class DB dbs;
```

---

### 2.2 In-Memory JWT & Refresh Token Anti-Theft Rotation State Machine

```mermaid
sequenceDiagram
    autonumber
    actor Client as Web Application (React)
    participant GW as Spring Boot Gateway
    participant DB as PostgreSQL (refresh_tokens)

    Note over Client,GW: Login Phase
    Client->>GW: POST /api/auth/login { email, password }
    GW->>DB: Verify credentials via BCrypt
    GW->>GW: Mint Access Token (JWT, TTL 15m)<br/>Mint Refresh Token (Opaque string, TTL 30d)
    GW->>DB: INSERT INTO refresh_tokens (token_hash=SHA256(token), revoked=false)
    GW-->>Client: Set-Cookie: refresh_token (HttpOnly, SameSite=Lax)<br/>JSON Body: { accessToken } (Stored strictly in-memory)

    Note over Client,GW: Silent Token Refresh
    Client->>GW: POST /api/auth/refresh (Cookie: refresh_token)
    GW->>GW: Compute incoming_hash = SHA256(cookie.token)
    GW->>DB: SELECT * FROM refresh_tokens WHERE token_hash = incoming_hash

    alt Valid Token & revoked == false
        GW->>GW: Mint new Access Token & new Refresh Token
        GW->>DB: UPDATE current SET revoked=true, replaced_by=new_hash<br/>INSERT new refresh_token row
        GW-->>Client: Set-Cookie: new_refresh_token (HttpOnly)<br/>JSON Body: { accessToken: new_access_token }
    else Replay Attack Detected! (revoked == true)
        Note over GW,DB: Security Violation: Rotated token presented again!
        GW->>DB: UPDATE refresh_tokens SET revoked=true WHERE user_id = token.user_id
        GW-->>Client: HTTP 401 Unauthorized (Tokens Revoked)
    end
```

---

### 2.3 Relational Persistence Model (PostgreSQL ER Diagram)

```mermaid
erDiagram
    users ||--o{ oauth_accounts : "maps"
    users ||--o{ refresh_tokens : "owns"
    users ||--o{ email_verification_tokens : "receives"
    users ||--o{ password_reset_tokens : "receives"
    users ||--o{ assessments : "takes"
    users ||--o{ student_mentor_links : "student_links"
    users ||--o| mentor_profiles : "has_profile"
    users ||--o{ mentor_keys : "issues_as_mentor"
    
    tracks ||--o{ skills : "contains"
    tracks ||--o{ assessment_items : "provides"
    tracks ||--o{ assessments : "targets"

    skills ||--o{ skill_prerequisites : "target_skill"
    skills ||--o{ skill_prerequisites : "prerequisite_source"
    skills ||--o{ assessment_skill_results : "evaluated_in"

    assessments ||--o{ assessment_responses : "records"
    assessments ||--o{ assessment_skill_results : "produces"
    assessment_items ||--o{ assessment_responses : "answered_in"

    mentor_keys ||--o{ student_mentor_links : "authorizes"

    users {
        bigint id PK
        varchar email UK "Normalized lowercase"
        varchar password_hash "BCrypt hash"
        varchar full_name
        boolean email_verified
        varchar role "USER, MENTOR, ADMIN"
        varchar status "ACTIVE, SUSPENDED"
        timestamp created_at
    }

    mentor_profiles {
        bigint id PK
        bigint user_id FK,UK
        varchar designation
        varchar organization
        varchar expertise
        text bio
    }

    mentor_keys {
        bigint id PK
        bigint mentor_id FK
        varchar key_code UK "e.g. MENTOR-UNIX-8492"
        varchar status "ACTIVE, REVOKED, EXPIRED"
        int max_students
        int current_students
        timestamp expires_at
    }

    student_mentor_links {
        bigint id PK
        bigint student_id FK
        bigint mentor_id FK
        bigint key_id FK
        timestamp linked_at
    }

    tracks {
        uuid id PK
        varchar slug UK "backend-engineering"
        varchar name
        varchar status "ACTIVE, DRAFT"
    }

    skills {
        uuid id PK
        uuid track_id FK
        varchar slug UK "sql-joins-aggregation"
        varchar name
        varchar cluster "Databases, Security, etc."
        double_precision difficulty "Logit value [-3.0, +3.0]"
        text description
    }

    skill_prerequisites {
        uuid skill_id PK,FK
        uuid prerequisite_id PK,FK
    }

    assessment_items {
        uuid id PK
        uuid track_id FK
        varchar skill_slug
        double_precision difficulty "b_i logit"
        text stem "Question prompt"
        text options "JSON array of 4 options"
        int correct_option "0-indexed; hidden during test"
        varchar status "ACTIVE, RETIRED"
    }

    assessments {
        uuid id PK
        bigint user_id FK
        uuid track_id FK
        double_precision theta "Estimated ability"
        varchar competency_level "BEGINNER, INTERMEDIATE, ADVANCED"
        int questions_answered
        varchar stop_reason "LEVEL_CONFIRMED, MAX_ITEMS"
        varchar status "IN_PROGRESS, COMPLETED"
        timestamp created_at
        timestamp completed_at
    }

    assessment_responses {
        uuid id PK
        uuid assessment_id FK
        uuid item_id FK
        int selected_option
        boolean is_correct
        double_precision theta_after
        timestamp answered_at
    }
```

---

### 2.4 Database Query Performance: Indexed Anti-Join Item Selection

```mermaid
flowchart TD
    REQ["Learner submits answer:<br/>POST /api/v1/assessments/:id/answers"] --> PERSIST["Save AssessmentResponse<br/>UPDATE assessments SET theta = new_theta"]
    PERSIST --> ANTI_JOIN["Execute Indexed SQL Anti-Join:<br/>SELECT i FROM AssessmentItem i<br/>LEFT JOIN AssessmentResponse r ON r.item = i AND r.assessment = :assessment<br/>WHERE r.id IS NULL AND i.track = :track AND i.status = 'ACTIVE'<br/>ORDER BY ABS(i.difficulty - :currentTheta) ASC"]
    ANTI_JOIN --> INDEX["Scans index: idx_items_track_status_diff"]
    INDEX --> FETCH["Fetch Top 1 Candidate (Limit.of(1))"]
    FETCH --> CHECK_FOUND{Candidate Found?}
    CHECK_FOUND -- Yes --> RETURN_DTO["Strip 'correct_option'<br/>Return next item payload to client"]
    CHECK_FOUND -- No --> STOP_TEST["Mark assessment: stop_reason = 'NO_QUESTIONS_LEFT'<br/>status = 'COMPLETED'"]

    classDef proc fill:#f0f9ff,stroke:#0284c7,stroke-width:2px,color:#0369a1;
    classDef check fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;
    classDef done fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#166534;

    class REQ,PERSIST,ANTI_JOIN,INDEX,FETCH proc;
    class CHECK_FOUND check;
    class RETURN_DTO,STOP_TEST done;
```

---

# 3. Low-Level Design (LLD) — Implemented Features

---

### 3.1 Feature 1: Authentication & Identity Management

Implemented across `EmailAuthController`, `MentorAuthController`, `SecurityConfig`, and OAuth2 handlers.

```mermaid
flowchart TD
    AUTH_ENTRY([User Accesses Login/Signup]) --> AUTH_TYPE{Auth Method}

    %% Email/Password Branch
    AUTH_TYPE -- "Email & Password" --> FLOW_TYPE{Action}
    FLOW_TYPE -- "Student Signup" --> SIGNUP_STUDENT["Enter Name, Email, Password"]
    FLOW_TYPE -- "Mentor Signup" --> SIGNUP_MENTOR["Enter Name, Designation, Org, Password"]
    
    SIGNUP_STUDENT & SIGNUP_MENTOR --> BCRYPT["Hash password with BCrypt (Cost: 12)"]
    BCRYPT --> SAVE_PENDING["Save User (email_verified = false)"]
    SAVE_PENDING --> SEND_OTP["Generate 6-digit OTP (TTL: 15m)<br/>Dispatch via Gmail SMTP"]
    SEND_OTP --> VERIFY_OTP_SCREEN["Redirect to /verify-email"]
    
    VERIFY_OTP_SCREEN --> SUBMIT_OTP["User submits 6-digit OTP"]
    SUBMIT_OTP --> CHECK_OTP{OTP Valid & Active?}
    CHECK_OTP -- No --> OTP_ERROR["Show error (Cooldown: 60s)"]
    CHECK_OTP -- Yes --> VERIFY_SUCCESS["Mark email_verified = true<br/>Issue In-Memory JWT & HttpOnly Cookie"]

    FLOW_TYPE -- "Standard Login" --> LOGIN_SUBMIT["Enter Email & Password"]
    LOGIN_SUBMIT --> CHECK_CREDS{Credentials Valid?}
    CHECK_CREDS -- No --> LOGIN_REJECT["HTTP 401 Unauthorized"]
    CHECK_CREDS -- Yes --> CHECK_VERIFIED{email_verified == true?}
    CHECK_VERIFIED -- No --> REDIRECT_VERIFY["HTTP 403: Prompt OTP Verification"]
    CHECK_VERIFIED -- Yes --> LOGIN_OK["Issue In-Memory JWT & HttpOnly Cookie<br/>Navigate to /dashboard (or /mentor)"]

    %% OAuth2 Branch
    AUTH_TYPE -- "OAuth 2.0 (Google / GitHub)" --> OA_REDIRECT["Redirect to Provider Authentication"]
    OA_REDIRECT --> OA_CALLBACK["Provider redirects to /login/oauth2/code/:provider"]
    OA_CALLBACK --> OA_DECISION{Account Linking Decision Matrix}
    
    OA_DECISION -- "Provider ID already mapped" --> OA_LOGIN_OK["Authenticate User"]
    OA_DECISION -- "New Email" --> OA_REGISTER["Provision New User (email_verified=true)<br/>Link OAuth Identity"]
    OA_DECISION -- "Existing Unverified User" --> OA_RECLAIM["Verify Email, Clear Old Password,<br/>Link OAuth Identity"]
    OA_DECISION -- "Existing Verified Password User" --> OA_BLOCK["Prevent Takeover! HTTP 409 OAUTH_ACCOUNT_EXISTS<br/>Require password login first"]

    OA_LOGIN_OK & OA_REGISTER & OA_RECLAIM --> MINT_CODE["Issue One-Time UUID Login Code (TTL: 60s)"]
    MINT_CODE --> BROWSER_REDIRECT["Redirect to /auth/callback?code=:uuid"]
    BROWSER_REDIRECT --> CODE_EXCHANGE["Client calls POST /api/auth/oauth2/exchange"]
    CODE_EXCHANGE --> SESSION_READY(["Session Established<br/>Access Token in-memory, Refresh Token in cookie"])

    classDef step fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1;
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;
    classDef success fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#166534;
    classDef reject fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#991b1b;

    class SIGNUP_STUDENT,SIGNUP_MENTOR,BCRYPT,SAVE_PENDING,SEND_OTP,VERIFY_OTP_SCREEN,SUBMIT_OTP,LOGIN_SUBMIT,OA_REDIRECT,OA_CALLBACK,OA_REGISTER,OA_RECLAIM,MINT_CODE,BROWSER_REDIRECT,CODE_EXCHANGE step;
    class AUTH_TYPE,FLOW_TYPE,CHECK_OTP,CHECK_CREDS,CHECK_VERIFIED,OA_DECISION decision;
    class VERIFY_SUCCESS,LOGIN_OK,OA_LOGIN_OK,SESSION_READY success;
    class OTP_ERROR,LOGIN_REJECT,REDIRECT_VERIFY,OA_BLOCK reject;
```

---

### 3.2 Feature 2: IRT 1-PL Rasch Computerized Adaptive Testing (CAT) Engine

Implemented in `AssessmentService.java` and `AssessmentController.java`.

```mermaid
flowchart TD
    START([User clicks: Start Diagnostic Test]) --> INIT_CAT["Create Assessment Record<br/>θ_0 = 0.0, QuestionsAnswered = 0<br/>Status = 'IN_PROGRESS'"]
    
    INIT_CAT --> GET_NEXT["Call: findNext(assessmentId, currentTheta)<br/>Direct SQL Anti-Join for closest item: min |b_i - θ|"]
    GET_NEXT --> POOL_EMPTY{Pool Empty?}
    
    POOL_EMPTY -- Yes --> STOP_NO_Q["stop_reason = 'NO_QUESTIONS_LEFT'"]
    POOL_EMPTY -- No --> SEND_QUESTION["Send Item to Client<br/>(Options randomized, correct_option stripped)"]
    
    SEND_QUESTION --> WAIT_ANS["User submits answer:<br/>POST /api/v1/assessments/:id/answers"]
    WAIT_ANS --> EVAL_ANS{Is Option Correct?}
    
    EVAL_ANS -- Correct (1) --> ADJ_UP["θ_next = θ_curr + 0.35 logits<br/>Track direction = UP"]
    EVAL_ANS -- Incorrect (0) --> ADJ_DOWN["θ_next = θ_curr - 0.35 logits<br/>Track direction = DOWN"]
    
    ADJ_UP & ADJ_DOWN --> RECORD_RESP["INSERT INTO assessment_responses<br/>Increment QuestionsAnswered<br/>Compute Standard Error (SE)"]
    
    RECORD_RESP --> CHECK_STOP{Evaluate Stopping Criteria}
    
    CHECK_STOP -- "QuestionsAnswered >= 9 (Hard Cap)" --> STOP_MAX["stop_reason = 'MAX_ITEMS'"]
    CHECK_STOP -- "QuestionsAnswered >= 5 AND Direction Reversals >= 2" --> STOP_CONFIRMED["stop_reason = 'LEVEL_CONFIRMED'<br/>(Learner oscillating around true ability)"]
    CHECK_STOP -- "Standard Error SE <= 0.45" --> STOP_SE["stop_reason = 'PRECISION_REACHED'"]
    CHECK_STOP -- "Criteria not met" --> GET_NEXT

    STOP_NO_Q & STOP_MAX & STOP_CONFIRMED & STOP_SE --> MAP_COMPETENCY{Map Final θ to Level}
    MAP_COMPETENCY -- "θ < -0.5" --> LVL_BEG["Level: BEGINNER"]
    MAP_COMPETENCY -- "-0.5 <= θ <= 0.75" --> LVL_INT["Level: INTERMEDIATE"]
    MAP_COMPETENCY -- "θ > 0.75" --> LVL_ADV["Level: ADVANCED"]

    LVL_BEG & LVL_INT & LVL_ADV --> FINALIZE["Update assessment: status = 'COMPLETED'<br/>Trigger Skill Graph Classification"]
    FINALIZE --> SHOW_SCORECARD(["Display Results (/assessment):<br/>Scorecard, Ability θ, Radar Breakdown & History"])

    classDef act fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e40af;
    classDef dec fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;
    classDef endNode fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#166534;

    class INIT_CAT,GET_NEXT,SEND_QUESTION,WAIT_ANS,ADJ_UP,ADJ_DOWN,RECORD_RESP,FINALIZE act;
    class POOL_EMPTY,EVAL_ANS,CHECK_STOP,MAP_COMPETENCY dec;
    class STOP_NO_Q,STOP_MAX,STOP_CONFIRMED,STOP_SE,LVL_BEG,LVL_INT,LVL_ADV,SHOW_SCORECARD endNode;
```

---

### 3.3 Feature 3: Topological Skill Graph (DAG) & Dynamic State Transitions

Implemented in `AssessmentDataLoader.java` (backend verification) and `InteractiveSkillGraph.jsx` (frontend visualization).

```mermaid
flowchart TD
    subgraph StartupVerification ["1. Boot-Time DAG Integrity Verification (AssessmentDataLoader)"]
        LOAD_YAML["Read backend-skills.yaml<br/>(56 Atomic Skills, 72 Prerequisite Edges)"] --> DFS_CYCLE["Run DFS Cycle Detection Algorithm"]
        DFS_CYCLE --> CYCLE_FOUND{Cycles Detected?}
        CYCLE_FOUND -- Yes --> BOOT_FAIL["FATAL: Terminate Boot with CircularDependencyException"]
        CYCLE_FOUND -- No --> ORPHAN_CHECK["Verify Prerequisite Foreign Keys"]
        ORPHAN_CHECK --> INVERSION_CHECK["Check Difficulty Inversions<br/>(Prerequisite difficulty <= Target difficulty)"]
        INVERSION_CHECK --> DB_SYNC["Seed / Update skills and skill_prerequisites in PostgreSQL"]
    end

    subgraph RuntimeClassification ["2. Dynamic State Engine (Ability θ*)"]
        EVAL_SKILL["Evaluate Skill S for User with Final Ability θ*"] --> CHECK_MASTERY{Was S pre-selected in onboarding<br/>OR S.difficulty <= θ* - 0.25?}
        CHECK_MASTERY -- Yes --> STATE_MASTERED["State: MASTERED<br/>(Visual: Solid Green Border & Indicator)"]
        
        CHECK_MASTERY -- No --> CHECK_EDGES{Are ALL direct prerequisites<br/>of S currently MASTERED?}
        CHECK_EDGES -- Yes --> STATE_FRONTIER["State: FRONTIER (Ready to Learn!)<br/>(Visual: Pulsing Purple Accent)"]
        CHECK_EDGES -- No --> STATE_LOCKED["State: LOCKED<br/>(Visual: Muted Slate / Lock Icon)"]
    end

    subgraph UserInterface ["3. Frontend Interactive Graph (/graph)"]
        STATE_MASTERED & STATE_FRONTIER & STATE_LOCKED --> RENDER_CANVAS["Render Interactive SVG Skill Graph<br/>Default Selection: 1 Block Checked (e.g. Foundations)"]
        RENDER_CANVAS --> CLICK_NODE["User Clicks Node in Canvas"]
        CLICK_NODE --> NODE_DETAILS["Open Slide-Over Drawer:<br/>Skill Name, Cluster, Difficulty, Direct Prerequisites & Dependents"]
    end

    classDef proc fill:#f0f9ff,stroke:#0284c7,stroke-width:2px,color:#0369a1;
    classDef check fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;
    classDef ok fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#166534;
    classDef fail fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#991b1b;

    class LOAD_YAML,DFS_CYCLE,ORPHAN_CHECK,INVERSION_CHECK,DB_SYNC,EVAL_SKILL,RENDER_CANVAS,CLICK_NODE,NODE_DETAILS proc;
    class CYCLE_FOUND,CHECK_MASTERY,CHECK_EDGES check;
    class STATE_MASTERED,STATE_FRONTIER ok;
    class BOOT_FAIL,STATE_LOCKED fail;
```

---

### 3.4 Feature 4: Test History & Psychometric Evaluation Tracking

Implemented in `AssessmentController` (`/api/v1/assessments/history`) and `TestHistoryPage.jsx`.

```mermaid
flowchart TD
    NAV_HIST([Learner navigates to /history]) --> FETCH_HIST["GET /api/v1/assessments/history<br/>Authenticated via JWT Bearer Token"]
    FETCH_HIST --> QUERY_RUNS["Query assessments table for user_id<br/>ORDER BY created_at DESC"]
    QUERY_RUNS --> ASSEMBLE_DTO["Assemble TestHistoryItemDto List:<br/>- Assessment ID & Timestamp<br/>- Final Ability θ & Competency Level<br/>- Questions Answered count<br/>- Stop Reason (LEVEL_CONFIRMED / MAX_ITEMS)"]
    
    ASSEMBLE_DTO --> RENDER_LIST["Render Test History UI (/history):<br/>- Chronological Assessment Cards<br/>- Color-coded Competency Badges<br/>- Stopping Reason Diagnostics"]
    
    RENDER_LIST --> EXPAND_RUN["Learner expands specific test run"]
    EXPAND_RUN --> RENDER_RESPONSES["Display question-by-question trajectory:<br/>- Question stem & choices<br/>- Item difficulty b_i vs ability θ after question<br/>- Direction shifts and convergence behavior"]

    classDef step fill:#f8fafc,stroke:#475569,stroke-width:2px,color:#0f172a;
    classDef ui fill:#eff6ff,stroke:#2563eb,stroke-width:2px,color:#1e3a8a;

    class NAV_HIST,FETCH_HIST,QUERY_RUNS,ASSEMBLE_DTO step;
    class RENDER_LIST,EXPAND_RUN,RENDER_RESPONSES ui;
```

---

### 3.5 Feature 5: Mentor Workspace, Cohort Analytics & Invite Key Linking

Implemented across `MentorKeyController`, `StudentMentorLinkController`, `MentorAnalyticsController`, and `MentorDashboard.jsx`.

```mermaid
flowchart TD
    subgraph KeyIssuance ["1. Key Generation (MentorKeyService)"]
        M_OPEN_KEY["Mentor opens /mentor/key"] --> M_CLICK_GEN["Click: 'Generate Cohort Invite Key'"]
        M_CLICK_GEN --> GEN_LOGIC["Generate Key (e.g. MENTOR-UNIX-9204)<br/>Set status='ACTIVE', max_students=50<br/>Save to mentor_keys table"]
        GEN_LOGIC --> DISPLAY_KEY["Display Key with 1-Click Copy"]
    end

    subgraph StudentAssociation ["2. Student Linking (StudentMentorLinkService)"]
        SHARE_KEY["Mentor distributes key to students"] --> STU_ENTER["Student submits key:<br/>POST /api/v1/students/mentor-link"]
        STU_ENTER --> CHECK_KEY_STATUS{Validate Key}
        CHECK_KEY_STATUS -- "Key Revoked or Expired" --> KEY_FAIL["HTTP 400: Invalid Key"]
        CHECK_KEY_STATUS -- "Student Already Linked to Key" --> KEY_ALREADY["Return: 'Already linked to this mentor'"]
        CHECK_KEY_STATUS -- "Valid" --> LINK_SUCCESS["INSERT INTO student_mentor_links<br/>Increment mentor_keys.current_students"]
    end

    subgraph MentorObservability ["3. Mentor Command Center (/mentor/*)"]
        LINK_SUCCESS --> ROSTER["/mentor/students: View Roster<br/>Student Names, Latest θ Scores, Test Dates"]
        ROSTER --> ANALYTICS["/mentor/analytics: Cohort Metrics<br/>Average Ability, Score Distribution, Test Completion %"]
        ANALYTICS --> SKILLS["/mentor/skills: Skill Audit<br/>Inspect Cohort Mastery vs Stuck Nodes"]
    end

    classDef mStep fill:#faf5ff,stroke:#9333ea,stroke-width:2px,color:#581c87;
    classDef sStep fill:#eff6ff,stroke:#2563eb,stroke-width:2px,color:#1e3a8a;
    classDef decNode fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;
    classDef errNode fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#991b1b;

    class M_OPEN_KEY,M_CLICK_GEN,GEN_LOGIC,DISPLAY_KEY,ROSTER,ANALYTICS,SKILLS mStep;
    class SHARE_KEY,STU_ENTER,LINK_SUCCESS sStep;
    class CHECK_KEY_STATUS decNode;
    class KEY_FAIL,KEY_ALREADY errNode;
```

---

# 4. Active Engineering Invariants & Data Flow Matrix

| Architectural Principle | Active Implementation in Codebase | Verification Mechanism |
| :--- | :--- | :--- |
| **In-Memory JWT Access Tokens** | Stored strictly in module variable in `src/services/api.js`. Never in `localStorage` or `sessionStorage`. | Browser audit: `localStorage.getItem('token')` returns `null`. |
| **HttpOnly Refresh Token Rotation** | Minted by `AuthTokenServiceImpl.java`, saved in `refresh_tokens` as SHA-256 hashes, transmitted in HttpOnly cookies. | Verified in `AuthTokenController.java`; reused rotated tokens trigger session invalidation. |
| **Deterministic CAT Math** | 1-PL Rasch algorithm in `AssessmentService.java` executes pure deterministic arithmetic without random seeds. | Unit tests in `AssessmentServiceTest.java` guarantee identical inputs produce bit-identical logit results. |
| **Duplicate Prevention (Anti-Join)** | `AssessmentItemRepository.java` uses `LEFT JOIN AssessmentResponse r ON r.item.id = i.id ... WHERE r.id IS NULL`. | Guarantees an item is never served more than once per test session. |
| **Cycle Prevention at Startup** | `AssessmentDataLoader.java` runs Depth-First Search cycle detection before seeding skills into PostgreSQL. | Startup fails fast with `CircularDependencyException` if a cycle is introduced to `backend-skills.yaml`. |
| **Unique Mentor Cohort Keys** | `MentorKeyGenerator.java` generates cryptographically unique keys with maximum capacity enforcement. | Database `UNIQUE(key_code)` constraint prevents duplicate keys. |
| **Strict Single Block Default** | `InteractiveSkillGraph.jsx` initializes `defaultSelectedClusters` with only 1 block checked. | Verified in React state: loads 1 block (e.g. Foundations) by default. |

---

> Maintained by **Team Unix** (Lakshmi Narain College of Technology, Bhopal) for the **EPAM Systems CoE Programme**.  
> Lead Maintainer: **Dev Sharma** (`dev47929@gmail.com`)
