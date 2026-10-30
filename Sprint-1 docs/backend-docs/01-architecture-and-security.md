# 01. System & Security Architecture

> **Service:** `gateway/ai-upskilling-platform`  
> **Framework:** Spring Boot 3.2.x / Spring Security 6 / Java 21  
> **Database:** PostgreSQL 16 (HikariCP Connection Pool)  

---

## 1. Gateway Subsystem & Layered Anatomy

The Gateway is structured around Domain-Driven Design (DDD) principles with clear separation of responsibilities across controllers, service interfaces, data repositories, and persistent entities:

```mermaid
flowchart TD
    subgraph Client["Client (Browser / Native App)"]
        REQ["HTTP Request\n(Headers, Bearer JWT, Cookies)"]
        RES["HTTP Response\n(JSON ApiResponse<T>, Set-Cookie)"]
    end

    subgraph SecurityLayer["Spring Security Filter Chain"]
        CORS["CorsFilter\nAllowed Origins: localhost:5173, *.trycloudflare.com"]
        SEC_MATCH{"Security Matcher"}
        OAUTH_CHAIN["Chain 1: OAuth2 Filter Chain\n(/oauth2/**, /login/oauth2/**)"]
        API_CHAIN["Chain 2: API Filter Chain\n(Stateless, Bearer Interceptor)"]
        JWT_FILTER["JwtAuthenticationFilter\nExtract Bearer -> Verify HMAC -> Set SecurityContext"]
    end

    subgraph ControllerLayer["Spring Web MVC Controllers"]
        AC["AssessmentController"]
        MC["Mentor Controllers"]
        AUC["Auth Controllers"]
        UC["UserController"]
    end

    subgraph ServiceLayer["Service & Business Logic Engine"]
        AS["AssessmentService\n(IRT Rasch Algorithm & DAG Traversal)"]
        MS["MentorDashboardService / MentorKeyService"]
        TS["AuthTokenService / EmailAuthService"]
        US["UserService / UserProvisioningService"]
    end

    subgraph PersistenceLayer["Spring Data JPA Repositories & DB"]
        REPOS["JPA Repositories\n(Hibernate 6, HikariCP Pool)"]
        PG[("PostgreSQL 16 Database")]
    end

    REQ --> CORS --> SEC_MATCH
    SEC_MATCH -->|OAuth routes| OAUTH_CHAIN
    SEC_MATCH -->|API routes| API_CHAIN --> JWT_FILTER
    JWT_FILTER --> ControllerLayer
    ControllerLayer --> ServiceLayer
    ServiceLayer --> PersistenceLayer
    PersistenceLayer --> PG
    ServiceLayer -.->|Async Event| EVT["ApplicationEventPublisher\n(EmailVerificationEvent)"]
    ControllerLayer --> RES
```

### 1.1 Layer Responsibilities

1. **Interception & Security Layer:**
   - Evaluates incoming request origin against whitelist.
   - Enforces transport security and CORS permissions (`allowCredentials=true`).
   - Extracts and validates access tokens from the `Authorization: Bearer <token>` header.
   - Converts valid claims into a Spring Security `UsernamePasswordAuthenticationToken` containing the domain `User` entity as the principal.

2. **Controller Layer:**
   - Validates request payloads using Jakarta Bean Validation (`@Valid`, `@NotNull`, `@NotBlank`, `@Email`).
   - Decouples HTTP semantics (status codes, headers, cookie flags) from core business logic.
   - Wraps successful outcomes into the standard `ApiResponse<T>` envelope.

3. **Service Layer:**
   - Implements atomic domain operations with `@Transactional` boundaries.
   - Encapsulates mathematical calculations (IRT Rasch theta calculations), key generation, token lifecycle, and account eligibility.
   - Publishes asynchronous Spring `ApplicationEvent` objects for background tasks (email dispatch).

4. **Persistence Layer:**
   - Utilizes Spring Data JPA with PostgreSQL-optimized queries (e.g., indexed anti-joins, dynamic pagination).
   - Manages connection pooling via HikariCP (`minimum-idle=2`, `maximum-pool-size=10`).

---

## 2. Spring Security Architecture

The backend implements two distinct, ordered `SecurityFilterChain` beans to satisfy both interactive third-party OAuth2 handshakes and high-throughput stateless REST traffic.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Web Browser
    participant Gateway as Spring Security
    participant JWT as JwtAuthenticationFilter
    participant Controller as RestController
    participant Handler as ExceptionHandler

    Client->>Gateway: Incoming HTTP Request
    alt Route is OAuth Handshake (/oauth2/** or /login/oauth2/**)
        Gateway->>Gateway: Match Order(1) OAuth Filter Chain
        Note over Gateway: SessionCreationPolicy: IF_REQUIRED<br/>Processes OIDC userinfo & redirect
    else Route is Standard API (/api/**)
        Gateway->>Gateway: Match Order(2) API Filter Chain
        Note over Gateway: SessionCreationPolicy: STATELESS
        Gateway->>JWT: Execute JwtAuthenticationFilter
        alt Public Endpoint (/api/auth/login, /api/auth/register, /health)
            JWT->>Controller: Permit Request Directly
        else Protected Endpoint
            JWT->>JWT: Extract "Authorization: Bearer <token>"
            alt Token Valid & Active
                JWT->>JWT: Populate SecurityContextHolder with User principal
                JWT->>Controller: Forward to Controller Method
            else Token Missing or Invalid
                JWT-->>Handler: Trigger JsonAuthenticationEntryPoint (401 Unauthorized)
                Handler-->>Client: Standardized 401 Error Envelope
            end
        end
    end
```

### 2.1 Filter Chain 1: OAuth2 Filter Chain (`@Order(1)`)
- **Route Matcher:** `/oauth2/**`, `/login/oauth2/**`.
- **Session Policy:** `SessionCreationPolicy.IF_REQUIRED` (required to maintain the OAuth2 state parameter across browser redirects).
- **Resolver:** `CustomOAuth2AuthorizationRequestResolver` dynamically captures frontend redirect targets (`web` vs. `mobile`).
- **User Services:**
  - `GoogleOidcUserService`: Validates Google ID tokens and extracts verified email and profile claims.
  - `GitHubOAuth2UserService`: Queries GitHub user profile and the `/user/emails` API to resolve primary verified emails.
- **Success Handler:** `OAuth2LoginSuccessHandler` provisions or locates the user, generates a single-use login code, and issues a 302 redirect back to the client application.
- **Failure Handler:** `OAuth2LoginFailureHandler` captures exceptions (such as account conflicts) and redirects to the configured frontend error screen with an encoded error message.

### 2.2 Filter Chain 2: API Filter Chain (`@Order(2)`)
- **Route Matcher:** Default fallback for all remaining endpoints (`/api/**`, `/health`, `/actuator/**`).
- **Session Policy:** `SessionCreationPolicy.STATELESS` (zero server-side sessions created).
- **CSRF Protection:** Explicitly disabled (`AbstractHttpConfigurer::disable`) as the REST API is protected against Cross-Site Request Forgery via Bearer JWTs and strict `SameSite=Lax` cookie flags.
- **Access Entry Point:** `JsonAuthenticationEntryPoint` intercepts unauthenticated attempts and emits a standard `401 Unauthorized` JSON envelope.
- **Access Denied Handler:** `JsonAccessDeniedHandler` intercepts forbidden role attempts (e.g. non-mentor accessing `/api/v1/mentor/**`) and emits a `403 Forbidden` JSON envelope.

---

## 3. Dual-Token Authentication & Storage Lifecycle

The platform enforces the **Dual-Token Storage Paradigm** to balance performance, security, and defense-in-depth against Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF).

```mermaid
flowchart LR
    subgraph StorageClient["Client-Side Boundary"]
        subgraph MemoryOnly["In-Memory (React State / JS Variable)"]
            AT["JWT Access Token\n- TTL: 15 Minutes\n- Payload: userId, email, role\n- Signature: HMAC-SHA256\n- Transmitted: Authorization Header"]
        end

        subgraph SecureCookie["Browser Cookie Storage"]
            RT["Refresh Token Cookie\n- Name: refresh_token\n- HttpOnly: true (No JS access)\n- Path: /api/auth\n- SameSite: Lax\n- TTL: 30 Days"]
        end
    end

    subgraph GatewayAuth["Gateway Server Validation"]
        VALID_JWT["Verify Signature via Secret Key\nNo Database Hit Required"]
        HASH_RT["Compute SHA-256 Hash of Token\nIndexed DB Lookup in refresh_tokens"]
    end

    AT -->|Authorization: Bearer <jwt>| VALID_JWT
    RT -->|Auto-attached on /api/auth/refresh| HASH_RT
```

### 3.1 Token Specifications

| Parameter | Access Token | Refresh Token |
| :--- | :--- | :--- |
| **Format** | Signed JWT (HMAC-SHA256) | Cryptographically Random 64-char Hex String |
| **Storage (Client)** | In-Memory (JavaScript variable / Zustand) | `HttpOnly`, `SameSite=Lax` Cookie |
| **Storage (Server)** | Stateless (validated via signature key) | SHA-256 Hashed in `refresh_tokens` table |
| **Time to Live (TTL)**| 900 seconds (15 minutes) | 2,592,000 seconds (30 days) |
| **Transmission** | Header: `Authorization: Bearer <jwt>` | Automatic Cookie or JSON body for native apps |
| **Risk Mitigated** | Mitigates token exfiltration via XSS | Eliminates malicious client-side token reads |

### 3.2 Token Hashing & Database Security
Plaintext refresh tokens and OTP tokens are **never stored in the database**:
1. When a token is generated:
   $$\text{Raw Token} = \text{SecureRandom}(32 \text{ bytes}) \xrightarrow{\text{Hex Encoded}} 64 \text{ chars}$$
2. The raw token is returned to the client as an `HttpOnly` cookie or response body.
3. The server computes the cryptographic hash:
   $$\text{Token Hash} = \text{SHA-256}(\text{Raw Token})$$
4. Only the hash is persisted in the database table with an indexed column. If the persistence tier is compromised, attackers cannot hijack active user sessions without the corresponding plaintext tokens.

### 3.3 Token Rotation & Replay Attack Defense
When `/api/auth/refresh` is triggered:
1. The server hashes the presented raw refresh token and queries the `refresh_tokens` table.
2. If the token is expired or marked `revoked = true`:
   > [!CAUTION]
   > A revoked token presentation indicates a potential token reuse or replay attack. The server rejects the request (`401 Unauthorized`) and invalidates the session.
3. If valid, the current refresh token is marked `revoked = true`, and an entirely new refresh token is minted, hashed, and returned alongside a fresh JWT.

---

## 4. OAuth2 Social Login: Single-Use Code Exchange

To prevent sensitive authentication tokens from being exposed in browser address bars, history logs, or HTTP `Referer` headers, the gateway implements a **Single-Use Code Exchange Protocol**:

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant Google as Identity Provider (Google/GitHub)
    participant Gateway as Spring Boot Gateway
    participant DB as PostgreSQL Database
    participant Frontend as React 19 Frontend

    User->>Gateway: GET /oauth2/authorization/google
    Gateway-->>User: 302 Redirect to Google OAuth consent
    User->>Google: Authenticate & Authorize
    Google-->>Gateway: 302 Callback to /login/oauth2/code/google?code=...
    
    Gateway->>Google: Exchange authorization code for UserProfile
    Gateway->>DB: Find or Provision User & OAuthAccount
    Gateway->>DB: Generate Single-Use OAuthLoginCode (TTL = 60s)
    
    Gateway-->>Frontend: 302 Redirect to http://localhost:5173/auth/callback?code=CODE_UUID
    
    Frontend->>Gateway: POST /api/auth/oauth2/exchange { "code": "CODE_UUID" }
    Gateway->>DB: Atomically Read & Invalidate OAuthLoginCode
    Gateway->>DB: Generate & Hash RefreshToken
    Gateway->>Gateway: Mint HMAC-SHA256 JWT Access Token
    Gateway-->>Frontend: 200 OK + Set-Cookie (refresh_token) + { "accessToken": "..." }
```

### 4.1 Exchange Protocol Details
1. **TTL:** The exchange code is valid for exactly 60 seconds (`app.auth.jwt.login-code-ttl-seconds=60`).
2. **Atomicity:** When redeemed, the code is immediately deleted or marked used. Multiple attempts with the same code will fail with `401 Unauthorized`.
3. **Platform Adaptability:** Supports both web clients (callback via browser URL) and mobile native applications (callback via custom scheme `myapp://auth/callback`).

---

## 5. Account Linking Architecture (`OAuthLinkIntent`)

The platform allows an existing user (who registered via email/password) to securely link their Google or GitHub accounts without creating duplicate identities:

```mermaid
sequenceDiagram
    autonumber
    actor User as Authenticated User
    participant Gateway as Backend Gateway
    participant DB as PostgreSQL
    participant Provider as OAuth Provider (GitHub/Google)

    User->>Gateway: POST /api/auth/oauth-links/github/intent<br/>Headers: Authorization: Bearer <jwt><br/>Body: { "currentPassword": "..." }
    Gateway->>Gateway: Verify User Password Hash
    Gateway->>DB: Check if Provider already linked (Prevent duplicate linking)
    Gateway->>DB: Store OAuthLinkIntent (userId, provider, TTL=300s)
    Gateway-->>User: 201 Created + Set-Cookie: link_intent=RAW_INTENT_TOKEN
    
    User->>Gateway: GET /oauth2/authorization/github (with link_intent cookie)
    Gateway-->>User: Redirect to GitHub Auth
    User->>Provider: Authorize Application
    Provider-->>Gateway: Callback to /login/oauth2/code/github
    Gateway->>Gateway: Detect link_intent cookie
    Gateway->>DB: Verify Intent Token & Link GitHub ID to userId
    Gateway-->>User: Redirect to Frontend Profile (/settings/accounts?linked=github)
```

---

## 6. Rate Limiting & Abuse Prevention

To defend sensitive authentication endpoints against brute-force attacks and email spamming, the gateway integrates `RateLimiterService`:

| Protected Action | Limit Window | Max Requests | Identified By | HTTP Error |
| :--- | :---: | :---: | :--- | :---: |
| **Email OTP Resend** | 60 minutes | 3 attempts | User Email | `429 Too Many Requests` |
| **Password Reset Request** | 60 minutes | 5 attempts | User Email + Client IP | `429 Too Many Requests` |
| **Mentor Key Association** | 15 minutes | 5 attempts | Student User ID + Client IP | `429 Too Many Requests` |
| **Login Attempts** | 15 minutes | 10 attempts | Email Address + Client IP | `429 Too Many Requests` |

The rate limiter tracks attempts using an in-memory sliding token bucket with automated bucket eviction, logging client IP addresses extracted safely through `X-Forwarded-For` reverse proxy headers.

