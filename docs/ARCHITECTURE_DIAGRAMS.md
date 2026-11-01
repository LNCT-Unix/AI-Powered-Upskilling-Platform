# Architecture Diagrams — Implemented Scope

> **Repository:** AI-Powered Upskilling Platform  
> **Diagram format:** Mermaid  
> **Scope rule:** This document contains diagrams **only for code that exists and runs** in the repository. Planned or placeholder features are listed in [Section 12](#12-deferred-features-not-diagrammed) and intentionally excluded from the diagrams.  
> **Last verified against source:** November 2026

---

## Table of Contents

1. [Implemented Scope and Evidence](#1-implemented-scope-and-evidence)
2. [System Context](#2-system-context)
3. [Deployment and Runtime Topology](#3-deployment-and-runtime-topology)
4. [Backend Gateway Module Architecture](#4-backend-gateway-module-architecture)
5. [Client Architecture: Web and Android](#5-client-architecture-web-and-android)
6. [Authentication and Security](#6-authentication-and-security)
7. [Assessment Engine: CAT and Skill Graph](#7-assessment-engine-cat-and-skill-graph)
8. [Persistence Model](#8-persistence-model)
9. [Mentor Subsystem](#9-mentor-subsystem)
10. [AI Voice Companion and Assistant Service](#10-ai-voice-companion-and-assistant-service)
11. [Implemented API and Frontend Route Map](#11-implemented-api-and-frontend-route-map)
12. [Deferred Features (Not Diagrammed)](#12-deferred-features-not-diagrammed)
13. [Verification Topology](#13-verification-topology)

---

## 1. Implemented Scope and Evidence

### 1.1 Implemented subsystems

| Subsystem | Evidence in repository | Diagrammed |
|---|---|---|
| Spring Boot Gateway | `gateway/ai-upskilling-platform/src/main/java` | Yes |
| Authentication and OAuth2 | `authentication/**` | Yes |
| Adaptive assessment engine | `assessment/**` | Yes |
| Mentor management | `mentor/**` | Yes |
| User profile | `user/**` | Yes |
| Shared API/error envelope | `shared/**` | Yes |
| React web application | `web-app/src` | Yes |
| Capacitor Android wrapper | `mobile-app/` + `web-app/src/services/mobile*.js` | Yes |
| SkillUp Assistant | `skillup-assistant/src` | Yes |
| PostgreSQL persistence | JPA entities + `docker-compose.yml` | Yes |
| Docker Compose topology | `docker-compose.yml` | Yes |
| Gateway integration tests | `src/test/java/**` | Yes |

### 1.2 Not implemented, therefore not diagrammed as runtime architecture

- AI roadmap generation and roadmap persistence.
- Capstone project verification and badge/certificate issuance.
- Career hub, ATS matching, and mock interviews.
- The `ai-worker/` service (contains README files only; no implementation).
- BullMQ/Redis background processing (Redis container is provisioned, but current Java/Node code does not use it).
- Mobile native app written in React Native/Flutter (the implemented mobile path is a Capacitor wrapper around the web build).

---

## 2. System Context

```mermaid
flowchart LR
    subgraph clients["Client Applications"]
        WEB["Web App<br/>React 19 + Vite<br/>localhost:5173"]
        MOBILE["Android App<br/>Capacitor wrapper<br/>loads web-app/dist"]
    end

    GW["API Gateway<br/>Spring Boot 3.x / Java 21<br/>localhost:8080"]
    ASSIST["SkillUp Assistant<br/>Node.js + Express<br/>localhost:3002"]
    DB[("PostgreSQL 16<br/>UpskillDB")]
    SMTP["Gmail SMTP"]
    GOOGLE["Google OIDC"]
    GITHUB["GitHub OAuth"]
    LLM["OpenRouter LLM"]
    TTS["TTS Provider<br/>Google / OpenAI / ElevenLabs"]

    WEB -->|"REST JSON<br/>Authorization: Bearer JWT<br/>credentials: include"| GW
    MOBILE -->|"REST JSON<br/>Authorization: Bearer JWT<br/>refresh token in device storage"| GW
    GW -->|"JPA / JDBC"| DB
    GW -->|"OTP and password reset email"| SMTP
    GW <-->|"OAuth2 / OIDC handshake"| GOOGLE
    GW <-->|"OAuth2 handshake"| GITHUB
    GW -->|"Voice feedback request<br/>X-Internal-API-Key"| ASSIST
    ASSIST -->|"Chat completion request"| LLM
    ASSIST -->|"Speech synthesis"| TTS
```

**Notes**

- The web app never stores the JWT access token in `localStorage` or `sessionStorage`; it is held in memory in `web-app/src/services/api.js`. The refresh token is an `HttpOnly` cookie on web.
- The Android build is a Capacitor shell whose `webDir` points at `web-app/dist`. It uses `Capacitor.Preferences` for the refresh token instead of cookies.
- The voice companion request is proxied through the gateway, keeping `X-Internal-API-Key` server-side.
- The assistant also exposes `/api/assistant/chat`; the current landing-page chatbot is a local scripted FAQ, not a live call to that endpoint.

---

## 3. Deployment and Runtime Topology

```mermaid
flowchart TB
    subgraph compose["docker-compose.yml"]
        DB["db<br/>postgres:16-alpine<br/>UpskillDB :5432"]
        REDIS["redis<br/>redis:7-alpine :6379<br/>provisioned but unused by current code"]
        GW["gateway<br/>Dockerfile<br/>:8080"]
        WEB["web-app<br/>Dockerfile<br/>:5173"]
    end

    ASSIST["skillup-assistant<br/>started separately<br/>:3002"]
    MOBILE["mobile-app<br/>Capacitor + Android Studio"]
    BROWSER["Browser<br/>localhost:5173"]

    BROWSER -->|"loads"| WEB
    WEB -->|"API calls"| GW
    GW -->|"depends_on db healthy"| DB
    WEB -->|"static build copied into android assets"| MOBILE
    GW -->|"internal HTTP"| ASSIST
    GW -->|"SMTP"| SMTP["Gmail SMTP"]
    GW -->|"OAuth2"| OAUTH["Google / GitHub"]
    ASSIST --> LLM["OpenRouter"]
    ASSIST --> TTS["TTS Provider"]
```

**Runtime modes**

| Mode | Gateway | Web app | Assistant | Database |
|---|---|---|---|---|
| Docker Compose | Container `upskill-gateway` | Container `upskill-webapp` | Not in compose | Container `upskill-postgres` |
| Local development | `mvnw.cmd spring-boot:run` | `npm run dev` | `npm start` in `skillup-assistant` | Local PostgreSQL or Compose DB |

---

## 4. Backend Gateway Module Architecture

```mermaid
flowchart TB
    subgraph gateway["Gateway application: com.unix.aiupskilling"]
        SEC["authentication.config<br/>SecurityConfig<br/>JwtAuthenticationFilter<br/>AuthProperties<br/>JSON entry point and denied handler"]

        subgraph auth["authentication"]
            AC["Controllers<br/>EmailAuth, AuthToken, PasswordReset, AuthLink, MentorAuth"]
            ASVC["Services<br/>EmailAuth, AuthToken, EmailVerification,<br/>PasswordReset, OAuth linking, Rate limiting"]
            AOAuth["security.oauth2<br/>Google OIDC and GitHub user services<br/>success and failure handlers<br/>authorization request resolver"]
            AENT["Entities<br/>User, OAuthAccount, RefreshToken,<br/>EmailVerificationToken, PasswordResetToken,<br/>OAuthLoginCode, OAuthLinkIntent"]
            AR["Repositories"]
        end

        subgraph assess["assessment"]
            EC["AssessmentController"]
            ESVC["AssessmentService<br/>IRT staircase, stop rules,<br/>skill-state classification,<br/>skill unlock quiz, voice proxy"]
            ELOAD["AssessmentDataLoader<br/>DAG validation and seed"]
            EENT["Entities<br/>Track, Skill, AssessmentItem,<br/>Assessment, AssessmentResponse,<br/>AssessmentSkillResult"]
            ER["Repositories"]
        end

        subgraph mentor["mentor"]
            MC["Controllers<br/>Dashboard, Students, Achievements,<br/>Analytics, Key, Profile, Student link"]
            MSVC["Services + implementations"]
            MLOAD["MentorDataLoader<br/>demo mentor seed"]
            MENT["Entities<br/>MentorProfile, MentorKey,<br/>MentorStudentLink, SkillAchievement"]
            MR["Repositories"]
        end

        subgraph user["user"]
            UC["UserController<br/>/api/users/profile"]
            USVC["UserService"]
            UENT["User entity and repository"]
        end

        subgraph shared["shared"]
            SHR["ApiResponse, PagedResponse<br/>GlobalExceptionHandler<br/>HealthController, JacksonConfig"]
        end
    end

    DB[("PostgreSQL")]

    AC --> ASVC
    ASVC --> AENT
    ASVC --> AR
    AOAuth --> ASVC
    SEC --> AC
    SEC --> EC
    SEC --> MC
    EC --> ESVC
    ESVC --> ER
    ELOAD --> ER
    MC --> MSVC
    MSVC --> MR
    MLOAD --> MR
    UC --> USVC
    USVC --> UENT
    AR --> DB
    ER --> DB
    MR --> DB
    UENT --> DB
    AENT --> DB
    MENT --> DB
    EENT --> DB
    auth --> shared
    assess --> shared
    mentor --> shared
    user --> shared
```

**Module responsibilities**

| Module | Key classes | Responsibility |
|---|---|---|
| `authentication` | `SecurityConfig`, `JwtAuthenticationFilter`, `AuthTokenServiceImpl`, `EmailAuthServiceImpl`, `OAuthAccountLinkingServiceImpl` | Stateless JWT API security, email + OTP, OAuth2, refresh rotation, account linking, password reset |
| `assessment` | `AssessmentController`, `AssessmentService`, `AssessmentDataLoader` | Adaptive CAT lifecycle, item selection, theta calculation, skill states, node unlock quiz, voice proxy |
| `mentor` | `MentorDashboardController`, `MentorStudentController`, `MentorAnalyticsController`, `MentorKeyController` | Mentor profile, student linking, cohort dashboard, analytics, achievements |
| `user` | `User`, `UserController`, `UserService` | Identity entity and profile read/update |
| `shared` | `ApiResponse`, `GlobalExceptionHandler`, `HealthController` | Uniform response envelope, error normalization, health endpoint |

---

## 5. Client Architecture: Web and Android

```mermaid
flowchart LR
    subgraph routes["React Router: router.jsx"]
        PUBLIC["Public routes<br/>/  /login  /signup<br/>/forgot-password<br/>/auth/callback  /auth/error<br/>/verify-email"]
        SHELL["DashboardShell routes<br/>/dashboard  /assessment  /history<br/>/graph  /analytics"]
        MENTOR["/mentor routes<br/>Overview, Students, Skills,<br/>Analytics, Key, Profile"]
    end

    subgraph pages["Pages"]
        LAND["LandingPage"]
        AUTH["LoginPage, SignupPage,<br/>VerifyEmailPage, AuthCallbackPage"]
        DASH["DashboardPage"]
        ASSESS["AssessmentPage<br/>configuration, CAT runner, report"]
        HIST["TestHistoryPage"]
        GRAPH["SkillGraphPage + InteractiveSkillGraph"]
        ANALYTICS["AnalyticsPage"]
        MENT["MentorDashboard and mentor views"]
    end

    subgraph state["Client state and caching"]
        AUTHCTX["AuthContext<br/>hydrate /api/auth/me"]
        LANG["LanguageContext"]
        SESSION["sessionStorage<br/>active assessment id"]
        LOCAL["localStorage<br/>skillpath_assessment_result<br/>skillpath_onboarding_profile"]
    end

    subgraph services["Service layer"]
        API["api.js<br/>in-memory access token<br/>silent 401 refresh<br/>credentials include"]
        AUTHSVC["authService"]
        ASSESSSVC["assessmentService"]
        MENTORSVC["mentorService"]
        USERSVC["userService"]
        ASSISTANT["assistantService"]
        MOBILE["mobileAuth / mobileStorage"]
    end

    PUBLIC --> LAND
    PUBLIC --> AUTH
    SHELL --> DASH
    SHELL --> ASSESS
    SHELL --> HIST
    SHELL --> GRAPH
    SHELL --> ANALYTICS
    MENTOR --> MENT

    AUTH --> AUTHSVC
    ASSESS --> ASSESSSVC
    ASSESS --> ASSISTANT
    HIST --> ASSESSSVC
    DASH --> LOCAL
    GRAPH --> LOCAL
    ANALYTICS --> LOCAL
    MENT --> MENTORSVC
    DASH --> USERSVC
    AUTHCTX --> AUTHSVC
    AUTH --> AUTHCTX

    AUTHSVC --> API
    ASSESSSVC --> API
    MENTORSVC --> API
    USERSVC --> API
    ASSISTANT -->|"voice feedback via gateway"| GW["Gateway :8080"]
    API --> GW
    AUTHSVC --> MOBILE
    API --> MOBILE

    ASSESS --> SESSION
    ASSESS --> LOCAL
```

**Client notes**

- `AssessmentPage` drives the entire implemented onboarding-to-assessment flow: track selection, skill pre-selection, CAT execution, and report storage.
- The router maps `/onboarding` to a redirect to `/dashboard`; there is no active onboarding wizard route in the current implementation.
- `DashboardPage`, `SkillGraphPage`, and `AnalyticsPage` read the completed report from `localStorage` key `skillpath_assessment_result`.
- `InteractiveSkillGraph` builds node/edge models from the report's skill list and prerequisite IDs.
- The Android manifest registers the `octobyte://auth` deep-link scheme; the gateway mobile callback URL is configured through `APP_FRONTEND_MOBILE_CALLBACK_URL`. The web callback is `/auth/callback?code=...`.

---

## 6. Authentication and Security

### 6.1 Email registration and OTP verification

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant W as Web or Mobile Client
    participant C as EmailAuthController
    participant S as EmailAuthService
    participant V as EmailVerificationService
    participant E as Event Listener
    participant M as Gmail SMTP
    participant D as PostgreSQL

    U->>W: Submit signup form
    W->>C: POST /api/auth/register
    C->>S: register(request, clientIp)
    S->>S: IP rate limit check
    S->>D: Find user by normalized email
    alt New user
        S->>S: BCrypt encode password
        S->>D: Insert unverified user
        S->>V: issueOtp(user)
        V->>V: Generate 6-digit OTP
        V->>D: Store SHA-256 OTP hash with TTL
        S->>E: Publish EmailVerificationEvent
        E->>M: Send OTP email asynchronously
    else Unverified password user
        S->>V: issueOtp when cooldown allows
    else Verified or OAuth account
        S->>S: Do not alter account
    end
    S-->>C: Generic registration accepted
    C-->>W: { email, pendingVerification }
    W-->>U: Show /verify-email screen

    U->>W: Enter six-digit OTP
    W->>C: POST /api/auth/email-verification/confirm
    C->>V: verifyOtp(email, otp)
    V->>D: Load latest token by user
    alt Invalid, expired, or too many attempts
        V-->>C: VerificationTokenException
        C-->>W: Standard error envelope
    else Valid OTP
        V->>D: Mark token consumed, set emailVerified
        opt Role is MENTOR
            V->>D: Create MentorProfile
        end
        V-->>C: Success
        C->>S: Issue tokens via AuthTokenService
        S->>D: Persist refresh token hash
        C-->>W: Access token + user, refresh cookie set on web
        W-->>U: Redirect to dashboard
    end
```

**Implemented security rules**

- OTP is 6 digits, stored only as a SHA-256 hash, maximum 5 failed attempts, and a configurable TTL (`app.auth.verification.ttl-seconds`, default 600 seconds).
- Registration and resend are rate-limited by IP.
- Email is normalized to lowercase before lookup and storage.
- Mentor registration uses the same OTP flow and creates a `MentorProfile` after verification.

### 6.2 Password login and silent refresh rotation

```mermaid
sequenceDiagram
    autonumber
    participant W as Client
    participant A as api.js
    participant C as AuthTokenController
    participant S as EmailAuthService
    participant T as AuthTokenService
    participant D as PostgreSQL

    W->>A: apiClient('/api/...')
    A->>A: Attach in-memory Bearer token if present
    A->>C: Request with Authorization header
    alt Token missing or expired
        C-->>A: 401 Unauthorized
        A->>A: Single-flight refreshPromise
        A->>C: POST /api/auth/refresh
        C->>T: refresh(rawRefreshToken, platform)
        T->>D: Lookup SHA-256 token hash
        alt Token revoked
            T->>D: Revoke entire token family
            T-->>C: InvalidRefreshTokenException
        else Token valid and not expired
            T->>D: Revoke old token
            T->>D: Insert rotated token in same family
            T-->>C: New access token + new refresh token
            C-->>A: Set new HttpOnly cookie on web
            A->>A: Store new access token in memory
            A->>C: Retry original request once
        end
    else Authorized
        C-->>A: 200 response
    end

    Note over W,D: Email/password login follows the same token issuance path after credential validation.
```

**Implemented token rules**

| Item | Implementation |
|---|---|
| Access token | HMAC-SHA256 JWT, TTL 900 seconds |
| Refresh token | 32-byte random opaque string, stored as SHA-256 hash, TTL 2,592,000 seconds |
| Rotation | Every refresh revokes the old token and inserts a successor in the same family |
| Reuse detection | Presentation of an already-revoked token revokes the whole family |
| Web transport | `HttpOnly` cookie scoped to `/api/auth` |
| Mobile transport | JSON body; refresh token stored in Capacitor Preferences |
| Password hashing | Spring `DelegatingPasswordEncoder` (BCrypt by default) |
| Login rate limiting | Per-IP and per-email failed-attempt tracking with dummy BCrypt comparison for unknown accounts |

### 6.3 OAuth2 login and one-time code exchange

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant B as Browser or In-App Browser
    participant G as Gateway
    participant P as Google or GitHub
    participant L as OAuthAccountLinkingService
    participant D as PostgreSQL
    participant F as Frontend Callback

    U->>B: Click Google or GitHub login
    B->>G: GET /oauth2/authorization/{provider}
    G->>P: Redirect with OAuth2 authorization request
    P-->>G: Callback to /login/oauth2/code/{registrationId}
    G->>P: Exchange code for identity
    P-->>G: Subject, email, verification status
    G->>L: resolve(identity, optional linkIntentUserId)
    L->>D: Check (provider, provider_subject)
    alt Existing mapping
        L->>D: Update lastLoginAt and provider email
        L-->>G: Existing user
    else Explicit link intent
        L->>D: Validate target user and provider uniqueness
        L->>D: Insert OAuthAccount for target user
        L-->>G: Target user
    else New OAuth user
        L->>D: Require verified email
        L->>D: Create user and OAuthAccount
        L-->>G: New user
    else Email collision with verified account
        L-->>G: OAUTH_ACCOUNT_EXISTS
    else Unverified password account
        L->>D: Clear password, verify email, revoke refresh tokens, link account
        L-->>G: Reclaimed user
    end
    G->>D: Create hashed one-time OAuthLoginCode, TTL 60 seconds
    G-->>B: Redirect to web callback or mobile deep link with ?code=...
    B->>F: /auth/callback?code=... or configured mobile deep link?code=...
    F->>G: POST /api/auth/oauth2/exchange { code }
    G->>D: Consume login code and validate TTL
    G->>D: Persist refresh token
    G-->>F: Access token + user, refresh cookie on web
    F-->>U: Redirect to dashboard
```

**OAuth error destinations:** `APP_FRONTEND_WEB_ERROR_URL` for web and `APP_FRONTEND_MOBILE_ERROR_URL` for mobile.

### 6.4 Account linking decision flow

```mermaid
flowchart TD
    A["OAuth identity received"] --> B{"Mapping exists for<br/>provider + provider subject?"}
    B -- Yes --> C{"Explicit link intent<br/>targets another user?"}
    C -- Yes --> C1["Reject OAUTH_ALREADY_LINKED"]
    C -- No --> C2["Check account eligibility"]
    C2 --> C3["Update last login and provider email"]
    C3 --> OK["Return linked user"]

    B -- No --> D{"Explicit link intent present?"}
    D -- Yes --> D1["Load target user"]
    D1 --> D2{"Target already has<br/>this provider?"}
    D2 -- Yes --> D3["Reject OAUTH_ALREADY_LINKED"]
    D2 -- No --> D4["Insert OAuth account for target user"]
    D4 --> OK

    D -- No --> E{"Provider returned<br/>a verified email?"}
    E -- No --> E1["Reject OAUTH_EMAIL_REQUIRED<br/>or OAUTH_EMAIL_UNVERIFIED"]
    E -- Yes --> F{"User exists with that email?"}
    F -- No --> F1["Create verified OAuth user<br/>and OAuth account"]
    F1 --> OK
    F -- Yes --> G{"Account disabled?"}
    G -- Yes --> G1["Reject OAUTH_ACCOUNT_DISABLED"]
    G -- No --> H{"Existing account verified?"}
    H -- Yes --> H1["Reject OAUTH_ACCOUNT_EXISTS<br/>require explicit password-authenticated link"]
    H -- No --> I["Reclaim unverified account<br/>clear password, verify email,<br/>revoke refresh tokens, link provider"]
    I --> OK
```

This flow implements the account-takeover invariant: matching email alone never auto-links an existing verified account.

### 6.5 Password reset flow

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant W as Client
    participant C as PasswordResetController
    participant S as PasswordResetService
    participant D as PostgreSQL
    participant E as Event Listener
    participant M as Gmail SMTP
    participant T as AuthTokenService

    U->>W: Request reset
    W->>C: POST /api/auth/forgot-password
    C->>S: forgotPassword(email, clientIp)
    S->>S: Rate limit: 3 requests per 15 min per email and IP
    S->>D: Find user and check 60-second cooldown
    alt Eligible user
        S->>S: Generate six-digit OTP
        S->>D: Delete old tokens, store SHA-256 OTP hash
        S->>E: Publish PasswordResetOtpEvent
        E->>M: Send reset OTP email asynchronously
    end
    S-->>C: Generic response
    C-->>W: Accepted

    U->>W: Enter OTP
    W->>C: POST /api/auth/verify-reset-otp
    C->>S: verifyResetOtp(email, otp)
    S->>D: Load latest token, check expiry and attempts
    alt OTP valid
        S->>D: Generate 32-byte reset token, store hash and expiry
        S-->>C: resetToken + email
        C-->>W: Return reset token
    else Invalid
        S->>D: Increment failed attempts
        S-->>C: Error with remaining attempts
    end

    U->>W: Submit new password
    W->>C: POST /api/auth/reset-password
    C->>S: resetPassword(email, resetToken, newPassword)
    S->>D: Validate reset token hash and expiry
    S->>D: Update BCrypt password hash, consume reset token
    S->>T: revokeAllFor(userId)
    T->>D: Revoke all refresh tokens
    S-->>C: Success
    C-->>W: Password changed, all sessions revoked
```

### 6.6 Security filter chain

```mermaid
flowchart TD
    R["Incoming HTTP request"] --> M{"Path matches<br/>/oauth2/** or /login/oauth2/**?"}
    M -- Yes --> O["OAuth filter chain<br/>Order 1<br/>Session: IF_REQUIRED<br/>CSRF disabled<br/>permitAll"]
    O --> O1{"Client registration<br/>repository available?"}
    O1 -- Yes --> O2["Configure oauth2Login:<br/>custom authorization resolver<br/>Google OIDC user service<br/>GitHub user service<br/>success and failure handlers"]
    O1 -- No --> O3["Skip OAuth login configuration"]
    O2 --> O4["JSON authentication entry point<br/>and access denied handler"]
    O3 --> O4

    M -- No --> A["API filter chain<br/>Order 2<br/>Session: STATELESS<br/>CSRF disabled<br/>CORS configured"]
    A --> J["JwtAuthenticationFilter<br/>read Authorization: Bearer"]
    J --> J1{"Token valid?"}
    J1 -- Yes --> J2["Load User and set<br/>UsernamePasswordAuthenticationToken<br/>with ROLE_ authority"]
    J1 -- No --> J3["Continue without authentication"]
    J2 --> Z["Authorization rules"]
    J3 --> Z
    Z --> P1{"Public auth or health route?"}
    P1 -- Yes --> ALLOW["Permit"]
    P1 -- No --> P2{"Protected route?"}
    P2 -- Yes --> P3{"/api/v1/mentor/**<br/>requires ROLE_MENTOR"}
    P3 -- Yes --> MROLE{"Has role MENTOR?"}
    MROLE -- Yes --> ALLOW
    MROLE -- No --> DENY["403 via JSON access denied handler"]
    P3 -- No --> AUTHED{"Authenticated?"}
    AUTHED -- Yes --> ALLOW
    AUTHED -- No --> UNAUTH["401 via JSON entry point"]
    P2 -- No --> DENY
```

**Public endpoints implemented as public**

- `/api/auth/register`
- `/api/auth/mentor/register`
- `/api/auth/login`
- `/api/auth/email-verification/**`
- `/api/auth/forgot-password`
- `/api/auth/verify-reset-otp`
- `/api/auth/reset-password`
- `/api/auth/refresh`
- `/api/auth/logout`
- `/api/auth/oauth2/exchange`
- `/api/v1/assessments/voice-feedback/audio/**`
- `/oauth2/**`, `/login/oauth2/**`, `/error`, `/health`, `/actuator/health`

All other `/api/**` routes require authentication; `/api/v1/mentor/**` additionally requires `ROLE_MENTOR`.

---

## 7. Assessment Engine: CAT and Skill Graph

### 7.1 Adaptive test lifecycle

```mermaid
flowchart TD
    START["POST /api/v1/assessments<br/>trackId + knownSkillSlugs"] --> TRACK{"Track exists and ACTIVE?"}
    TRACK -- No --> ERR1["404 or 409 error envelope"]
    TRACK -- Yes --> ACTIVE{"Existing IN_PROGRESS<br/>assessment for user and track?"}
    ACTIVE -- Yes --> RESUME["Return current state<br/>and next question"]
    ACTIVE -- No --> CREATE["Create assessment<br/>status IN_PROGRESS<br/>initialTheta = 0.0<br/>store knownSkillSlugs JSON"]
    CREATE --> PICK["pickNext:<br/>LEFT JOIN unanswered items<br/>ORDER BY ABS(item.difficulty - theta), item.id<br/>LIMIT 1"]
    PICK --> NONE{"Item found?"}
    NONE -- No --> ERR2["409 No questions available"]
    NONE -- Yes --> QUESTION["Return AssessmentState<br/>item id, stem, options, seq<br/>never difficulty or correctOption"]
    QUESTION --> ANSWER["POST /api/v1/assessments/{id}/responses<br/>itemId + selectedOption"]
    ANSWER --> OWN["Verify assessment ownership<br/>and IN_PROGRESS status"]
    OWN --> EXPECTED["Recompute expected next item<br/>and compare submitted itemId"]
    EXPECTED --> VALID{"Matches expected item<br/>and option in range?"}
    VALID -- No --> ERR3["409 or 400 error envelope"]
    VALID -- Yes --> PERSIST["Persist AssessmentResponse<br/>seq = answered + 1<br/>saveAndFlush"]
    PERSIST --> STOP{"Stop rule reached?"}
    STOP -- "MAX_ITEMS: answered at least 9" --> FINISH["Finish assessment"]
    STOP -- "LEVEL_CONFIRMED: answered at least 8 AND direction changes at least 2" --> FINISH
    STOP -- "Otherwise" --> NEXT["Next theta = theta plus 0.35 if correct<br/>or theta minus 0.35 if incorrect"]
    NEXT --> PICKNEXT["pickNext with new theta"]
    PICKNEXT --> HASNEXT{"Item found?"}
    HASNEXT -- Yes --> QUESTION
    HASNEXT -- No --> FINISH

    FINISH --> LEVEL["Compute final theta and level:<br/>BEGINNER if theta less than -0.5<br/>INTERMEDIATE if -0.5 to 0.75<br/>ADVANCED if greater than 0.75"]
    LEVEL --> STATES["saveSkillResults:<br/>MASTERED if declared or difficulty at most theta minus 0.25<br/>FRONTIER if all prerequisites MASTERED<br/>LOCKED otherwise"]
    STATES --> REPORT["GET /api/v1/assessments/{id}/report"]
```

**Implemented constants**

| Constant | Value |
|---|---|
| Start theta | `0.0` |
| Step size | `0.35` logits |
| Minimum items before early stop | `8` |
| Maximum items | `9` |
| Early stop | At least 8 answered and at least 2 answer-direction changes |
| Mastery margin | `0.25` logits |
| Beginner threshold | theta less than `-0.5` |
| Advanced threshold | theta greater than `0.75` |

**Selection query and transactional behavior**

- `AssessmentItemRepository.findNext` uses an indexed anti-join against `assessment_responses`.
- Ordering is by absolute difference between item difficulty and current theta, then item id.
- Submitted answers are persisted with `saveAndFlush`, keeping the next-item query consistent.
- The response DTO exposes the stem and options only; item difficulty and `correctOption` remain server-side during an active test.

### 7.2 CAT interaction sequence with voice feedback

```mermaid
sequenceDiagram
    autonumber
    participant U as Learner
    participant W as AssessmentPage
    participant C as AssessmentController
    participant S as AssessmentService
    participant R as Repositories
    participant D as PostgreSQL
    participant A as Assistant Service

    U->>W: Choose track and optional known skills
    W->>C: GET /api/v1/assessments/tracks
    C->>R: Find ACTIVE tracks
    R->>D: Query tracks
    D-->>R: Tracks
    R-->>C: Track list
    C-->>W: Track summaries

    W->>C: GET /api/v1/assessments/tracks/{trackId}/skills
    C->>R: Find skills ordered by difficulty
    R->>D: Query skills
    D-->>R: Skills
    R-->>C: Skill summaries
    C-->>W: Skills for pre-selection

    W->>C: POST /api/v1/assessments
    C->>S: start(userId, trackId, knownSkillSlugs)
    S->>R: Find existing IN_PROGRESS assessment
    alt No active assessment
        S->>R: Save new assessment
        S->>R: findNext(trackId, assessmentId, theta)
        R->>D: Anti-join unanswered items
    end
    S-->>C: AssessmentState with first question
    C-->>W: Question without answer key

    loop Until stop rule or no items remain
        U->>W: Select option and submit
        W->>C: POST /api/v1/assessments/{id}/responses
        C->>S: answer(userId, assessmentId, itemId, selectedOption)
        S->>R: Load answers and expected item
        S->>S: Validate item, persist response, update theta
        alt Stop rule met or no next item
            S->>R: Save completed assessment and skill results
            S-->>C: Finished state with lastEvaluation
            C-->>W: done = true
        else Continue
            S->>R: findNext with new theta
            S-->>C: Next question
            C-->>W: Next question
        end
        opt Last answer has evaluation context
            W->>C: POST /api/v1/assessments/voice-feedback
            C->>A: Forward with X-Internal-API-Key
            A-->>C: Voice feedback JSON with audio URL
            C-->>W: Proxied feedback
        end
    end

    W->>C: GET /api/v1/assessments/{id}/report
    C->>S: report(userId, assessmentId)
    S->>R: Load responses with items and skill results
    S-->>C: Full report
    C-->>W: Per-question review and skill states
    W->>W: Store report in localStorage<br/>skillpath_assessment_result
```

### 7.3 Assessment and skill-state state machines

```mermaid
stateDiagram-v2
    [*] --> IN_PROGRESS: POST /api/v1/assessments
    IN_PROGRESS --> IN_PROGRESS: Submit answer, stop rule not met
    IN_PROGRESS --> COMPLETED: MAX_ITEMS
    IN_PROGRESS --> COMPLETED: LEVEL_CONFIRMED
    IN_PROGRESS --> COMPLETED: NO_QUESTIONS_LEFT
    COMPLETED --> [*]
```

```mermaid
stateDiagram-v2
    [*] --> LOCKED
    [*] --> MASTERED: Slug declared in knownSkillSlugs
    [*] --> MASTERED: Item difficulty at most final theta minus 0.25
    LOCKED --> FRONTIER: All direct prerequisites are MASTERED
    LOCKED --> READY_TO_LEARN: Skill quiz passed with 3 of 5 correct
    FRONTIER --> READY_TO_LEARN: Skill quiz passed with 3 of 5 correct
    MASTERED --> READY_TO_LEARN: Skill quiz passed and result updated
    LOCKED --> FRONTIER: Downstream prerequisite promotion
```

**Classification behavior**

- At assessment completion, skills are classified as `MASTERED`, `FRONTIER`, or `LOCKED`.
- `FRONTIER` means the skill is not mastered, but every direct prerequisite is mastered.
- The node unlock quiz can set a skill to `READY_TO_LEARN`; passing also promotes eligible downstream `LOCKED` skills to `FRONTIER`.
- Skill results are persisted per assessment in `assessment_skill_results`.

### 7.4 Skill-node unlock quiz

```mermaid
sequenceDiagram
    autonumber
    participant U as Learner
    participant W as InteractiveSkillGraph
    participant C as AssessmentController
    participant S as AssessmentService
    participant R as Repositories
    participant D as PostgreSQL

    U->>W: Select a skill node
    W->>C: GET /api/v1/assessments/skills/{skillSlug}/quiz
    C->>S: getQuizForSkill(skillSlug)
    S->>R: Find skill by slug
    S->>R: Load ACTIVE items for skill
    alt Fewer than five direct items
        S->>R: Load same-cluster ACTIVE items
    end
    alt Still fewer than five
        S->>R: Load track items ordered by closeness to skill difficulty
    end
    S-->>C: Up to five questions, no answer keys
    C-->>W: Quiz payload with passing score 3
    U->>W: Answer all questions
    W->>C: POST /api/v1/assessments/skills/{skillSlug}/quiz/submit
    C->>S: submitQuizForSkill(userId, skillSlug, answers)
    S->>R: Load submitted items
    S->>S: Compare selectedOption with correctOption server-side
    alt Correct count at least 3
        S->>R: Find assessment for user and track
        S->>R: Upsert AssessmentSkillResult to READY_TO_LEARN
        S->>R: Promote eligible downstream LOCKED skills to FRONTIER
        S-->>C: passed = true
    else Correct count fewer than 3
        S-->>C: passed = false, newState LOCKED (not persisted)
    end
    C-->>W: Result, score, breakdown, message
    W-->>U: Unlock animation or retry prompt
```

### 7.5 DAG seeding and validation

```mermaid
flowchart TD
    BOOT["Application startup<br/>AssessmentDataLoader.run"] --> READ["Read classpath seed<br/>seed/backend-skills.yaml"]
    READ --> EXISTS{"File exists?"}
    EXISTS -- No --> SKIP["Log warning and skip seeding"]
    EXISTS -- Yes --> PARSE["Parse skills array"]
    PARSE --> EMPTY{"Skills present?"}
    EMPTY -- No --> FAIL["Log error and stop seeding"]
    EMPTY -- Yes --> VALIDATE["Kahn topological sort validation"]
    VALIDATE --> CYCLE{"Cycle detected?"}
    CYCLE -- Yes --> HARD["Fail startup with cycle diagnostics"]
    CYCLE -- No --> ORPHAN["Log unknown prerequisite references<br/>and self-reference warnings"]
    ORPHAN --> SEEDED{"Track, all skills, and items<br/>already present?"}
    SEEDED -- Yes --> HEAL["Heal prerequisites if needed<br/>and skip reseeding"]
    SEEDED -- No --> TRACK["Upsert fixed Backend track UUID<br/>00000000-0000-0000-0000-000000000001"]
    TRACK --> SKILLS["Create deterministic skill UUIDs<br/>UUID.nameUUIDFromBytes of backend-skill:slug"]
    SKILLS --> SAVE["Save 56 skills and 80 prerequisite edges<br/>across 9 clusters"]
    SAVE --> ITEMS{"Assessment item pool empty?"}
    ITEMS -- Yes --> QUESTIONS["Seed 27 active questions<br/>difficulty range -2.0 to 2.2"]
    ITEMS -- No --> DONE["Seeding complete"]
    QUESTIONS --> DONE
    HEAL --> DONE
```

**Seed facts verified from `backend-skills.yaml`**

| Metric | Value |
|---|---|
| Skills | 56 |
| Prerequisite edges | 80 |
| Domain clusters | 9 |
| Fixed Backend Engineering track UUID | `00000000-0000-0000-0000-000000000001` |
| Seeded diagnostic questions | 27 |

---

## 8. Persistence Model

```mermaid
erDiagram
    USERS {
        bigint id PK
        varchar email UK
        varchar username UK
        varchar full_name
        varchar avatar_url
        varchar bio
        varchar password_hash
        boolean email_verified
        timestamp email_verified_at
        varchar role
        varchar status
        timestamp created_at
        timestamp updated_at
    }

    OAUTH_ACCOUNTS {
        bigint id PK
        bigint user_id FK
        varchar provider
        varchar provider_subject
        varchar provider_email
        boolean provider_email_verified
        timestamp created_at
        timestamp last_login_at
    }

    REFRESH_TOKENS {
        bigint id PK
        bigint user_id FK
        varchar token_hash UK
        varchar family_id
        varchar platform
        timestamp created_at
        timestamp expires_at
        timestamp revoked_at
        bigint replaced_by_id
    }

    EMAIL_VERIFICATION_TOKENS {
        bigint id PK
        bigint user_id FK
        varchar token_hash
        int failed_attempts
        timestamp created_at
        timestamp expires_at
        timestamp consumed_at
    }

    PASSWORD_RESET_TOKENS {
        bigint id PK
        bigint user_id FK
        varchar otp_hash
        varchar reset_token_hash
        int failed_attempts
        timestamp created_at
        timestamp otp_expires_at
        timestamp reset_token_expires_at
        timestamp consumed_at
    }

    OAUTH_LOGIN_CODES {
        bigint id PK
        bigint user_id FK
        varchar platform
        varchar code_hash UK
        timestamp created_at
        timestamp expires_at
        timestamp consumed_at
    }

    OAUTH_LINK_INTENTS {
        bigint id PK
        bigint user_id FK
        varchar provider
        varchar intent_hash UK
        timestamp created_at
        timestamp expires_at
        timestamp consumed_at
    }

    TRACKS {
        uuid id PK
        varchar slug UK
        varchar name
        varchar status
    }

    SKILLS {
        uuid id PK
        uuid track_id FK
        varchar slug
        varchar name
        varchar cluster
        double difficulty
    }

    SKILL_PREREQUISITES {
        uuid skill_id FK
        uuid prerequisite_id FK
    }

    ASSESSMENT_ITEMS {
        uuid id PK
        uuid track_id FK
        varchar skill_slug
        double difficulty
        text stem
        text options
        int correct_option
        varchar status
    }

    ASSESSMENTS {
        uuid id PK
        uuid user_id FK
        uuid track_id FK
        varchar status
        double initial_theta
        double theta
        varchar level
        int items_administered
        int correct_count
        varchar stop_reason
        text known_skill_slugs
        timestamp completed_at
    }

    ASSESSMENT_RESPONSES {
        uuid id PK
        uuid assessment_id FK
        int seq
        uuid item_id FK
        int selected_option
        boolean is_correct
        timestamp answered_at
    }

    ASSESSMENT_SKILL_RESULTS {
        uuid id PK
        uuid assessment_id FK
        uuid skill_id FK
        varchar state
    }

    MENTOR_PROFILES {
        bigint user_id PK
        varchar title
        varchar location
        timestamp joined_at
    }

    MENTOR_EXPERTISE {
        bigint mentor_user_id FK
        varchar label
    }

    MENTOR_KEYS {
        uuid id PK
        bigint mentor_user_id FK
        varchar key_value UK
        varchar status
        timestamp created_at
        timestamp revoked_at
        uuid rotated_from_id
    }

    MENTOR_STUDENT_LINKS {
        bigint id PK
        bigint mentor_user_id FK
        bigint student_user_id FK
        uuid key_id FK
        timestamp linked_at
        timestamp unlinked_at
    }

    SKILL_ACHIEVEMENTS {
        uuid id PK
        bigint student_user_id FK
        varchar skill_slug
        varchar skill_name
        varchar category
        varchar proficiency
        int progress
        timestamp verified_at
        uuid source_assessment_id
    }

    USERS ||--o{ OAUTH_ACCOUNTS : "has"
    USERS ||--o{ REFRESH_TOKENS : "owns"
    USERS ||--o{ EMAIL_VERIFICATION_TOKENS : "receives"
    USERS ||--o{ PASSWORD_RESET_TOKENS : "requests"
    USERS ||--o{ OAUTH_LOGIN_CODES : "receives"
    USERS ||--o{ OAUTH_LINK_INTENTS : "creates"
    USERS ||--o{ ASSESSMENTS : "logical UUID mapping"
    USERS ||--o| MENTOR_PROFILES : "mentor profile"
    USERS ||--o{ MENTOR_KEYS : "mentor owns"
    USERS ||--o{ MENTOR_STUDENT_LINKS : "mentor side"
    USERS ||--o{ MENTOR_STUDENT_LINKS : "student side"
    USERS ||--o{ SKILL_ACHIEVEMENTS : "student earns"
    MENTOR_PROFILES ||--o{ MENTOR_EXPERTISE : "lists"
    MENTOR_KEYS ||--o{ MENTOR_STUDENT_LINKS : "redeemed by"
    TRACKS ||--o{ SKILLS : "contains"
    SKILLS ||--o{ SKILL_PREREQUISITES : "target skill"
    SKILLS ||--o{ SKILL_PREREQUISITES : "prerequisite skill"
    TRACKS ||--o{ ASSESSMENT_ITEMS : "provides"
    TRACKS ||--o{ ASSESSMENTS : "evaluates"
    ASSESSMENTS ||--o{ ASSESSMENT_RESPONSES : "records"
    ASSESSMENT_ITEMS ||--o{ ASSESSMENT_RESPONSES : "answered in"
    ASSESSMENTS ||--o{ ASSESSMENT_SKILL_RESULTS : "produces"
    SKILLS ||--o{ ASSESSMENT_SKILL_RESULTS : "evaluated in"
```

**Persistence notes**

- `users.id` is `BIGINT`, while `assessments.user_id` and the mentor link identifiers are `BIGINT` user IDs. Assessment ownership uses a deterministic UUID derived from the numeric user ID (`new UUID(0L, id)`), so the ER relationship is logical rather than a database foreign key.
- `skill_achievements` is currently populated by the demo mentor seed loader. Runtime assessment completion writes `assessment_skill_results`, not `skill_achievements`.
- The mentor demo seed is enabled by default through `app.seed.mentor-demo` unless the property is set to `false`.
- Hibernate schema synchronization is enabled with `spring.jpa.hibernate.ddl-auto=update` in the main application; tests use `create-drop` against H2 in PostgreSQL mode.

---

## 9. Mentor Subsystem

### 9.1 Mentor component architecture

```mermaid
flowchart LR
    subgraph web["Mentor web views"]
        MD["MentorDashboard shell"]
        OV["MentorOverview"]
        ST["MyStudents"]
        SK["AchievedSkills"]
        AN["TestAnalytics"]
        KY["MentorUniqueKey"]
        PR["MentorProfile"]
        CON["StudentMentorConnector"]
    end

    MS["mentorService"]
    API["api.js"]

    subgraph gateway["Gateway mentor module"]
        DC["MentorDashboardController"]
        SC["MentorStudentController"]
        AC["MentorAchievementController"]
        ANC["MentorAnalyticsController"]
        KC["MentorKeyController"]
        PC["MentorProfileController"]
        LC["StudentMentorLinkController"]
        DS["MentorDashboardService"]
        SS["MentorStudentService"]
        AS["MentorAchievementService"]
        ANS["MentorAnalyticsService"]
        KS["MentorKeyService"]
        PS["MentorProfileService"]
        LS["StudentMentorLinkService"]
    end

    subgraph data["Persistence"]
        U[("users")]
        MP[("mentor_profiles")]
        ME[("mentor_expertise")]
        MK[("mentor_keys")]
        ML[("mentor_student_links")]
        SA[("skill_achievements")]
        ASM[("assessments")]
    end

    MD --> OV
    MD --> ST
    MD --> SK
    MD --> AN
    MD --> KY
    MD --> PR
    ST --> CON

    OV --> MS
    ST --> MS
    SK --> MS
    AN --> MS
    KY --> MS
    PR --> MS
    CON --> MS
    MS --> API
    API --> DC
    API --> SC
    API --> AC
    API --> ANC
    API --> KC
    API --> PC
    API --> LC

    DC --> DS
    SC --> SS
    AC --> AS
    ANC --> ANS
    KC --> KS
    PC --> PS
    LC --> LS

    DS --> U
    DS --> ML
    DS --> SA
    DS --> ASM
    SS --> U
    SS --> ML
    SS --> SA
    SS --> ASM
    AS --> SA
    ANS --> ML
    ANS --> SA
    ANS --> ASM
    KS --> MK
    KS --> ML
    PS --> U
    PS --> MP
    PS --> ME
    LS --> MK
    LS --> ML
    LS --> U
```

**Mentor endpoint authorization**

- All `/api/v1/mentor/**` endpoints require `ROLE_MENTOR`.
- `/api/v1/students/mentor-link` is available to authenticated students.
- Responses use the shared `ApiResponse<T>` envelope.

### 9.2 Mentor key generation and student linking

```mermaid
sequenceDiagram
    autonumber
    participant M as Mentor
    participant MW as Mentor Web App
    participant MC as MentorKeyController
    participant MS as MentorKeyService
    participant S as Student
    participant SW as Student Web App
    participant LC as StudentMentorLinkController
    participant LS as StudentMentorLinkService
    participant D as PostgreSQL

    M->>MW: Open My Unique Key
    MW->>MC: GET /api/v1/mentor/key
    MC->>MS: getActiveKey(mentorUserId)
    MS->>D: Find ACTIVE mentor key
    MS-->>MC: Existing key or empty
    MC-->>MW: Key response

    M->>MW: Generate or rotate key
    MW->>MC: POST /api/v1/mentor/key { replaceExisting }
    MC->>MS: generateOrReplaceKey(...)
    MS->>MS: Check key rotation rate limit
    alt Active key exists and replaceExisting is false
        MS-->>MC: 409 MentorKeyAlreadyExists
    else No active key or replacement allowed
        opt Replacement requested
            MS->>D: Revoke existing key with revokedAt
        end
        MS->>MS: Generate MENTOR- plus 6 characters
        MS->>D: Insert unique ACTIVE key
        MS-->>MC: New key response
    end
    MC-->>MW: Return key, status, linked student count

    S->>SW: Enter mentor key
    SW->>LC: POST /api/v1/students/mentor-link { key }
    LC->>LS: linkStudentToMentor(studentUserId, rawKey, clientIp)
    LS->>LS: Check redemption rate limit
    LS->>LS: Validate format MENTOR-XXXXXX
    LS->>D: Find ACTIVE key and mentor user
    alt Key invalid or inactive
        LS-->>LC: InvalidMentorKeyException
    else Student already linked to same mentor
        LS-->>LC: Idempotent alreadyLinked = true
    else Student linked to a different mentor
        LS-->>LC: 409 StudentAlreadyLinked
    else Not linked
        LS->>D: Insert mentor_student_link
        LS-->>LC: Link response
    end
    LC-->>SW: Mentor name, linkedAt, alreadyLinked
```

### 9.3 Mentor analytics data flow

```mermaid
flowchart LR
    subgraph sources["Source data"]
        U[("users")]
        ML[("mentor_student_links")]
        ASM[("assessments")]
        SA[("skill_achievements")]
        MK[("mentor_keys")]
        MP[("mentor_profiles")]
        ME[("mentor_expertise")]
    end

    subgraph services["Mentor services"]
        DASH["MentorDashboardService<br/>cohort stats, progress buckets,<br/>top students, recent achievements"]
        STUD["MentorStudentService<br/>student directory with filters,<br/>sorting, pagination"]
        ACH["MentorAchievementService<br/>achievement list, facets,<br/>search and filters"]
        ANA["MentorAnalyticsService<br/>totals, seven-day activity,<br/>progress bands, student breakdown"]
        KEY["MentorKeyService"]
        PROF["MentorProfileService"]
        LINK["StudentMentorLinkService"]
    end

    subgraph api["REST responses"]
        OV["GET /api/v1/mentor/dashboard/overview"]
        ST["GET /api/v1/mentor/students"]
        STD["GET /api/v1/mentor/students/{studentId}"]
        ACHR["GET /api/v1/mentor/achievements"]
        FAC["GET /api/v1/mentor/achievements/facets"]
        TST["GET /api/v1/mentor/analytics/tests"]
        ACT["GET /api/v1/mentor/analytics/activity"]
        KEYR["GET and POST /api/v1/mentor/key"]
        PROFR["GET and PATCH /api/v1/mentor/profile"]
        LINKR["POST, GET, DELETE /api/v1/students/mentor-link"]
    end

    U --> DASH
    ML --> DASH
    ASM --> DASH
    SA --> DASH
    MK --> DASH
    DASH --> OV

    U --> STUD
    ML --> STUD
    ASM --> STUD
    SA --> STUD
    STUD --> ST
    STUD --> STD

    SA --> ACH
    ACH --> ACHR
    ACH --> FAC

    ML --> ANA
    ASM --> ANA
    SA --> ANA
    U --> ANA
    ANA --> TST
    ANA --> ACT

    MK --> KEY
    ML --> KEY
    KEY --> KEYR

    U --> PROF
    MP --> PROF
    ME --> PROF
    PROF --> PROFR

    MK --> LINK
    ML --> LINK
    U --> LINK
    LINK --> LINKR
```

**Analytics semantics**

- Cohort membership is derived from active rows in `mentor_student_links`.
- Tests come from `assessments` for linked students, using the same logical user-ID mapping as the assessment module.
- Progress bands are computed from achievements plus assessment activity, with thresholds `ADVANCED` at 75 or above, `ON_TRACK` at 50 to 74, and `NEEDS_ATTENTION` below 50.
- The current implementation computes a fixed average duration in the analytics response rather than measuring per-test elapsed time.

---

## 10. AI Voice Companion and Assistant Service

### 10.1 Assistant service components

```mermaid
flowchart TB
    subgraph client["Client"]
        AP["AssessmentPage"]
        VW["VoiceCompanionWidget<br/>audio element and fallback UI"]
    end

    subgraph gateway["Spring Boot Gateway"]
        VC["AssessmentController<br/>/api/v1/assessments/voice-feedback"]
        AUD["Audio proxy<br/>/api/v1/assessments/voice-feedback/audio/{audioId}"]
        ASVC["AssessmentService<br/>forwardVoiceFeedback<br/>streamVoiceAudio"]
    end

    subgraph assistant["skillup-assistant :3002"]
        APP["Express app"]
        AUTHMW["internal-auth middleware<br/>x-internal-api-key"]
        RL["rate-limit middleware"]
        CTRL["assessment.controller"]
        FB["feedback.service"]
        OR["openrouter.service"]
        TTS["tts.service"]
        STORE["in-memory audio-store<br/>TTL and max items"]
        CHAT["assistant.controller<br/>Lyzr chat"]
    end

    subgraph external["External providers"]
        OPENROUTER["OpenRouter chat completions"]
        TTSAPI["Google Translate TTS<br/>OpenAI TTS<br/>ElevenLabs"]
        LYZR["Lyzr Agent API"]
    end

    AP -->|"POST voice feedback"| VC
    VC --> ASVC
    ASVC -->|"HTTP with internal key"| RL
    RL --> AUTHMW
    AUTHMW --> CTRL
    CTRL --> FB
    FB --> OR
    OR --> OPENROUTER
    FB --> TTS
    TTS --> TTSAPI
    TTS --> STORE
    CTRL -->|"audio URL"| ASVC
    VW -->|"GET audio with Range"| AUD
    AUD --> ASVC
    ASVC -->|"stream audio bytes"| STORE
    APP --> CHAT
    CHAT --> LYZR
    VW --> AP
```

### 10.2 Voice feedback sequence

```mermaid
sequenceDiagram
    autonumber
    participant W as AssessmentPage
    participant G as Gateway
    participant A as Assistant Service
    participant L as OpenRouter
    participant T as TTS Provider
    participant S as Audio Store
    participant P as Browser Audio

    W->>G: POST /api/v1/assessments/voice-feedback<br/>Authenticated with Bearer JWT
    G->>G: Verify caller authentication
    G->>A: POST /api/assessment/voice-feedback<br/>X-Internal-API-Key
    A->>A: Rate limit check
    A->>A: Validate request schema
    A->>L: Generate reaction, reinforcement, bonus tip
    L-->>A: Structured JSON feedback
    A->>T: Synthesize speech text
    alt TTS succeeds
        T-->>A: MP3 bytes
        A->>S: Save audio with TTL
        S-->>A: audioId and internal URL
    else TTS fails
        A->>A: Degrade gracefully with audio unavailable
    end
    A-->>G: success, feedback, audio availability and URL
    G->>G: Rewrite audio path to gateway path
    G-->>W: Proxied JSON response

    opt Audio available
        W->>G: GET /api/v1/assessments/voice-feedback/audio/{audioId}<br/>Range header when seeking
        G->>A: GET /api/assessment/voice-feedback/audio/{audioId}
        A->>S: Load audio by ID
        S-->>A: Buffer and content type
        A-->>G: 200 or 206 with Content-Range
        G-->>W: Audio bytes
        W->>P: Play audio
    end
```

**Implementation boundaries**

- The gateway keeps the assistant's internal API key private; the browser never calls the voice-feedback endpoint on the assistant directly.
- The audio store is in memory with TTL cleanup and capacity eviction. It is not shared across multiple assistant instances.
- The assistant chat endpoint and Lyzr client exist and are covered by tests, but the current landing-page chatbot uses local scripted question data rather than calling `/api/assistant/chat`.

---

## 11. Implemented API and Frontend Route Map

### 11.1 Gateway REST surface

| Area | Method | Endpoint | Auth |
|---|---|---|---|
| OAuth start | GET | `/oauth2/authorization/{provider}` | Public |
| OAuth code exchange | POST | `/api/auth/oauth2/exchange` | Public |
| Register learner | POST | `/api/auth/register` | Public |
| Register mentor | POST | `/api/auth/mentor/register` | Public |
| Confirm email OTP | POST | `/api/auth/email-verification/confirm` | Public |
| Resend email OTP | POST | `/api/auth/email-verification/resend` | Public |
| Login | POST | `/api/auth/login` | Public |
| Refresh | POST | `/api/auth/refresh` | Cookie or body |
| Logout | POST | `/api/auth/logout` | Cookie or body |
| Current user | GET | `/api/auth/me` | Bearer JWT |
| Forgot password | POST | `/api/auth/forgot-password` | Public |
| Verify reset OTP | POST | `/api/auth/verify-reset-otp` | Public |
| Reset password | POST | `/api/auth/reset-password` | Public |
| Create OAuth link intent | POST | `/api/auth/oauth-links/{provider}/intent` | Bearer JWT |
| Tracks | GET | `/api/v1/assessments/tracks` | Public |
| Track skills | GET | `/api/v1/assessments/tracks/{trackId}/skills` | Public |
| Start or resume assessment | POST | `/api/v1/assessments` | Bearer JWT |
| Assessment history | GET | `/api/v1/assessments/history` | Bearer JWT |
| Assessment state | GET | `/api/v1/assessments/{id}` | Bearer JWT |
| Submit answer | POST | `/api/v1/assessments/{id}/responses` | Bearer JWT |
| Result summary | GET | `/api/v1/assessments/{id}/result` | Bearer JWT |
| Full report | GET | `/api/v1/assessments/{id}/report` | Bearer JWT |
| Skill unlock quiz | GET | `/api/v1/assessments/skills/{skillSlug}/quiz` | Bearer JWT |
| Submit skill quiz | POST | `/api/v1/assessments/skills/{skillSlug}/quiz/submit` | Bearer JWT |
| Voice feedback | POST | `/api/v1/assessments/voice-feedback` | Bearer JWT |
| Stream voice audio | GET | `/api/v1/assessments/voice-feedback/audio/{audioId}` | Public |
| Mentor overview | GET | `/api/v1/mentor/dashboard/overview` | ROLE_MENTOR |
| Mentor students | GET | `/api/v1/mentor/students` | ROLE_MENTOR |
| Mentor student detail | GET | `/api/v1/mentor/students/{studentId}` | ROLE_MENTOR |
| Mentor achievements | GET | `/api/v1/mentor/achievements` | ROLE_MENTOR |
| Mentor achievement facets | GET | `/api/v1/mentor/achievements/facets` | ROLE_MENTOR |
| Mentor test analytics | GET | `/api/v1/mentor/analytics/tests` | ROLE_MENTOR |
| Mentor activity | GET | `/api/v1/mentor/analytics/activity` | ROLE_MENTOR |
| Mentor key | GET, POST | `/api/v1/mentor/key` | ROLE_MENTOR |
| Mentor profile | GET, PATCH | `/api/v1/mentor/profile` | ROLE_MENTOR |
| Student mentor link | POST, GET, DELETE | `/api/v1/students/mentor-link` | Bearer JWT |
| User profile | GET, PUT | `/api/users/profile` | Bearer JWT |
| Health | GET | `/health`, `/actuator/health` | Public |

### 11.2 Frontend route map

```mermaid
flowchart LR
    ROOT["/"] --> LAND["LandingPage"]
    LOGIN["/login"] --> LP["LoginPage"]
    SIGNUP["/signup"] --> SP["SignupPage"]
    FORGOT["/forgot-password"] --> FP["forgotPass"]
    CALLBACK["/auth/callback"] --> CP["AuthCallbackPage"]
    ERROR["/auth/error"] --> EP["AuthErrorPage"]
    VERIFY["/verify-email"] --> VP["VerifyEmailPage"]
    ONB["/onboarding"] --> REDIR["Redirect to /dashboard"]

    subgraph shell["DashboardShell"]
        DASH["/dashboard"] --> DP["DashboardPage"]
        ASSESS["/assessment"] --> AP["AssessmentPage"]
        HIST["/history and /assessment/history"] --> HP["TestHistoryPage"]
        GRAPH["/graph"] --> GP["SkillGraphPage"]
        ANALYTICS["/analytics"] --> ANP["AnalyticsPage"]
    end

    subgraph mentor["MentorDashboard"]
        MROOT["/mentor"] --> MO["MentorOverview"]
        MST["/mentor/students"] --> MS["MyStudents"]
        MSK["/mentor/skills"] --> MA["AchievedSkills"]
        MAN["/mentor/analytics"] --> MT["TestAnalytics"]
        MKEY["/mentor/key"] --> MK["MentorUniqueKey"]
        MPROF["/mentor/profile"] --> MP["MentorProfile"]
    end
```

**Route implementation notes**

- `/roadmap`, `/projects`, and `/career` are routed but render a "Coming Soon" placeholder, so they are excluded from the implemented architecture diagrams.
- `/onboarding` redirects to `/dashboard`; onboarding inputs are collected inside `AssessmentPage`.
- `/history` and `/assessment/history` both render `TestHistoryPage`.
- Protected routes are enforced by client routing and by gateway authentication; mentor pages additionally rely on mentor APIs returning `403` for non-mentor roles.

### 11.3 Assistant service endpoints

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/assessment/voice-feedback` | `x-internal-api-key` | Generate LLM feedback and TTS audio |
| GET | `/api/assessment/voice-feedback/audio/{audioId}` | None | Stream cached audio, supports Range |
| POST | `/api/assistant/chat` | `x-internal-api-key` | Proxy a chat message to the Lyzr agent |
| GET | `/health` | None | Service health |

---

## 12. Deferred Features (Not Diagrammed)

The following features appear in product documentation, navigation, or scaffold directories but are not implemented as working end-to-end flows. They are deliberately excluded from the architecture diagrams above.

| Feature | Current state |
|---|---|
| AI roadmap generation | `/roadmap` renders "Coming Soon"; no roadmap persistence or AI synthesis endpoint |
| Capstone project verification | `/projects` renders "Coming Soon"; no GitHub repository validation pipeline |
| Badge or certificate issuance | No issuing service or certificate entity |
| Career hub and ATS matching | `/career` renders "Coming Soon"; no matching engine |
| AI mock interviews | No interview module |
| `ai-worker` microservice | Only README files exist; no server code |
| BullMQ asynchronous jobs | Redis container exists in Compose, but no Java/Node queue implementation uses it |
| React Native/Flutter mobile app | The implemented mobile path is Capacitor wrapping `web-app/dist` |
| Live landing-page AI chat | `LandingChatbot` uses local `chatbotQuestions` data; the assistant chat endpoint is implemented but not wired into this UI |
| Mentor cohort tenant isolation | Not modeled; current mentor queries scope by linked students only |

---

## 13. Verification Topology

```mermaid
flowchart LR
    subgraph gatewayTests["Gateway tests: mvnw.cmd test"]
        H2[("H2 in-memory database<br/>MODE=PostgreSQL<br/>create-drop")]
        SEC["SecurityAndEndpointIntegrationTest"]
        ASSESS["AssessmentEndpointIntegrationTest"]
        EMAIL["EmailAuthIntegrationTest<br/>EmailVerificationServiceTest"]
        TOKEN["AuthTokenServiceTest"]
        OAUTH["OAuthAccountLinkingServiceTest<br/>GitHubEmailResolverTest"]
        RESET["PasswordResetServiceTest"]
        MAUTH["MentorAuthIntegrationTest"]
        MKEY["MentorKeyIntegrationTest"]
        MSTU["MentorStudentsAndAchievementsIntegrationTest"]
        MAN["MentorAnalyticsIntegrationTest<br/>MentorProfileAndOverviewIntegrationTest"]
        ME2E["MentorFullEndToEndIntegrationTest"]
    end

    subgraph assistantTests["Assistant tests: npm test"]
        VITEST["Vitest + Supertest"]
        AT1["health.test.js"]
        AT2["assessment.test.js"]
        AT3["assistant.test.js"]
        AT4["openrouter.test.js"]
        AT5["tts.test.js"]
        AT6["env.test.js"]
    end

    subgraph frontendChecks["Web checks"]
        LINT["npm run lint"]
        BUILD["npm run build"]
    end

    H2 --> SEC
    H2 --> ASSESS
    H2 --> EMAIL
    H2 --> TOKEN
    H2 --> OAUTH
    H2 --> RESET
    H2 --> MAUTH
    H2 --> MKEY
    H2 --> MSTU
    H2 --> MAN
    H2 --> ME2E

    VITEST --> AT1
    VITEST --> AT2
    VITEST --> AT3
    VITEST --> AT4
    VITEST --> AT5
    VITEST --> AT6
```

**Verification commands**

```powershell
# Gateway
cd gateway\ai-upskilling-platform
.\mvnw.cmd test

# Assistant service
cd skillup-assistant
npm test

# Web app
cd web-app
npm run lint
npm run build
```

---

## Summary of Key Implemented Invariants

| Invariant | Enforced by |
|---|---|
| Access tokens never persisted in browser storage | In-memory token in `web-app/src/services/api.js` |
| Refresh token theft detection | Hash-only storage + family revocation in `AuthTokenServiceImpl` |
| Correct answers never sent during an active test | `AssessmentState` response omits difficulty and `correctOption` |
| Answers evaluated server-side | `AssessmentService.answer` compares against persisted item |
| Item history is preserved | Assessment items carry `ACTIVE` or `RETIRED` status, and responses reference item IDs |
| OAuth email collision is not auto-linked | `OAuthAccountLinkingServiceImpl` rejects `OAUTH_ACCOUNT_EXISTS` |
| Skill graph remains a DAG | `AssessmentDataLoader` Kahn topological validation |
| Uniform API error envelope | `GlobalExceptionHandler` and `ApiResponse` |
| Internal assistant key stays server-side | Gateway proxy with `X-Internal-API-Key` |
| Mentor-only endpoints | `SecurityConfig` rule for `/api/v1/mentor/**` |
