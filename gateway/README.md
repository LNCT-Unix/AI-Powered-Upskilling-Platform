# AI Upskilling Platform — Spring Boot Gateway Service

> **Base Package:** `com.unix.aiupskilling`  
> **Runtime:** Java 21+ • Spring Boot 3.x  
> **Port:** `8080` (Configurable via `SERVER_PORT`)  
> **Maintainers:** Team Unix (EPAM Systems CoE Programme) • Lead: Dev Sharma  

---

## 📑 Table of Contents

1. [Overview & Role](#1-overview--role)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Architecture & Subsystem Layout](#3-architecture--subsystem-layout)
4. [Adaptive Assessment Engine (IRT 1-PL Rasch)](#4-adaptive-assessment-engine-irt-1-pl-rasch)
5. [In-Memory Caching & Performance Optimizations](#5-in-memory-caching--performance-optimizations)
6. [Security & Authentication Subsystem](#6-security--authentication-subsystem)
7. [REST API Reference](#7-rest-api-reference)
8. [Database Schema & Indexes](#8-database-schema--indexes)
9. [Configuration & Environment Variables](#9-configuration--environment-variables)
10. [Local Development, Build & Tests](#10-local-development-build--tests)

---

## 1. Overview & Role

The **Spring Boot Gateway Service** is the central backend engine and API gateway for the AI-Powered Upskilling Platform. It manages:

- **Authentication & Security:** Dual-token OAuth2 (Google OIDC and GitHub), Email/Password registration with 6-digit email OTP verification, password reset flows, and JWT session rotation.
- **Adaptive Knowledge Diagnostics:** An Item Response Theory (IRT 1-PL Rasch Model) Computerized Adaptive Testing (CAT) engine that pins a learner's ability level ($\theta$) in 5 to 9 questions.
- **Skill Graph Topology:** Ingestion, validation, and traversal of Directed Acyclic Graphs (DAGs) representing prerequisite-linked competencies across learning tracks (56 backend skills, 72 prerequisite edges).
- **Low-Latency Item Selection:** Fast index-backed anti-join queries for next-question selection without cache staleness or proxy bypass issues.
- **Session & Results Persistence:** Full transactional audit history of answers, ability estimates, competency levels, and post-assessment gap reports.

---

## 2. Tech Stack & Dependencies

- **Language & Framework:** Java 21, Spring Boot 3.x
- **Persistence & ORM:** Spring Data JPA, Hibernate, HikariCP connection pool
- **Database:** PostgreSQL 16+ (Local or Neon Cloud PostgreSQL)
- **Security:** Spring Security 6.x, JJWT (HMAC-SHA256 `HS256`), Spring Security OAuth2 Client
- **Mailing:** Spring Boot Starter Mail (Gmail SMTP integration for OTP delivery)
- **Validation:** Hibernate Validator (`jakarta.validation`)
- **Utilities:** Lombok, SnakeYAML, Jackson

---

## 3. Architecture & Subsystem Layout

```
gateway/ai-upskilling-platform/src/main/java/com/unix/aiupskilling/
├── AiUpskillingPlatformApplication.java   # Spring Boot entry point (@EnableCaching)
│
├── assessment/                            # Adaptive assessment & skill graph engine
│   ├── controller/
│   │   └── AssessmentController.java      # REST endpoints for tracks, skills, test lifecycle & reports
│   ├── dto/                               # StartRequest, AnswerRequest, AssessmentState, ResultView, AssessmentReport
│   ├── model/entity/
│   │   ├── Assessment.java                # Test run state (user, track, theta, level, status)
│   │   ├── AssessmentItem.java            # Calibrated question bank items (difficulty, stem, options, cluster)
│   │   ├── AssessmentResponse.java        # Per-question response audit (selectedOption, isCorrect, thetaAfter)
│   │   ├── AssessmentSkillResult.java     # Post-test skill state snapshot (MASTERED / FRONTIER / LOCKED)
│   │   ├── Skill.java                     # Atomic competency node with prerequisite IDs and difficulty
│   │   └── Track.java                     # Learning track container (e.g. backend-engineering)
│   ├── repository/
│   │   ├── AssessmentItemRepository.java  # Active item pool queries & difficulty sorting
│   │   ├── AssessmentRepository.java      # Test session queries with user isolation
│   │   ├── AssessmentResponseRepository.java # Sequential response history
│   │   ├── AssessmentSkillResultRepository.java # Saved skill mastery states
│   │   ├── SkillRepository.java           # Graph query with fetch joins for prerequisites
│   │   └── TrackRepository.java           # Active track discovery
│   └── service/
│       ├── AssessmentDataLoader.java      # Seeds backend-skills.yaml and validates DAG (cycle & orphan checks)
│       └── AssessmentService.java         # Rasch CAT algorithm, answer scoring, and report generation
│
├── authentication/                        # Authentication & identity management
│   ├── config/
│   │   ├── AuthProperties.java            # Bound properties (JWT TTLs, CORS origins, callback URLs)
│   │   └── SecurityConfig.java            # Stateless SecurityFilterChain, CORS config, JWT filter
│   ├── controller/
│   │   ├── AuthLinkController.java        # OAuth provider linking intents
│   │   ├── AuthTokenController.java       # OAuth2 exchange, token refresh, logout, /me
│   │   ├── EmailAuthController.java       # Email signup, OTP verification, resend, login
│   │   └── PasswordResetController.java   # Forgot password, verify OTP, reset password
│   ├── dto/                               # Auth request/response DTOs
│   ├── model/entity/
│   │   ├── EmailVerificationOtp.java      # 6-digit verification OTP records
│   │   ├── OAuthAccount.java              # External identity mapping (provider, provider_subject)
│   │   ├── PasswordResetToken.java        # Password reset verification records
│   │   ├── RefreshToken.java              # Opaque rotating refresh tokens
│   │   └── User.java                      # Core user profile entity
│   └── service/
│       ├── AuthTokenService.java          # Access/refresh token minting, rotation, and revocation
│       ├── EmailAuthService.java          # Registration, OTP validation, and password login
│       ├── EmailService.java              # SMTP email dispatcher
│       ├── OAuthAccountLinkingService.java# Anti-hijack OAuth account linking and creation
│       └── PasswordResetService.java      # Password reset OTP generation and password update
│
└── shared/                                # Cross-cutting concerns
    ├── controller/
    │   └── HealthController.java          # Liveness & readiness probes
    ├── dto/
    │   └── ApiResponse.java               # Standard unified API response envelope
    └── exception/
        ├── GlobalExceptionHandler.java    # Centralized REST error handling
        └── ResourceNotFoundException.java # Normalized 404 responses
```

---

## 4. Adaptive Assessment Engine (IRT 1-PL Rasch)

The assessment module implements a 1-Parameter Logistic (1-PL) Rasch Model:

$$P_i(\theta) = \frac{1}{1 + e^{-(\theta - b_i)}}$$

Where:
- $\theta \in [-3.0, +3.0]$: Learner latent ability in logits.
- $b_i \in [-3.0, +3.0]$: Question difficulty parameter in logits.

### Adaptive Test Lifecycle
1. **Pre-Test Calibration:** Learners can declare skills they already know during onboarding (`knownSkillSlugs`). Declared skills are immediately added to their mastered set and help initialize calibration.
2. **Dynamic Item Selection:** The engine picks the unused item from the track's active pool whose calibrated difficulty $b_i$ is closest to the current estimated ability $\theta$:
   $$\arg\min_{i \in \text{Unused}} |b_i - \hat{\theta}|$$
3. **Step Update:**
   - Correct answer: $\hat{\theta}_{k+1} = \hat{\theta}_k + 0.35$ logits.
   - Incorrect answer: $\hat{\theta}_{k+1} = \hat{\theta}_k - 0.35$ logits.
4. **Stopping Criteria:**
   - Maximum items reached: 9 questions (`MAX_ITEMS`).
   - Ability confirmed: Minimum 8 questions answered (`MIN_ITEMS`) **and** the learner has changed answer direction at least 2 times (`LEVEL_CONFIRMED`).
   - Pool exhaustion: No questions remain (`NO_QUESTIONS_LEFT`).
5. **Competency Level Assignment:**
   - $\theta < -0.5 \implies$ **BEGINNER**
   - $-0.5 \le \theta \le 0.75 \implies$ **INTERMEDIATE**
   - $\theta > 0.75 \implies$ **ADVANCED**

---

## 5. Database & Query Performance Optimizations

To deliver low-latency response times during adaptive testing:

1. **Indexed Anti-Join Query (`findNext`):**
   - Candidate selection uses a `LEFT JOIN ... WHERE r.id IS NULL` anti-join on `AssessmentResponse`, avoiding correlated `NOT IN` subqueries and avoiding in-memory proxy bypass or cache invalidation defects.
   - Questions are ordered by `ABS(i.difficulty - :theta), i.id` with a database `LIMIT 1`.
2. **Database Query Optimization:**
   - In `buildSkillResults()`, all track skills and their prerequisites are fetched in a single joined query (`findByTrackIdWithPrerequisites`), eliminating $N+1$ query overhead when generating reports.
3. **Composite Database Indexes:**
   - `assessments`: `(user_id, track_id, status)` and `(id, user_id)`
   - `assessment_items`: `(track_id, status)` and `(track_id, status, difficulty)`
   - `assessment_responses`: `(assessment_id, seq)` and `(item_id)`

---

## 6. Security & Authentication Subsystem

### Dual-Token Architecture
- **Access Tokens:** Short-lived JWTs (15 minutes / 900s) signed with HMAC-SHA256 (`HS256`). Held strictly in-memory by web clients.
- **Refresh Tokens:** Long-lived rotating opaque tokens (30 days / 2,592,000s) stored in PostgreSQL with token family reuse detection.
  - **Web Platform:** Delivered via `HttpOnly; SameSite=Lax; Path=/api/auth` cookie.
  - **Mobile Platform:** Detected via `X-Client-Platform: mobile` request header; delivered in the JSON response payload.

### Account Linking Matrix
- **Google OIDC / GitHub OAuth:** Extracts verified email identities (using GitHub User Emails API if email is private).
- **Collision Protection:** If an account already exists with password authentication, automatic OAuth linking is prevented (`OAUTH_ACCOUNT_EXISTS`). The user must log in and link explicitly.
- **Unverified Account Reclaim:** If a user registered with email/password but never verified their OTP, signing in with a verified OAuth provider reclaims the account and marks email verified.

---

## 7. REST API Reference

### 7.1 Authentication Endpoints (`/api/auth`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/oauth2/authorization/{provider}` | Public | Initiates Google or GitHub OAuth redirect |
| `POST` | `/api/auth/oauth2/exchange` | Public | Exchanges single-use login code for JWT access token |
| `POST` | `/api/auth/register` | Public | Register with email & password; sends 6-digit OTP |
| `POST` | `/api/auth/email-verification/confirm` | Public | Confirms 6-digit email OTP and issues JWT |
| `POST` | `/api/auth/email-verification/resend` | Public | Resends email verification OTP |
| `POST` | `/api/auth/login` | Public | Authenticates with email & password |
| `POST` | `/api/auth/forgot-password` | Public | Sends password reset OTP to user email |
| `POST` | `/api/auth/verify-reset-otp` | Public | Validates password reset OTP; returns reset token |
| `POST` | `/api/auth/reset-password` | Public | Resets password using validated reset token |
| `GET` | `/api/auth/me` | Bearer | Fetches current authenticated user profile |
| `POST` | `/api/auth/refresh` | Cookie / Body | Rotates refresh token and returns fresh access token |
| `POST` | `/api/auth/logout` | Cookie / Body | Revokes refresh token and clears session cookie |
| `POST` | `/api/auth/oauth-links/{provider}/intent` | Bearer | Generates intent to link OAuth account to current user |

### 7.2 Assessment Endpoints (`/api/v1/assessments`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/assessments/tracks` | Public/Auth | Lists active tracks for onboarding dropdown |
| `GET` | `/api/v1/assessments/tracks/{trackId}/skills` | Public/Auth | Lists all skills for pre-test calibration |
| `POST` | `/api/v1/assessments` | Bearer | Starts new test or resumes active one (accepts `trackId` & `knownSkillSlugs`) |
| `GET` | `/api/v1/assessments/{id}` | Bearer | Gets current state (next question or done) |
| `POST` | `/api/v1/assessments/{id}/responses` | Bearer | Submits answer (`itemId`, `selectedOption`) and advances engine |
| `GET` | `/api/v1/assessments/{id}/result` | Bearer | Summary result view (level, ability score, correct count) |
| `GET` | `/api/v1/assessments/{id}/report` | Bearer | Comprehensive report with per-question review and full skill graph state |

---

## 8. Database Schema & Indexes

PostgreSQL migrations run automatically via Hibernate / DDL:

- `users`: Core profile (`id`, `email`, `full_name`, `password_hash`, `email_verified`, `role`, timestamps).
- `oauth_accounts`: Provider links (`provider`, `provider_subject`, `user_id`, `email`).
- `refresh_tokens`: Rotating tokens with token family hash and expiration.
- `email_verification_otps`: 6-digit OTP codes with 15-minute TTL.
- `tracks`: Available curricula (`id`, `slug`, `name`, `status`).
- `skills`: Graph nodes (`id`, `track_id`, `slug`, `name`, `cluster`, `difficulty`, `prerequisites`).
- `assessment_items`: Calibrated question pool (`id`, `track_id`, `stem`, `options`, `correct_option`, `difficulty`, `cluster`, `status`).
- `assessments`: User test runs (`id`, `user_id`, `track_id`, `status`, `theta`, `level`, `correct_count`, `items_administered`).
- `assessment_responses`: Sequential answer audits (`id`, `assessment_id`, `item_id`, `selected_option`, `is_correct`, `seq`).
- `assessment_skill_results`: Skill graph classification per test (`assessment_id`, `skill_id`, `state`).

---

## 9. Configuration & Environment Variables

Configure in `src/main/resources/application.properties` or provide via environment:

```properties
# Server
server.port=8080

# Database (PostgreSQL)
spring.datasource.url=jdbc:postgresql://localhost:5432/UpskillDB
spring.datasource.username=postgres
spring.datasource.password=your_password

# Gmail SMTP for OTP Delivery
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your_email@gmail.com
spring.mail.password=your_app_password
app.mail.from=your_email@gmail.com

# OAuth2 Identity Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Application Security
APP_AUTH_JWT_SECRET=min-32-chars-hmac-sha256-secret-key-goes-here
app.auth.frontend.web-callback-url=http://localhost:5173/auth/callback
app.auth.frontend.web-error-url=http://localhost:5173/auth/error
```

---

## 10. Local Development, Build & Tests

### Prerequisites
- Java 21 JDK installed
- PostgreSQL 16+ running locally with database `UpskillDB`

### Run Application
```powershell
# From gateway/ai-upskilling-platform
./mvnw.cmd spring-boot:run
```

### Run Automated Tests
```powershell
./mvnw.cmd test
```

### Build Executable JAR
```powershell
./mvnw.cmd clean package -DskipTests
java -jar target/ai-upskilling-platform-0.0.1-SNAPSHOT.jar
```
