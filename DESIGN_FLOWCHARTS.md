# AI-Powered Upskilling Platform — System Design & Flowchart Specifications

> **Document Version:** 1.0.0  
> **Target Audience:** Solutions Architects, Full-Stack Engineers, AI Specialists, and EPAM CoE Evaluators  
> **Repository:** `LNCT-Unix/AI-Powered-Upskilling-Platform`  
> **Authors:** Team Unix (Lakshmi Narain College of Technology, Bhopal)  
> **Maintainer / Lead:** Dev Sharma  
> **Last Updated:** October 2026  

---

## 📑 Table of Contents

1. [High-Level Design (HLD)](#1-high-level-design-hld)
   - [1.1 End-to-End Architecture & Topology](#11-end-to-end-architecture--topology)
   - [1.2 Dual-Persona Platform Lifecycle (Learner & Mentor)](#12-dual-persona-platform-lifecycle-learner--mentor)
2. [System Design](#2-system-design)
   - [2.1 Network Ingress, Security Boundaries & Protocols](#21-network-ingress-security-boundaries--protocols)
   - [2.2 Authentication, JWT & Refresh Token Anti-Theft State Machine](#22-authentication-jwt--refresh-token-anti-theft-state-machine)
   - [2.3 Relational Persistence Model (PostgreSQL ER Diagram)](#23-relational-persistence-model-postgresql-er-diagram)
   - [2.4 Asynchronous Worker Subsystem & Schema Contract Validation](#24-asynchronous-worker-subsystem--schema-contract-validation)
   - [2.5 Database Query Performance & Direct Anti-Join Mechanics](#25-database-query-performance--direct-anti-join-mechanics)
3. [Low-Level Design (LLD) — All Platform Features](#3-low-level-design-lld--all-platform-features)
   - [3.1 Feature 1: Authentication & Identity Management](#31-feature-1-authentication--identity-management)
   - [3.2 Feature 2: IRT 1-PL Rasch Computerized Adaptive Testing (CAT) Engine](#32-feature-2-irt-1-pl-rasch-computerized-adaptive-testing-cat-engine)
   - [3.3 Feature 3: Topological Skill Graph (DAG) & Dynamic State Transitions](#33-feature-3-topological-skill-graph-dag--dynamic-state-transitions)
   - [3.4 Feature 4: AI Learning Roadmap Generation & Milestone Progression](#34-feature-4-ai-learning-roadmap-generation--milestone-progression)
   - [3.5 Feature 5: Capstone Project Verification Lab (GitHub Audit)](#35-feature-5-capstone-project-verification-lab-github-audit)
   - [3.6 Feature 6: Test History & Deep Psychometric Analytics Engine](#36-feature-6-test-history--deep-psychometric-analytics-engine)
   - [3.7 Feature 7: Mentor Management, Cohort Analytics & Invite Key Linking](#37-feature-7-mentor-management-cohort-analytics--invite-key-linking)
   - [3.8 Feature 8: Career Hub, ATS Optimization & AI Mock Interview Suite](#38-feature-8-career-hub-ats-optimization--ai-mock-interview-suite)
4. [Cross-Cutting Architectural Invariants & Data Flow Matrix](#4-cross-cutting-architectural-invariants--data-flow-matrix)

---

# 1. High-Level Design (HLD)

The High-Level Design establishes the global boundaries, runtime tiers, and communication channels separating client applications, transactional microservices, asynchronous worker nodes, and external AI orchestrators.

### 1.1 End-to-End Architecture & Topology

```mermaid
graph TB
    subgraph ClientTier ["1. Client Tier (Presentation Layer)"]
        direction LR
        WEB["🌐 Web Application<br/>(React 19 / Vite / TailwindCSS)<br/>Port: 5173"]
        MOB["📱 Mobile Client<br/>(Capacitor / Android & iOS)<br/>Scheme: myapp://"]
        MENTOR_UI["👨‍🏫 Mentor Portal UI<br/>(Cohort Analytics & Roster)<br/>Route: /mentor/*"]
    end

    subgraph IngressTier ["2. Ingress & Edge Gateway Tier"]
        direction TB
        CF["🛡️ Cloudflare Edge / Reverse Proxy<br/>SSL/TLS Termination • DDoS Shield"]
        TUNNEL["🚇 Cloudflare Tunnel / Ingress<br/>merit-symbols-tenant-pub.trycloudflare.com"]
        CF --> TUNNEL
    end

    subgraph CoreBackendTier ["3. Backend Core Gateway Tier (Spring Boot 3.2+ / Java 21)"]
        direction TB
        SEC_FILTER["🔒 Spring Security Filter Chain<br/>CORS • CSRF • JWT AuthFilter • RateLimiter"]
        
        subgraph GatewayModules ["Domain Subsystems"]
            AUTH_MOD["🔑 Identity & Auth Module<br/>OAuth2 Client • BCrypt • SMTP OTP"]
            CAT_MOD["🎯 Psychometric IRT CAT Engine<br/>1-PL Rasch Estimator • Item Selector"]
            GRAPH_MOD["🕸️ Skill Graph DAG Traversal<br/>Topological Sorter • Cycle Verifier"]
            ROADMAP_MOD["🗺️ Roadmap Orchestrator<br/>Milestone State Tracker"]
            MENTOR_MOD["👥 Mentor & Cohort Module<br/>Invite Key Generator • Student Linking"]
            ANALYTICS_MOD["📊 Analytics & History Engine<br/>Ability Trajectory Aggregator"]
            TASK_MOD["⚡ Async Task Lifecycle Manager<br/>Task Dispatcher & Callback Receiver"]
        end
        SEC_FILTER --> GatewayModules
    end

    subgraph DataTier ["4. Persistent Storage Tier"]
        direction TB
        POSTGRES[("🐘 PostgreSQL 16 (Neon Cloud / Local)<br/>citext • UUID • HikariCP Pool<br/>Tables: users, assessments, skills, roadmaps")]
    end

    subgraph AsyncTier ["5. Asynchronous AI Worker Tier (Node.js 20+)"]
        direction TB
        WORKER_SVC["⚙️ AI Worker Service (Port 3001)<br/>Internal Shared-Secret Auth (`X-Internal-API-Key`)"]
        QUEUE["📥 Task Queue / BullMQ (Redis)<br/>Job Deduplication & Retry Manager"]
        VALIDATOR["📋 Schema Contract Validator<br/>Draft 7 JSON Schemas (`contracts/`)"]
        WORKER_SVC --> QUEUE --> VALIDATOR
    end

    subgraph ExternalServices ["6. External Service Providers"]
        direction LR
        GOOGLE_AUTH["🔑 Google Identity<br/>(OAuth 2.0 / OIDC)"]
        GITHUB_AUTH["🐙 GitHub Identity<br/>(OAuth 2.0)"]
        GMAIL_SMTP["✉️ Gmail SMTP<br/>(smtp.gmail.com:587)"]
        OPENROUTER["🤖 LLM Providers<br/>(OpenRouter / Gemini / Claude)"]
    end

    %% Ingress Connections
    WEB & MOB & MENTOR_UI -->|HTTPS / REST / JSON| CF
    TUNNEL -->|HTTP / Reverse Proxy| SEC_FILTER

    %% Gateway to Database
    GatewayModules <-->|JDBC Transactions / HikariCP| POSTGRES

    %% Gateway to External Auth / SMTP
    AUTH_MOD <-->|OAuth2 Authorization Code| GOOGLE_AUTH & GITHUB_AUTH
    AUTH_MOD -->|STARTTLS / SMTP| GMAIL_SMTP

    %% Gateway to AI Worker
    TASK_MOD -->|Private HTTP Dispatch / Secret Key| WORKER_SVC
    VALIDATOR -->|Prompt Orchestration| OPENROUTER
    OPENROUTER -->|Raw Generative Stream| VALIDATOR
    VALIDATOR -.->|Validated Callback: POST /internal/tasks/{id}/result| TASK_MOD

    classDef client fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1;
    classDef edge fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#334155;
    classDef gateway fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#5b21b6;
    classDef storage fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;
    classDef worker fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#166534;
    classDef external fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#991b1b;

    class WEB,MOB,MENTOR_UI client;
    class CF,TUNNEL edge;
    class SEC_FILTER,AUTH_MOD,CAT_MOD,GRAPH_MOD,ROADMAP_MOD,MENTOR_MOD,ANALYTICS_MOD,TASK_MOD gateway;
    class POSTGRES storage;
    class WORKER_SVC,QUEUE,VALIDATOR worker;
    class GOOGLE_AUTH,GITHUB_AUTH,GMAIL_SMTP,OPENROUTER external;
```

---

### 1.2 Dual-Persona Platform Lifecycle (Learner & Mentor)

```mermaid
flowchart TD
    subgraph StudentJourney ["🎓 Learner Journey"]
        direction TB
        S1(["🔑 Authentication<br/>(OAuth2 / Email+OTP)"]) --> S2["📊 Learner Dashboard<br/>(/dashboard)"]
        S2 --> S3["🎯 Start Adaptive Diagnostic Test<br/>(IRT Rasch Model • Max 9 MCQs)"]
        S3 --> S4["📋 Diagnostic Results Reveal<br/>(Latent Ability θ, Level & Radar)"]
        S4 --> S5["🕸️ Interactive Skill Graph<br/>(Explore 56 Skills in 9 Clusters)"]
        S5 --> S6["🗺️ Personalized AI Roadmap<br/>(Step-by-step Milestones & Time Budget)"]
        S6 --> S7["🛠️ Capstone Project Lab<br/>(Submit GitHub Repo for Automated Audit)"]
        S7 --> S8["💼 Career Hub & AI Mock Interview<br/>(ATS Optimization & Placement Match)"]
        S8 --> S9["🔄 Continuous Growth Checkpoints<br/>(Targeted Re-tests & Frontier Unlock)"]
        S9 -.->|Loop back to update θ| S2
    end

    subgraph MentorJourney ["👨‍🏫 Mentor & Institutional Oversight"]
        direction TB
        M1(["🔑 Mentor Portal Access<br/>(Registration & Approval)"]) --> M2["📊 Mentor Command Center<br/>(/mentor)"]
        M2 --> M3["🔑 Generate Unique Student Invite Key<br/>(UUID Format • /mentor/key)"]
        M3 -.->|Distribute key to cohort| S10["🔗 Student Enters Key<br/>(POST /api/v1/students/mentor-link)"]
        S10 -.-> M4["👥 Student Roster & Live Progress<br/>(/mentor/students)"]
        M4 --> M5["📈 Cohort Competency Analytics<br/>(/mentor/analytics)"]
        M5 --> M6["🏆 Skill Achievement Tracking<br/>(/mentor/skills)"]
        M6 --> M7["🎯 Intervene & Target Interventions<br/>(Weak Area Analysis & Remediation)"]
    end

    classDef student fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e40af;
    classDef mentor fill:#faf5ff,stroke:#a855f7,stroke-width:2px,color:#6b21a8;
    classDef link fill:#fef9c3,stroke:#ca8a04,stroke-width:2px,color:#854d0e;

    class S1,S2,S3,S4,S5,S6,S7,S8,S9 student;
    class M1,M2,M3,M4,M5,M6,M7 mentor;
    class S10 link;
```

---

# 2. System Design

The System Design specifies technical communication protocols, security mechanics, relational database structure, asynchronous message lifecycles, and deterministic database queries.

### 2.1 Network Ingress, Security Boundaries & Protocols

```mermaid
flowchart LR
    subgraph PublicInternet ["Public Internet"]
        USER["Browser / Mobile Client"]
    end

    subgraph IngressZone ["Ingress & Reverse Proxy"]
        CF["Cloudflare Edge<br/>WAF, DDoS, TLS 1.3"]
        TUNNEL["Cloudflare Tunnel Connector"]
    end

    subgraph DMZ ["Spring Boot Gateway (Port 8080)"]
        CORS["CORS Handler<br/>Allowed Origins List"]
        RATE["Rate Limiter<br/>IP / Route Sliding Window"]
        JWT_FILTER["OncePerRequestFilter<br/>JWT Bearer Token Validator"]
        CONTROLLERS["Spring MVC Controllers<br/>@RestController"]
    end

    subgraph PrivateVPC ["Isolated Private Network"]
        DB[("PostgreSQL 16<br/>Port: 5432<br/>SSL Required")]
        WORKER["Node.js AI Worker<br/>Port: 3001<br/>No Public IP"]
    end

    USER -->|HTTPS / Port 443| CF
    CF --> TUNNEL
    TUNNEL -->|HTTP / Local Forward| CORS
    CORS --> RATE
    RATE --> JWT_FILTER
    JWT_FILTER --> CONTROLLERS
    CONTROLLERS -->|HikariCP / Encrypted JDBC| DB
    CONTROLLERS -->|HTTP POST with X-Internal-API-Key| WORKER

    classDef public fill:#f8fafc,stroke:#94a3b8,stroke-width:1.5px,color:#0f172a;
    classDef ingress fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1;
    classDef dmz fill:#f3e8ff,stroke:#9333ea,stroke-width:2px,color:#581c87;
    classDef privateNet fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#14532d;

    class USER public;
    class CF,TUNNEL ingress;
    class CORS,RATE,JWT_FILTER,CONTROLLERS dmz;
    class DB,WORKER privateNet;
```

---

### 2.2 Authentication, JWT & Refresh Token Anti-Theft State Machine

The platform adheres to an uncompromising security model: **Access Tokens are kept strictly in-memory** to neutralize XSS theft. **Refresh Tokens are stored in HttpOnly cookies**, and the backend detects token theft using cryptographic hash rotation.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Web SPA (React)
    participant GW as Spring Boot Gateway
    participant DB as PostgreSQL (refresh_tokens)

    Note over Client,GW: Standard Login / Token Issue
    Client->>GW: POST /api/auth/login { email, password }
    GW->>DB: Verify credentials & BCrypt hash
    GW->>GW: Mint Access Token (JWT, TTL 15m)<br/>Mint Refresh Token (Opaque string, TTL 30d)
    GW->>DB: INSERT token_hash=SHA256(refresh_token), revoked=false
    GW-->>Client: Set-Cookie: refresh_token (HttpOnly, SameSite=Lax)<br/>Body: { accessToken } (Stored in-memory)

    Note over Client,GW: Access Token Expiry & Silent Rotation
    Client->>GW: POST /api/auth/refresh (Cookie: refresh_token)
    GW->>GW: incoming_hash = SHA256(cookie.refresh_token)
    GW->>DB: SELECT * FROM refresh_tokens WHERE token_hash = incoming_hash

    alt Token is valid and revoked == false
        GW->>GW: Mint new Access Token<br/>Mint new Refresh Token
        GW->>DB: UPDATE current SET revoked=true, replaced_by=new_hash<br/>INSERT new refresh_token row
        GW-->>Client: Set-Cookie: new_refresh_token (HttpOnly)<br/>Body: { accessToken: new_access_token }
    else Replay Attack Detected! (revoked == true)
        Note over GW,DB: Security Violation: Previously rotated token reused!
        GW->>DB: UPDATE refresh_tokens SET revoked=true WHERE user_id = token.user_id
        GW-->>Client: HTTP 401 Unauthorized (Clear Cookies)<br/>Forced Logout on all sessions
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

    skills ||--o{ skill_prerequisites : "skill_target"
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
        varchar key_code UK "e.g. MENTOR-XXXX-YYYY"
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
        varchar slug UK "sql-basics"
        varchar name
        varchar cluster "Databases, Security, etc."
        double_precision difficulty "Logit value"
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
        int correct_option "0-indexed; hidden from client"
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

### 2.4 Asynchronous Worker Subsystem & Schema Contract Validation

To safeguard against generative LLM hallucination and keep public HTTP requests under 200ms, all compute-heavy AI tasks run asynchronously via background jobs:

```mermaid
sequenceDiagram
    autonumber
    actor Client as Web Application
    participant GW as Spring Boot Gateway
    participant DB as PostgreSQL
    participant WRK as Node.js AI Worker
    participant LLM as External LLM API

    Client->>GW: POST /api/v1/roadmaps/generate { trackId, targetRole }
    GW->>DB: INSERT INTO tasks (id, status='PENDING', payload)
    GW->>WRK: POST /internal/jobs/dispatch<br/>(Header: X-Internal-API-Key, Body: { taskId, context })
    GW-->>Client: HTTP 202 Accepted { taskId: "...", status: "PENDING" }

    Note over Client,GW: Client polls /api/v1/tasks/{taskId} every 2 seconds

    WRK->>WRK: Enqueue in BullMQ Redis Queue
    WRK->>LLM: Stream Prompt with System Context & Format Rules
    LLM-->>WRK: Raw Generative JSON completion

    Note over WRK: Schema Contract Enforcement
    WRK->>WRK: Validate output against /contracts/roadmap.schema.json

    alt Output violates JSON schema
        WRK->>WRK: Auto-retry with corrective repair prompt (Max 3 attempts)
    else Schema verification PASSED
        WRK->>GW: POST /internal/tasks/{taskId}/result<br/>(Header: X-Internal-API-Key, Body: Validated Roadmap JSON)
        GW->>DB: Save Roadmap & UPDATE tasks SET status='COMPLETED'
        GW-->>WRK: HTTP 200 OK
    end

    Client->>GW: GET /api/v1/tasks/{taskId}
    GW-->>Client: HTTP 200 OK { status: 'COMPLETED', result: { roadmap } }
```

---

### 2.5 Database Query Performance & Direct Anti-Join Mechanics

The Computerized Adaptive Test evaluates millions of question combinations. Rather than loading items into memory or doing slow randomized pagination, the backend executes a **direct indexed anti-join**:

```mermaid
flowchart TD
    START["Client requests next item:<br/>POST /api/v1/assessments/{id}/answers"] --> PERSIST["Save & Flush previous response<br/>UPDATE assessments SET theta = new_theta"]
    PERSIST --> QUERY["Execute Anti-Join Query:<br/>SELECT i FROM AssessmentItem i<br/>LEFT JOIN AssessmentResponse r ON r.item = i AND r.assessment = :assessment<br/>WHERE r.id IS NULL AND i.track = :track AND i.status = 'ACTIVE'<br/>ORDER BY ABS(i.difficulty - :currentTheta) ASC"]
    QUERY --> INDEX_SCAN["Database Engine uses composite index:<br/>idx_items_track_status_diff (track_id, status, difficulty)"]
    INDEX_SCAN --> LIMIT["Fetch Top 1 Record (Limit.of(1))"]
    LIMIT --> EVAL_EXISTS{Item Found?}
    EVAL_EXISTS -- Yes --> SANITIZE["Strip 'correct_option' field<br/>Return DTO to client"]
    EVAL_EXISTS -- No --> TERM["Mark Assessment: stop_reason = 'NO_QUESTIONS_LEFT'<br/>status = 'COMPLETED'"]
```

---

# 3. Low-Level Design (LLD) — All Platform Features

The Low-Level Design dissects every component and feature of the platform down to service calls, branch decisions, and state machine transitions.

---

### 3.1 Feature 1: Authentication & Identity Management

Handles User & Mentor signup, BCrypt hashing, Gmail SMTP 6-digit OTP verification, OAuth2 (Google & GitHub) with Account Linking protection, and secure session establishment.

```mermaid
flowchart TD
    AUTH_START([User Initiates Authentication]) --> AUTH_CHOICE{Auth Method?}

    %% Email + Password Flow
    AUTH_CHOICE -- "Email / Password" --> EP_CHECK{Action?}
    EP_CHECK -- "Register" --> REG_INPUT["Enter Full Name, Email, Password"]
    REG_INPUT --> REG_BCRYPT["Hash Password with BCrypt (Cost: 12)"]
    REG_BCRYPT --> REG_SAVE["Save User (email_verified = false)"]
    REG_SAVE --> OTP_GEN["Generate Cryptographic 6-digit OTP<br/>TTL = 15 minutes"]
    OTP_GEN --> OTP_MAIL["Dispatch Verification Email via Gmail SMTP"]
    OTP_MAIL --> OTP_SCREEN["Display OTP Verification Dialog (/verify-email)"]
    OTP_SCREEN --> OTP_SUBMIT["User submits 6-digit OTP"]
    OTP_SUBMIT --> OTP_VAL{Valid & Unexpired?}
    OTP_VAL -- No --> OTP_ERR["Return 400 Bad Request<br/>(Resend Cooldown: 60s)"]
    OTP_VAL -- Yes --> OTP_VERIFIED["Set email_verified = true<br/>Issue In-Memory JWT & HttpOnly Refresh Token"]

    EP_CHECK -- "Login" --> LOGIN_INPUT["Enter Email & Password"]
    LOGIN_INPUT --> LOGIN_VERIFY{User Exists & Password Matches?}
    LOGIN_VERIFY -- No --> LOGIN_FAIL["Return 401 Unauthorized"]
    LOGIN_VERIFY -- Yes --> LOGIN_V_CHECK{Email Verified?}
    LOGIN_V_CHECK -- No --> LOGIN_UNV["Return 403 Forbidden<br/>Prompt OTP Verification"]
    LOGIN_V_CHECK -- Yes --> LOGIN_SUCCESS["Issue In-Memory JWT & HttpOnly Refresh Token<br/>Redirect to /dashboard"]

    %% OAuth2 Flow
    AUTH_CHOICE -- "OAuth 2.0 (Google / GitHub)" --> OA_START["Redirect user to Provider Login Screen"]
    OA_START --> OA_CALLBACK["Provider redirects to /login/oauth2/code/{provider}"]
    OA_CALLBACK --> OA_EXCHANGE["Spring Security exchanges Code for ID Token / UserInfo"]
    OA_EXCHANGE --> OA_LINK_MATRIX{Account Linking Decision Matrix}

    OA_LINK_MATRIX -- "Provider ID already mapped" --> OA_LOGIN_OK["Authenticate User"]
    OA_LINK_MATRIX -- "New Email" --> OA_CREATE["Provision New User (email_verified=true)<br/>Link OAuth Account"]
    OA_LINK_MATRIX -- "Unverified Existing User" --> OA_RECLAIM["Reclaim Account, Verify Email,<br/>Clear old password & Link OAuth"]
    OA_LINK_MATRIX -- "Existing Verified Password Account" --> OA_BLOCK["Prevent Account Takeover!<br/>Reject with OAUTH_ACCOUNT_EXISTS<br/>Require Password Login first"]

    OA_LOGIN_OK & OA_CREATE & OA_RECLAIM --> OA_CODE_GEN["Issue One-Time UUID Login Code (TTL: 60s)"]
    OA_CODE_GEN --> OA_FRONTEND_REDIRECT["Redirect: /auth/callback?code=<uuid>"]
    OA_FRONTEND_REDIRECT --> OA_EXCHANGE_API["Client calls: POST /api/auth/oauth2/exchange"]
    OA_EXCHANGE_API --> OA_FINAL["Receive In-Memory JWT & HttpOnly Cookie<br/>Navigate to /dashboard"]

    classDef proc fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1;
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;
    classDef terminal fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#166534;
    classDef error fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#991b1b;

    class REG_INPUT,REG_BCRYPT,REG_SAVE,OTP_GEN,OTP_MAIL,OTP_SCREEN,OTP_SUBMIT,LOGIN_INPUT,OA_START,OA_CALLBACK,OA_EXCHANGE,OA_CREATE,OA_RECLAIM,OA_CODE_GEN,OA_FRONTEND_REDIRECT,OA_EXCHANGE_API proc;
    class AUTH_CHOICE,EP_CHECK,OTP_VAL,LOGIN_VERIFY,LOGIN_V_CHECK,OA_LINK_MATRIX decision;
    class OTP_VERIFIED,LOGIN_SUCCESS,OA_LOGIN_OK,OA_FINAL terminal;
    class OTP_ERR,LOGIN_FAIL,LOGIN_UNV,OA_BLOCK error;
```

---

### 3.2 Feature 2: IRT 1-PL Rasch Computerized Adaptive Testing (CAT) Engine

Implements the Item Response Theory engine with standard error calculation, ability adjustments, anti-join selection, and stopping criteria.

```mermaid
flowchart TD
    START_ASSESSMENT([User clicks: Start Diagnostic Test]) --> INIT_CAT["Initialize Assessment Entity<br/>θ_0 = 0.0, SE = 1.0, QuestionsAnswered = 0<br/>Status = 'IN_PROGRESS'"]
    INIT_CAT --> SELECT_ITEM["Call: AssessmentItemRepository.findNext(assessmentId, currentTheta)<br/>Direct SQL Anti-Join filtering already-answered items"]
    SELECT_ITEM --> CHECK_EMPTY{Any Items Left?}
    
    CHECK_EMPTY -- No --> FINISH_EXHAUST["Stop Reason: NO_QUESTIONS_LEFT<br/>Calculate Final θ"]
    CHECK_EMPTY -- Yes --> DELIVER["Send Question Item to Frontend<br/>(Options randomized, correct_option stripped)"]
    
    DELIVER --> WAIT_ANSWER["Learner submits choice: POST /api/v1/assessments/{id}/answers"]
    WAIT_ANSWER --> SCORE_EVAL{Is Selected Option Correct?}
    
    SCORE_EVAL -- Correct (1) --> THETA_UP["Update Ability: θ_k+1 = θ_k + 0.35 logits<br/>Record direction = UP"]
    SCORE_EVAL -- Incorrect (0) --> THETA_DOWN["Update Ability: θ_k+1 = θ_k - 0.35 logits<br/>Record direction = DOWN"]
    
    THETA_UP & THETA_DOWN --> UPDATE_STATS["Save AssessmentResponse Entity<br/>Increment QuestionsAnswered<br/>Calculate new Standard Error (SE)"]
    
    UPDATE_STATS --> STOP_RULES{Evaluate Stopping Criteria}
    
    STOP_RULES -- "QuestionsAnswered >= 9 (Hard Cap)" --> FINISH_MAX["Stop Reason: MAX_ITEMS"]
    STOP_RULES -- "QuestionsAnswered >= 5 AND Direction Reversals >= 2" --> FINISH_CONV["Stop Reason: LEVEL_CONFIRMED<br/>(Oscillating around true baseline)"]
    STOP_RULES -- "Standard Error SE <= 0.45" --> FINISH_SE["Stop Reason: PRECISION_REACHED"]
    STOP_RULES -- "Criteria not met" --> SELECT_ITEM

    FINISH_EXHAUST & FINISH_MAX & FINISH_CONV & FINISH_SE --> CALC_LEVEL{Map Latent Ability θ to Competency}
    CALC_LEVEL -- "θ < -0.5" --> LVL_BEG["Competency: BEGINNER"]
    CALC_LEVEL -- "-0.5 <= θ <= 0.75" --> LVL_INT["Competency: INTERMEDIATE"]
    CALC_LEVEL -- "θ > 0.75" --> LVL_ADV["Competency: ADVANCED"]

    LVL_BEG & LVL_INT & LVL_ADV --> PAINT_GRAPH["Trigger Skill Graph Classification<br/>Save Assessment Status = 'COMPLETED'"]
    PAINT_GRAPH --> REVEAL_RESULTS(["Display Test Scorecard, Radar Breakdown & Action Plan"])

    classDef action fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e40af;
    classDef check fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;
    classDef done fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#166534;

    class INIT_CAT,SELECT_ITEM,DELIVER,WAIT_ANSWER,THETA_UP,THETA_DOWN,UPDATE_STATS,PAINT_GRAPH action;
    class CHECK_EMPTY,SCORE_EVAL,STOP_RULES,CALC_LEVEL check;
    class FINISH_EXHAUST,FINISH_MAX,FINISH_CONV,FINISH_SE,LVL_BEG,LVL_INT,LVL_ADV,REVEAL_RESULTS done;
```

---

### 3.3 Feature 3: Topological Skill Graph (DAG) & Dynamic State Transitions

Maintains 56 atomic skills, prerequisite hierarchies, cycle detection on startup, and dynamic tri-state (`MASTERED`, `FRONTIER`, `LOCKED`) visual classification.

```mermaid
flowchart TD
    subgraph BootTime ["Application Startup Verification (AssessmentDataLoader)"]
        LOAD_YAML["Read backend-skills.yaml (56 Skills, 72 Edges)"] --> CYCLE_DET["Execute DFS Cycle Detection Algorithm"]
        CYCLE_DET --> CYCLE_CHECK{Cycles Detected?}
        CYCLE_CHECK -- Yes --> THROW_BOOT_ERR["FATAL: Reject Startup! Print Circular Dependency Stack"]
        CYCLE_CHECK -- No --> ORPHAN_CHECK["Verify Prerequisite Foreign Keys"]
        ORPHAN_CHECK --> INVERSION_CHECK["Check Difficulty Inversions<br/>(Prerequisite diff <= Target diff)"]
        INVERSION_CHECK --> SEED_DB["Persist / Sync Skills & Prerequisites in PostgreSQL"]
    end

    subgraph RuntimeClassification ["Runtime Skill State Engine (User Ability θ*)"]
        START_EVAL["Evaluate Skill S for User with Final Ability θ*"] --> CHECK_PRE_SELECTED{Was S declared in Onboarding<br/>OR S.difficulty <= θ* - 0.25?}
        CHECK_PRE_SELECTED -- Yes --> MARK_MASTERED["State = MASTERED<br/>(Rendered in Vibrant Green / Solid Border)"]
        
        CHECK_PRE_SELECTED -- No --> CHECK_PREREQS{Are ALL direct prerequisites<br/>of S currently MASTERED?}
        CHECK_PREREQS -- Yes --> MARK_FRONTIER["State = FRONTIER (Ready to Learn!)<br/>(Rendered in Animated Purple / Pulse Effect)"]
        CHECK_PREREQS -- No --> MARK_LOCKED["State = LOCKED (Missing Foundation)<br/>(Rendered in Muted Slate / Lock Icon)"]
    end

    subgraph InteractiveUI ["Web Client Skill Graph Interaction (/graph)"]
        MARK_MASTERED & MARK_FRONTIER & MARK_LOCKED --> RENDER_SVG["Interactive Skill Graph (D3 / SVG Canvas)<br/>Default: 1 Block Selected (e.g., Foundations)"]
        RENDER_SVG --> USER_CLICK_NODE["User Clicks Node in Canvas"]
        USER_CLICK_NODE --> OPEN_DRAWER["Slide-over Drawer with Skill Deep-Dive:<br/>Prerequisites, Dependents, Estimated Hours, Take Quiz"]
        OPEN_DRAWER --> TAKE_TOPIC_QUIZ["Learner takes Targeted 3-Question Topic Quiz"]
        TAKE_TOPIC_QUIZ --> QUIZ_RESULT{Passed 100%?}
        QUIZ_RESULT -- Yes --> PROMOTE_SKILL["Promote Skill S -> MASTERED<br/>Dynamically Re-evaluate Downstream Skills<br/>Unlock New FRONTIER Nodes!"]
        QUIZ_RESULT -- No --> RETRY_TOPIC["Offer Targeted Learning Resources"]
    end

    classDef proc fill:#f0f9ff,stroke:#0284c7,stroke-width:2px,color:#0369a1;
    classDef test fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;
    classDef success fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#166534;
    classDef warning fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#991b1b;

    class LOAD_YAML,CYCLE_DET,ORPHAN_CHECK,INVERSION_CHECK,SEED_DB,START_EVAL,RENDER_SVG,USER_CLICK_NODE,OPEN_DRAWER,TAKE_TOPIC_QUIZ,RETRY_TOPIC proc;
    class CYCLE_CHECK,CHECK_PRE_SELECTED,CHECK_PREREQS,QUIZ_RESULT test;
    class MARK_MASTERED,MARK_FRONTIER,PROMOTE_SKILL success;
    class THROW_BOOT_ERR,MARK_LOCKED warning;
```

---

### 3.4 Feature 4: AI Learning Roadmap Generation & Milestone Progression

Transforms assessment gaps and user time availability into an ordered, milestone-driven curriculum with weekly pacing.

```mermaid
flowchart TD
    TRIGGER_ROADMAP([Learner requests personalized roadmap]) --> EXTRACT_GAPS["Gateway extracts Learner Profile:<br/>- Target Track (Backend Engineering)<br/>- Calibrated Ability θ<br/>- FRONTIER Skills list<br/>- Weekly Study Hours Budget"]
    EXTRACT_GAPS --> DISPATCH_JOB["Create Task (Status: PENDING)<br/>Dispatch Async Job to Node.js AI Worker"]
    DISPATCH_JOB --> PROMPT_BUILD["AI Worker constructs LLM Payload:<br/>Topological Graph Context + Pedagogical Guidelines"]
    PROMPT_BUILD --> LLM_GEN["Invoke LLM via OpenRouter<br/>(Gemini 2.5 Flash / Claude 3.5 Sonnet)"]
    LLM_GEN --> RAW_PAYLOAD["Receive Raw Milestone JSON"]
    
    RAW_PAYLOAD --> VALIDATE_SCHEMA{"Validate JSON against<br/>contracts/roadmap.schema.json"}
    VALIDATE_SCHEMA -- Fails Schema --> REPAIR_PROMPT["Send Repair Prompt to LLM with validation errors"] --> LLM_GEN
    VALIDATE_SCHEMA -- Passes Schema --> WORKER_CALLBACK["POST /internal/tasks/{id}/result<br/>Gateway saves Roadmap & Milestones"]
    
    WORKER_CALLBACK --> CLIENT_POLL["Web Client Polling detects status = 'COMPLETED'"]
    CLIENT_POLL --> RENDER_ROADMAP["Display Milestone Timeline (/roadmap):<br/>- Phase 1: Core Fundamentals<br/>- Phase 2: High-Yield APIs & Storage<br/>- Phase 3: Distributed Systems"]
    
    RENDER_ROADMAP --> USER_STUDIES["Learner works on active milestone topics"]
    USER_STUDIES --> TOGGLE_ITEM["Learner marks sub-task complete: PUT /api/v1/milestones/{id}"]
    TOGGLE_ITEM --> RECALC_PROGRESS["Update Completion % & Streak Days"]
    RECALC_PROGRESS --> CHECK_PHASE{All milestone tasks complete?}
    CHECK_PHASE -- Yes --> UNLOCK_NEXT_PHASE["Trigger Capstone Challenge for Phase<br/>Unlock Phase Badge"]
    CHECK_PHASE -- No --> USER_STUDIES

    classDef task fill:#f8fafc,stroke:#64748b,stroke-width:2px,color:#1e293b;
    classDef ai fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#4c1d95;
    classDef ui fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#14532d;
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;

    class TRIGGER_ROADMAP,EXTRACT_GAPS,DISPATCH_JOB,WORKER_CALLBACK,USER_STUDIES,TOGGLE_ITEM,RECALC_PROGRESS task;
    class PROMPT_BUILD,LLM_GEN,RAW_PAYLOAD,REPAIR_PROMPT ai;
    class CLIENT_POLL,RENDER_ROADMAP,UNLOCK_NEXT_PHASE ui;
    class VALIDATE_SCHEMA,CHECK_PHASE decision;
```

---

### 3.5 Feature 5: Capstone Project Verification Lab (GitHub Audit)

Provides verifiable proof of skill by auditing learner code repositories for production architectural patterns, unit test coverage, and security best practices.

```mermaid
flowchart TD
    START_SUBMISSION([Learner completes Project Milestone]) --> SUBMIT_REPO["Learner enters GitHub Repository URL<br/>e.g. https://github.com/user/distributed-cache-api"]
    SUBMIT_REPO --> GATEWAY_VALIDATE["Gateway validates URL syntax & public accessibility"]
    GATEWAY_VALIDATE --> DISPATCH_AUDIT["Enqueue PROJECT_VERIFY task to AI Worker"]
    
    DISPATCH_AUDIT --> CLONE_META["AI Worker fetches Repo Tree & Key Files:<br/>README.md, Dockerfile, pom.xml/package.json,<br/>Core Domain Services, Test Files"]
    
    CLONE_META --> LINTER_CHECK["Automated Lint & Structure Scan:<br/>- Presence of unit & integration tests<br/>- Separation of concerns (Layered vs Spaghetti)<br/>- OWASP Anti-patterns (Hardcoded secrets, SQL injection)"]
    
    LINTER_CHECK --> LLM_CODE_EVAL["LLM Deep Architecture Review:<br/>- Error Handling & Resilience<br/>- Clean Code & SOLID principles<br/>- API Documentation (OpenAPI/Swagger)"]
    
    LLM_CODE_EVAL --> SCORE_AGGREGATE["Compute Project Benchmark Score (0 - 100):<br/>Architecture (30) • Tests (25) • Code Quality (25) • Security (20)"]
    
    SCORE_AGGREGATE --> PASS_THRESHOLD{Score >= 75?}
    
    PASS_THRESHOLD -- Yes --> ISSUE_CREDENTIAL["Generate Verifiable Project Credential<br/>Cryptographic Signature & Unique Verification ID"]
    ISSUE_CREDENTIAL --> UPDATE_PROFILE["Attach Badge to User Profile & Mentor Dashboard<br/>Mark Skill Graph Project Node: VERIFIED"]
    
    PASS_THRESHOLD -- No --> GENERATE_FEEDBACK["Generate Actionable Code Review Report:<br/>Line-by-line feedback & recommended PR changes"]
    GENERATE_FEEDBACK --> PRESENT_REPORT(["Deliver Feedback in /projects Lab<br/>Allow unlimited re-submission"])

    classDef start fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#14532d;
    classDef check fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;
    classDef alert fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#991b1b;
    classDef ok fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#166534;

    class START_SUBMISSION,SUBMIT_REPO,GATEWAY_VALIDATE,DISPATCH_AUDIT,CLONE_META,LINTER_CHECK,LLM_CODE_EVAL,SCORE_AGGREGATE start;
    class PASS_THRESHOLD check;
    class GENERATE_FEEDBACK,PRESENT_REPORT alert;
    class ISSUE_CREDENTIAL,UPDATE_PROFILE ok;
```

---

### 3.6 Feature 6: Test History & Deep Psychometric Analytics Engine

Aggregates learner ability curves over time, domain cluster mastery, and detailed question-by-question metrics for reflective self-improvement.

```mermaid
flowchart TD
    REQ_ANALYTICS([Learner navigates to /analytics or /history]) --> FETCH_HIST["GET /api/v1/assessments/history<br/>Spring Boot joins Assessment & Response tables"]
    
    FETCH_HIST --> AGGREGATE["Aggregate Metrics in AnalyticsService:<br/>- Ability Trajectory θ over chronological tests<br/>- Cluster Mastery % (9 Domain Clusters)<br/>- Average Question Time & Discrimination Index<br/>- Top Strengths vs Critical Deficits"]
    
    AGGREGATE --> DATA_PAYLOAD["Return Structured Analytics DTO"]
    
    DATA_PAYLOAD --> VIZ_HIST["Render Test History (/history):<br/>- Interactive Test Runs List<br/>- Stopping Reason Pills (Level Confirmed, Max Items)<br/>- Final Ability Score & Date/Time"]
    
    DATA_PAYLOAD --> VIZ_RADAR["Render Domain Radar Chart (/analytics):<br/>- Foundations vs Architecture vs Security<br/>- Comparison against Industry Benchmark"]
    
    DATA_PAYLOAD --> VIZ_TRAJECTORY["Render θ Progress Trajectory Line Chart:<br/>Visually tracking growth from -1.5 (Beginner) to +1.8 (Advanced)"]
    
    DATA_PAYLOAD --> VIZ_DRILLDOWN["Render Item-by-Item Review Modal:<br/>- Question Stem & Options<br/>- Calibrated Difficulty b_i vs Learner Ability<br/>- Correct Answer & Full Technical Explanation"]

    classDef flow fill:#f1f5f9,stroke:#475569,stroke-width:2px,color:#0f172a;
    classDef render fill:#eff6ff,stroke:#2563eb,stroke-width:2px,color:#1e3a8a;

    class REQ_ANALYTICS,FETCH_HIST,AGGREGATE,DATA_PAYLOAD flow;
    class VIZ_HIST,VIZ_RADAR,VIZ_TRAJECTORY,VIZ_DRILLDOWN render;
```

---

### 3.7 Feature 7: Mentor Management, Cohort Analytics & Invite Key Linking

Empowers enterprise educators, college professors, and senior engineering mentors to monitor student cohorts, audit skill gaps, and dispense guidance.

```mermaid
flowchart TD
    subgraph MentorOnboarding ["1. Mentor Provisioning & Key Generation"]
        M_REG["Mentor registers via /signup (Selects: 'Mentor Role')"] --> M_FORM["Submits Full Name, Designation, Org & Password"]
        M_FORM --> M_OTP["Verifies Email via 6-digit SMTP OTP"]
        M_OTP --> M_DASH["Accesses Mentor Shell (/mentor)"]
        M_DASH --> GEN_KEY["Click: 'Generate Cohort Invite Key' (/mentor/key)"]
        GEN_KEY --> KEY_SERVICE["MentorKeyService creates unique Key:<br/>e.g. MENTOR-UNIX-8492 (Status: ACTIVE, Max: 50)"]
    end

    subgraph StudentLinking ["2. Student Cohort Association"]
        DISTRIBUTE["Mentor shares Key with students"] --> STU_ENTER["Student opens Settings / Dashboard<br/>Submits Key: POST /api/v1/students/mentor-link"]
        STU_ENTER --> VAL_KEY{"Key Validator Checks"}
        VAL_KEY -- "Key Revoked or Expired" --> KEY_ERR["Return 400 Bad Request"]
        VAL_KEY -- "Student already linked" --> KEY_EXISTS["Return: 'Already linked to this mentor'"]
        VAL_KEY -- "Valid & Available" --> CREATE_LINK["INSERT INTO student_mentor_links<br/>Increment mentor_keys.current_students"]
    end

    subgraph MentorWorkspace ["3. Cohort Monitoring & Analytics (/mentor/*)"]
        CREATE_LINK --> LIVE_ROSTER["Mentor opens /mentor/students:<br/>Full list of linked learners, latest θ score, last active time"]
        LIVE_ROSTER --> COHORT_STATS["Mentor opens /mentor/analytics:<br/>- Cohort Average Ability Curve<br/>- Weakest Skill Clusters (e.g. Concurrency & Security)<br/>- Assessment Completion Rate"]
        COHORT_STATS --> SKILL_AUDIT["Mentor opens /mentor/skills:<br/>Drill down into individual student skill nodes (Mastered vs Stuck)"]
        SKILL_AUDIT --> TARGET_INTERVENTION(["Mentor initiates targeted curriculum review or assignment"])
    end

    classDef mInit fill:#faf5ff,stroke:#9333ea,stroke-width:2px,color:#581c87;
    classDef sLink fill:#eff6ff,stroke:#2563eb,stroke-width:2px,color:#1e3a8a;
    classDef mWork fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#14532d;
    classDef err fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#991b1b;

    class M_REG,M_FORM,M_OTP,M_DASH,GEN_KEY,KEY_SERVICE mInit;
    class DISTRIBUTE,STU_ENTER,CREATE_LINK sLink;
    class LIVE_ROSTER,COHORT_STATS,SKILL_AUDIT,TARGET_INTERVENTION mWork;
    class KEY_ERR,KEY_EXISTS err;
```

---

### 3.8 Feature 8: Career Hub, ATS Optimization & AI Mock Interview Suite

Closes the employability loop by scoring resumes against target job specs, identifying missing keywords, and executing real-time AI mock interviews.

```mermaid
flowchart TD
    START_CAREER([Learner navigates to /career]) --> CAREER_SELECT["Select Target Career Role<br/>(e.g., Senior Backend Engineer / Microservices Specialist)"]
    
    CAREER_SELECT --> ATS_UPLOAD["Upload Resume (PDF / DOCX / Text)"]
    ATS_UPLOAD --> PARSE_RESUME["Extract Extracted Skills, Experience & Projects"]
    
    PARSE_RESUME --> MATCH_GRAPH["Cross-reference with Verified Skill Graph & Assessments"]
    MATCH_GRAPH --> ATS_SCORING["Compute ATS Match Score (0 - 100%):<br/>- Keywords Present vs Missing<br/>- Verified Skills vs Self-Reported Claims<br/>- High-Impact Action Verb Suggestions"]
    
    ATS_SCORING --> PRESENT_ATS["Render ATS Report (/career):<br/>Missing Keywords, Formatting Warnings, Matched Job Postings"]
    
    PRESENT_ATS --> START_INTERVIEW["Click: 'Start AI Technical Mock Interview'"]
    START_INTERVIEW --> INTERVIEW_SESSION["AI Worker initiates conversational interview session:<br/>Generates questions tailored to learner's FRONTIER skills"]
    
    INTERVIEW_SESSION --> USER_ANSWER["Learner types or speaks response"]
    USER_ANSWER --> AI_RUBRIC["AI evaluates on Standard Rubric:<br/>1. Technical Accuracy<br/>2. Depth of Architectural Reasoning<br/>3. Communication Clarity"]
    
    AI_RUBRIC --> NEXT_Q{Interview finished? (5 Questions)}
    NEXT_Q -- No --> INTERVIEW_SESSION
    NEXT_Q -- Yes --> SCORECARD(["Generate Comprehensive Interview Scorecard<br/>Strengths, Blindspots, Sample Model Answers & Placement Recommendation"])

    classDef cHub fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e40af;
    classDef ats fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;
    classDef interview fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#4c1d95;
    classDef done fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#166534;

    class START_CAREER,CAREER_SELECT cHub;
    class ATS_UPLOAD,PARSE_RESUME,MATCH_GRAPH,ATS_SCORING,PRESENT_ATS ats;
    class START_INTERVIEW,INTERVIEW_SESSION,USER_ANSWER,AI_RUBRIC interview;
    class NEXT_Q,SCORECARD done;
```

---

# 4. Cross-Cutting Architectural Invariants & Data Flow Matrix

To ensure system reliability, enterprise maintainability, and zero regression during rapid development, the platform adheres to this strict Architectural Invariants Matrix:

| Invariant Category | Strict Architectural Rule | Enforcement Mechanism |
| :--- | :--- | :--- |
| **Authentication & Tokens** | Access tokens are strictly **IN-MEMORY** on client. Never in `localStorage` or `sessionStorage`. | Enforced in `api.js` (`let inMemoryToken = null;`). Refresh tokens stored strictly as SHA-256 hashes in database. |
| **Token Anti-Theft** | If a previously rotated refresh token is presented, revoke all active sessions for that user. | Enforced in `AuthTokenServiceImpl.java` (`token.isRevoked()` triggers batch revocation). |
| **Psychometric Integrity** | The CAT engine must produce bit-identical logit results for identical input sequences. | Enforced via pure deterministic Java math in `AssessmentService.java` (no random jitter). |
| **Anti-Join Item Delivery** | Already-answered question items must never be served twice in the same assessment. | Enforced via SQL `LEFT JOIN AssessmentResponse r ON r.item_id = i.id AND r.assessment_id = :id WHERE r.id IS NULL`. |
| **Startup Graph Safety** | The backend must abort boot sequence if the skill DAG has circular dependencies. | Enforced via DFS recursion check in `AssessmentDataLoader.java`. |
| **Worker Isolation** | The AI Worker never accesses the database directly. Only communicates via Gateway callbacks. | Private VPC network; requests authenticated via secret header `X-Internal-API-Key`. |
| **Contract Strictness** | Every generative payload must validate against Draft 7 JSON schemas before ingestion. | Schema validation in worker (`contracts/*.json`) and secondary schema assertion in Gateway. |
| **CORS & Access Control** | Strictly allow approved origins only (`localhost:5173`, `localhost:3000`, `capacitor://localhost`). | Enforced via `SecurityConfig.java` using `app.auth.cors.allowed-origins`. |
| **Database Integrity** | Flyway migrations manage schema evolution; foreign keys enforce referential cascades. | PostgreSQL constraints (`ON DELETE CASCADE` on responses, tokens, and prerequisites). |

---

> Built with precision by **Team Unix** (Lakshmi Narain College of Technology, Bhopal) for the **EPAM Systems CoE Programme**.  
> Lead Maintainer: **Dev Sharma** (`dev47929@gmail.com`)

