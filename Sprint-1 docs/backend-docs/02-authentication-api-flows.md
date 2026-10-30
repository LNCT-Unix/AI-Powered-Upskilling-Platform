# 02. Authentication & Identity API Flows

> **Module:** `com.unix.aiupskilling.authentication` & `com.unix.aiupskilling.user`  
> **Controllers:** `EmailAuthController`, `MentorAuthController`, `AuthTokenController`, `PasswordResetController`, `AuthLinkController`, `UserController`  

---

## 1. User & Mentor Registration Flows

The platform supports two distinct registration workflows: one for standard learners (`Role.USER`) and one for mentors/instructors (`Role.MENTOR`). Both trigger an asynchronous 6-digit verification OTP delivered via SMTP.

### 1.1 Learner Registration (`POST /api/auth/register`)

```mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend Client
    participant Controller as EmailAuthController
    participant Provisioning as UserProvisioningService
    participant TokenService as EmailVerificationService
    participant Publisher as ApplicationEventPublisher
    participant MailSender as JavaMailSender (Async)
    participant DB as PostgreSQL

    Client->>Controller: POST /api/auth/register<br/>{ "email": "alice@example.com", "password": "...", "fullName": "Alice" }
    Controller->>Provisioning: registerLearner(request, clientIp)
    Provisioning->>DB: Check if normalized email exists
    alt Email already registered & verified
        Provisioning-->>Controller: Throw ConflictException ("Email already exists")
        Controller-->>Client: 409 Conflict
    else Email exists but UNVERIFIED
        Note over Provisioning: Re-issue verification OTP for existing record
    else New Registration
        Provisioning->>DB: INSERT into users (email, password_hash, role='USER', verified=false)
    end
    Provisioning->>TokenService: createVerificationOtp(userId)
    TokenService->>TokenService: Generate 6-digit secure numeric code & SHA-256 hash
    TokenService->>DB: INSERT into email_verification_tokens (user_id, token_hash, expires_at)
    TokenService->>Publisher: publishEvent(EmailVerificationEvent)
    Publisher-)MailSender: Send verification email asynchronously
    Controller-->>Client: 202 Accepted<br/>{ "success": true, "message": "Verification code sent" }
```

#### Request Specification
- **Method / URI:** `POST /api/auth/register`
- **Headers:** `Content-Type: application/json`
- **Payload:**
```json
{
  "email": "learner@example.com",
  "password": "Password123!",
  "fullName": "Learner One",
  "username": "learner_one"
}
```

#### Response Specifications
- **Success (`202 Accepted`):**
```json
{
  "success": true,
  "message": "If the email is eligible, a 6-digit verification code has been sent.",
  "data": {
    "email": "learner@example.com",
    "expiresInSeconds": 900
  },
  "timestamp": "2026-10-30T10:15:30.123456"
}
```
- **Error (`409 Conflict`):**
```json
{
  "success": false,
  "message": "An account with this email already exists.",
  "data": {
    "code": "EMAIL_ALREADY_EXISTS"
  },
  "timestamp": "2026-10-30T10:15:30.456789"
}
```

---

### 1.2 Mentor Registration (`POST /api/auth/mentor/register`)

The mentor registration flow provisions a user with `role = Role.MENTOR` and captures institution details.

```mermaid
sequenceDiagram
    autonumber
    actor Mentor as Prospective Mentor
    participant Controller as MentorAuthController
    participant Service as MentorAuthService
    participant DB as PostgreSQL
    participant Mail as Async Mail Event

    Mentor->>Controller: POST /api/auth/mentor/register<br/>{ "email": "prof@university.edu", "fullName": "Dr. Smith", ... }
    Controller->>Service: register(request, clientIp)
    Service->>DB: Check email uniqueness
    Service->>DB: INSERT into users (email, role='MENTOR', email_verified=false)
    Service->>DB: INSERT into mentor_profiles (user_id, institution_name, designation, bio)
    Service->>DB: Generate & store 6-digit OTP in email_verification_tokens
    Service-)Mail: Trigger EmailVerificationEvent
    Controller-->>Mentor: 202 Accepted
```

#### Request Specification
- **Method / URI:** `POST /api/auth/mentor/register`
- **Payload:**
```json
{
  "email": "mentor@lnct.ac.in",
  "password": "SecurePassword99!",
  "fullName": "Prof. Alan Turing",
  "institutionName": "Lakshmi Narain College of Technology",
  "department": "Computer Science & Engineering",
  "designation": "Head of Department",
  "bio": "Mentoring algorithms and distributed systems."
}
```

---

## 2. Email Verification & OTP Confirmation (`POST /api/auth/email-verification/confirm`)

Confirms the 6-digit code, marks the user's account as verified, and immediately logs the user in by generating both an Access Token and Refresh Token.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend Client
    participant Controller as EmailAuthController
    participant Service as EmailVerificationService
    participant TokenService as AuthTokenService
    participant DB as PostgreSQL

    Client->>Controller: POST /api/auth/email-verification/confirm<br/>{ "email": "learner@example.com", "code": "849201" }
    Controller->>Service: confirmVerification(email, code)
    Service->>Service: Hash code with SHA-256
    Service->>DB: SELECT token WHERE user_id = ? AND token_hash = ? AND expires_at > NOW()
    alt Token Invalid or Expired
        Service-->>Controller: Throw InvalidOtpException
        Controller-->>Client: 400 Bad Request ("Invalid or expired OTP")
    else Token Valid
        Service->>DB: UPDATE users SET email_verified = true, email_verified_at = NOW()
        Service->>DB: DELETE from email_verification_tokens WHERE user_id = ?
        Service->>TokenService: issueTokens(user, ClientPlatform.WEB)
        TokenService->>DB: INSERT into refresh_tokens (user_id, token_hash, expires_at)
        TokenService->>TokenService: Mint HMAC-SHA256 JWT
        Controller-->>Client: 200 OK + Set-Cookie (refresh_token) + { "accessToken": "..." }
    end
```

#### Request Specification
- **Method / URI:** `POST /api/auth/email-verification/confirm`
- **Aliases:** Also mapped to `/api/auth/email-verification/verify-otp` for backwards compatibility.
- **Payload:**
```json
{
  "email": "learner@example.com",
  "code": "849201"
}
```

#### Response Specification (`200 OK`)
- **Headers:** `Set-Cookie: refresh_token=RAW_REFRESH_TOKEN; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=2592000`
- **Body:**
```json
{
  "success": true,
  "message": "Email verified successfully.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "user": {
      "id": "1",
      "email": "learner@example.com",
      "fullName": "Learner One",
      "username": "learner_one",
      "role": "USER",
      "emailVerified": true
    }
  },
  "timestamp": "2026-10-30T10:16:00.000000"
}
```

---

## 3. Credential Login Flow (`POST /api/auth/login`)

Authenticates an existing user using email/password credentials.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend Client
    participant Controller as AuthTokenController
    participant AuthManager as AuthenticationManager / DelegatingPasswordEncoder
    participant TokenService as AuthTokenService
    participant DB as PostgreSQL

    Client->>Controller: POST /api/auth/login<br/>{ "email": "learner@example.com", "password": "Password123!" }
    Controller->>DB: SELECT user WHERE email = ?
    alt User Not Found
        Controller-->>Client: 401 Unauthorized ("Invalid email or password")
    else User Found
        Controller->>AuthManager: passwordEncoder.matches(rawPassword, user.passwordHash)
        alt Password Mismatch
            Controller-->>Client: 401 Unauthorized ("Invalid email or password")
        else Password Valid
            alt User Email NOT Verified
                Controller-->>Client: 403 Forbidden ("EMAIL_NOT_VERIFIED")
            else Account Inactive/Suspended
                Controller-->>Client: 403 Forbidden ("ACCOUNT_SUSPENDED")
            else Account OK
                Controller->>TokenService: createTokens(user, clientPlatform)
                TokenService->>DB: Persist SHA-256 Hashed Refresh Token
                TokenService->>TokenService: Sign JWT Access Token
                Controller-->>Client: 200 OK + Set-Cookie (refresh_token) + { "accessToken": "..." }
            end
        end
    end
```

#### Request Specification
- **Method / URI:** `POST /api/auth/login`
- **Payload:**
```json
{
  "email": "learner@example.com",
  "password": "Password123!"
}
```

---

## 4. Token Refresh & Rotation Flow (`POST /api/auth/refresh`)

Enables continuous, frictionless user sessions without storing the high-privilege refresh token in client JavaScript.

```mermaid
sequenceDiagram
    autonumber
    actor Browser as Browser Client
    participant Controller as AuthTokenController
    participant TokenService as AuthTokenService
    participant DB as PostgreSQL

    Browser->>Controller: POST /api/auth/refresh<br/>Cookie: refresh_token=RAW_TOKEN_VALUE<br/>credentials: 'include'
    Controller->>TokenService: refreshToken(rawToken, clientPlatform, clientIp)
    TokenService->>TokenService: Compute SHA-256(rawToken)
    TokenService->>DB: SELECT * FROM refresh_tokens WHERE token_hash = ?
    alt Token Not Found or Expired
        TokenService-->>Controller: Throw InvalidRefreshTokenException
        Controller-->>Browser: 401 Unauthorized (Session Expired)
    else Token Revoked = true
        Note over TokenService: Potential Replay Attack Detected!
        TokenService->>DB: Invalidate all active sessions for this user
        TokenService-->>Controller: Throw SecurityCompromiseException
        Controller-->>Browser: 401 Unauthorized
    else Token Valid & Active
        TokenService->>DB: UPDATE refresh_tokens SET revoked = true WHERE id = ?
        TokenService->>TokenService: Generate new Raw Refresh Token & Hash
        TokenService->>DB: INSERT into refresh_tokens (user_id, token_hash, expires_at)
        TokenService->>TokenService: Mint fresh 15-minute JWT
        Controller-->>Browser: 200 OK<br/>Set-Cookie: refresh_token=NEW_RAW_TOKEN<br/>{ "accessToken": "NEW_JWT", ... }
    end
```

#### Request Specification
- **Method / URI:** `POST /api/auth/refresh`
- **Headers:** `Content-Type: application/json`
- **Credentials:** `credentials: 'include'` (automatically transmits the `refresh_token` cookie)
- **Optional Payload (Mobile Only):** If running on a native platform where cookies are disabled:
```json
{
  "refreshToken": "64_character_hex_token_string"
}
```

---

## 5. Logout Flow (`POST /api/auth/logout`)

Terminates user sessions, invalidates the database token, and expires the client cookie.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend Client
    participant Controller as AuthTokenController
    participant TokenService as AuthTokenService
    participant DB as PostgreSQL

    Client->>Controller: POST /api/auth/logout<br/>Cookie: refresh_token=RAW_TOKEN
    Controller->>TokenService: revokeToken(rawToken)
    TokenService->>DB: UPDATE refresh_tokens SET revoked = true WHERE token_hash = SHA256(rawToken)
    Controller->>Controller: Build expired Set-Cookie (Max-Age=0)
    Controller-->>Client: 200 OK + Set-Cookie: refresh_token=; Max-Age=0
```

---

## 6. Password Reset Lifecycle

A 3-step security protocol designed to prevent account enumeration, brute-force attacks, and session leakage.

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant Controller as PasswordResetController
    participant Service as PasswordResetService
    participant DB as PostgreSQL
    participant Mail as JavaMailSender

    rect rgb(240, 248, 255)
    Note over User, Mail: Step 1: Request Reset OTP
    User->>Controller: POST /api/auth/forgot-password { "email": "alice@test.com" }
    Controller->>Service: forgotPassword(email, clientIp)
    Service->>DB: SELECT user WHERE email = ?
    opt User exists
        Service->>DB: INSERT into password_reset_tokens (user_id, otp_hash, expires_at=15m)
        Service-)Mail: Send 6-digit Reset OTP
    end
    Controller-->>User: 200 OK ("If an account exists, a reset code has been sent.")
    end

    rect rgb(245, 255, 245)
    Note over User, Mail: Step 2: Verify Reset OTP
    User->>Controller: POST /api/auth/verify-reset-otp { "email": "alice@test.com", "otp": "512890" }
    Controller->>Service: verifyResetOtp(email, otp)
    Service->>DB: Verify OTP & mark OTP used
    Service->>Service: Generate short-lived (5 min) cryptographically secure Reset Token
    Service->>DB: Store reset_token_hash in password_reset_tokens
    Controller-->>User: 200 OK { "resetToken": "SECURE_RESET_TOKEN_STRING" }
    end

    rect rgb(255, 250, 240)
    Note over User, Mail: Step 3: Set New Password
    User->>Controller: POST /api/auth/reset-password<br/>{ "resetToken": "...", "newPassword": "..." }
    Controller->>Service: resetPassword(resetToken, newPassword)
    Service->>DB: Validate Reset Token Hash
    Service->>DB: UPDATE users SET password_hash = BCrypt(newPassword)
    Service->>DB: Invalidate all existing Refresh Tokens for this user (Revoke all sessions)
    Controller-->>User: 200 OK ("Password reset successfully.")
    end
```

---

## 7. Authenticated User Profile APIs

### 7.1 Verify Session & Get Self (`GET /api/auth/me`)
- **Method / URI:** `GET /api/auth/me`
- **Headers:** `Authorization: Bearer <jwt_access_token>`
- **Internal Execution:**
  1. `JwtAuthenticationFilter` validates signature and loads `User` from PostgreSQL.
  2. Controller returns the loaded `User` mapped to `UserResponse`.
- **Response (`200 OK`):**
```json
{
  "success": true,
  "message": "User retrieved",
  "data": {
    "id": 1,
    "email": "learner@example.com",
    "fullName": "Learner One",
    "username": "learner_one",
    "avatarUrl": "https://images.unsplash.com/photo-...",
    "bio": "Full-stack enthusiast",
    "role": "USER",
    "emailVerified": true,
    "createdAt": "2026-10-25T14:00:00"
  },
  "timestamp": "2026-10-30T10:20:00.000000"
}
```

### 7.2 Update User Profile (`PUT /api/users/profile`)
- **Method / URI:** `PUT /api/users/profile`
- **Headers:** `Authorization: Bearer <jwt_access_token>`, `Content-Type: application/json`
- **Payload:**
```json
{
  "fullName": "Learner One Updated",
  "bio": "Architecting resilient distributed systems",
  "avatarUrl": "https://avatar.example.com/learner.png"
}
```
- **Response (`200 OK`):** Returns updated `UserResponse`.

