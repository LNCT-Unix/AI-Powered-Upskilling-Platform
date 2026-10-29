# Gateway Backend API Reference & Integration Guide

**Target Audience:** Frontend Engineering Team (`web-app/`, React 19)  
**Backend Service:** `gateway/ai-upskilling-platform` (Spring Boot 3.x)  
**Default Base URL:** `http://localhost:8080`  
**Protocol:** RESTful JSON over HTTP  
**Version:** 1.0.0  

---

## 1. Architecture & Protocol Foundations

### 1.1 Base URL & Environment Configuration
In Vite frontend development, the API base URL is configured via environment variables in `web-app/.env`:

```ini
VITE_API_BASE_URL=http://localhost:8080
VITE_USE_MOCK_AUTH=false
```

### 1.2 Global Request Headers & Credentials
Every API request originating from the frontend client must adhere to the following rules:

1. **Content Type**: `Content-Type: application/json` for all requests containing a JSON payload.
2. **Authorization Header**: `Authorization: Bearer <access_token>` for protected endpoints. The access token must be kept strictly **in-memory** (e.g., in `api.js` / React Context) and must **never** be saved to `localStorage` or `sessionStorage` (mitigating XSS vulnerabilities).
3. **Credentials Mode (`credentials: 'include'`)**: Mandatory on **all** fetch requests. This ensures the browser automatically transmits the secure, `HttpOnly` `refresh_token` and `link_intent` cookies across ports (`localhost:5173` to `localhost:8080`).
4. **Origin Validation**: When calling cookie-based endpoints (such as `/api/auth/refresh` or `/api/auth/logout`), the browser automatically sends the `Origin` header (`http://localhost:5173`). The gateway validates this against `auth.cors.allowed-origins`.

### 1.3 Standard Response Envelopes

#### Success Envelope (`ApiResponse<T>`)
Endpoints under `/api/auth` return a unified envelope structure:

```json
{
  "success": true,
  "message": "Operation successful description",
  "data": { ... },
  "timestamp": "2026-10-25T10:00:00.123456"
}
```

#### Assessment DTOs (`/api/v1/assessments`)
The adaptive assessment endpoints return specialized DTOs directly (e.g. `AssessmentState` and `ResultView`) with standard HTTP status codes (`200 OK`, `201 CREATED`).

#### Standard Error Envelope
All error responses from the Spring Boot gateway (including validation failures, unauthorized access, and business conflicts) are normalized by `GlobalExceptionHandler` into the following format:

```json
{
  "success": false,
  "message": "Human-readable error description",
  "data": {
    "code": "ERROR_CODE_STRING",
    "fieldErrors": [
      {
        "field": "fieldName",
        "message": "Specific field validation message"
      }
    ]
  },
  "timestamp": "2026-10-25T10:00:00.123456"
}
```

---

## 2. API Endpoints Quick Reference

### 2.1 Authentication & User Endpoints (`/api/auth`)

| Method | Endpoint | Auth Required | Purpose |
| :--- | :--- | :--- | :--- |
| **GET** | `/oauth2/authorization/{google\|github}` | No | Initiates OAuth2 authorization redirect |
| **POST** | `/api/auth/oauth2/exchange` | No | Exchanges single-use code from callback URL for JWT access token |
| **POST** | `/api/auth/register` | No | Registers user with email & password; sends 6-digit verification OTP |
| **POST** | `/api/auth/email-verification/confirm` | No | Confirms 6-digit email OTP (alias `/email-verification/verify-otp`) & logs in |
| **POST** | `/api/auth/email-verification/resend` | No | Resends 6-digit email verification code |
| **POST** | `/api/auth/login` | No | Authenticates user with email and password |
| **POST** | `/api/auth/forgot-password` | No | Sends 6-digit password reset OTP to registered email |
| **POST** | `/api/auth/verify-reset-otp` | No | Verifies password reset OTP; returns short-lived reset token |
| **POST** | `/api/auth/reset-password` | No | Resets password using reset token |
| **GET** | `/api/auth/me` | Yes (`Bearer`) | Fetches the authenticated user profile & verifies session validity |
| **POST** | `/api/auth/refresh` | Cookie / Body | Rotates refresh token and returns a fresh JWT access token |
| **POST** | `/api/auth/logout` | Cookie / Body | Revokes refresh token and clears session cookie |
| **POST** | `/api/auth/oauth-links/{provider}/intent` | Yes (`Bearer`) | Creates a short-lived intent to link Google or GitHub to existing account |

### 2.2 Onboarding & Assessment Endpoints (`/api/v1/assessments`)

| Method | Endpoint | Auth Required | Purpose |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/assessments/tracks` | No / Bearer | Lists active learning tracks for the onboarding track picker |
| **GET** | `/api/v1/assessments/tracks/{trackId}/skills` | No / Bearer | Lists all skills of a track for pre-test declared calibration |
| **POST** | `/api/v1/assessments` | Yes (`Bearer`) | Starts assessment or resumes active one (accepts `trackId` & `knownSkillSlugs`) |
| **GET** | `/api/v1/assessments/{id}` | Yes (`Bearer`) | Gets current assessment state and next question to answer |
| **POST** | `/api/v1/assessments/{id}/responses` | Yes (`Bearer`) | Submits answer (`itemId`, `selectedOption`) and advances CAT engine |
| **GET** | `/api/v1/assessments/{id}/result` | Yes (`Bearer`) | Returns summary result: level, ability score ($\theta$), and skill tree |
| **GET** | `/api/v1/assessments/{id}/report` | Yes (`Bearer`) | Comprehensive post-assessment report: per-question review and unlocked skills |

---

## 3. Authentication & User Endpoints (`/api/auth`)

### 3.1 OAuth2 Login Initiation

To log in using Google or GitHub, the frontend initiates a top-level window redirection:

```javascript
// Google
window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;

// GitHub
window.location.href = `${API_BASE_URL}/oauth2/authorization/github`;
```

#### Flow Lifecycle
1. The browser navigates to the Spring Boot Gateway.
2. Gateway redirects to the provider's consent page (Google or GitHub).
3. The user approves access.
4. Provider calls the backend callback (`/login/oauth2/code/{provider}`).
5. Backend provisions or identifies the user, creates a single-use login code, and redirects the browser to:
   ```
   http://localhost:5173/auth/callback?code=e83f2a1b-7c9d-4e5f-b0a1-2c3d4e5f6a7b
   ```

---

### 3.2 Exchange One-Time Code for Tokens

`POST /api/auth/oauth2/exchange`

Exchanges the short-lived one-time login code received in the query parameters for a JWT access token. Sets an `HttpOnly` session cookie named `refresh_token`.

#### Request
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "code": "e83f2a1b-7c9d-4e5f-b0a1-2c3d4e5f6a7b"
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresInSeconds": 900,
    "refreshToken": null,
    "user": {
      "id": 1,
      "email": "learner@epam.com",
      "fullName": "Alex Mercer",
      "role": "USER"
    }
  },
  "timestamp": "2026-10-25T10:05:00.000"
}
```
*Note:* `refreshToken` in the JSON body is `null` for web clients because it is stored in the secure `Set-Cookie: refresh_token=...; Path=/api/auth; HttpOnly; SameSite=Lax` header.

#### Error Responses
- `401 Unauthorized`: Code expired, invalid, or already consumed (`INVALID_LOGIN_CODE`).
- `403 Forbidden`: Account is suspended or unverified (`OAUTH_ACCOUNT_DISABLED`).

#### Sample Fetch Call
```javascript
export async function exchangeOAuthCode(code) {
  const response = await fetch(`${API_BASE_URL}/api/auth/oauth2/exchange`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'OAuth exchange failed');
  }

  const result = await response.json();
  // Store accessToken in memory / AuthContext
  return result.data;
}
```

---

### 3.3 Get Current User Profile (`/me`)

`GET /api/auth/me`

Retrieves the currently authenticated user's profile and validates access token freshness. Used during initial page load to re-hydrate `AuthContext`.

#### Request
- **Headers:**
  - `Authorization: Bearer <accessToken>`

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": 1,
    "email": "learner@epam.com",
    "fullName": "Alex Mercer",
    "role": "USER"
  },
  "timestamp": "2026-10-25T10:05:05.000"
}
```

#### Error Responses
- `401 Unauthorized`: Token is missing, malformed, or expired.
- `404 Not Found`: User was deleted (`NOT_FOUND`).

#### Sample Fetch Call
```javascript
export async function fetchCurrentUser(accessToken) {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Profile fetch failed (${response.status})`);
  }

  const result = await response.json();
  return result.data; // { id, email, fullName, role }
}
```

---

### 3.4 Refresh Access Token

`POST /api/auth/refresh`

Rotates the refresh token stored in the `HttpOnly` cookie and issues a fresh JWT access token.

#### Request
- **Headers:**
  - `Content-Type: application/json`
- **Credentials:** Must include `credentials: 'include'` so the cookie is attached.
- **Body:** `{}` (empty object, or omitted)

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Token refresh successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.newAccessToken...",
    "tokenType": "Bearer",
    "expiresInSeconds": 900,
    "refreshToken": null,
    "user": {
      "id": 1,
      "email": "learner@epam.com",
      "fullName": "Alex Mercer",
      "role": "USER"
    }
  },
  "timestamp": "2026-10-25T10:15:00.000"
}
```

#### Error Responses
- `401 Unauthorized`: Refresh token has expired, been revoked, or token family reused (`INVALID_REFRESH_TOKEN`).

#### Sample Fetch Call
```javascript
export async function refreshAccessToken() {
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Refresh token expired or invalid');
  }

  const result = await response.json();
  return result.data.accessToken;
}
```

---

### 3.5 Logout

`POST /api/auth/logout`

Revokes the refresh token family on the server and instructs the browser to delete the `refresh_token` cookie.

#### Request
- **Headers:** None required.
- **Credentials:** Must include `credentials: 'include'`.

#### Response (`204 No Content`)
- Returns empty body with HTTP 204.
- Response header includes: `Set-Cookie: refresh_token=; Max-Age=0; Path=/api/auth; HttpOnly`.

#### Sample Fetch Call
```javascript
export async function logoutUser() {
  await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}
```

---

### 3.6 Create OAuth Link Intent

`POST /api/auth/oauth-links/{provider}/intent`

Allows an authenticated user to link a second OAuth identity (e.g. link GitHub to a Google account).

#### Path Variables
- `provider`: `google` or `github`

#### Request
- **Headers:**
  - `Authorization: Bearer <accessToken>`
  - `Content-Type: application/json`
- **Body** (required if account has a password):
```json
{
  "currentPassword": "UserPassword123!"
}
```

#### Response (`201 Created`)
```json
{
  "success": true,
  "message": "Link intent created",
  "data": {
    "authorizationPath": "/oauth2/authorization/github",
    "expiresInSeconds": 300
  },
  "timestamp": "2026-10-25T10:20:00.000"
}
```
*Next Step:* The frontend redirects the user: `window.location.href = `${API_BASE_URL}${data.authorizationPath}``.

---

### 3.7 Email & Password Registration

`POST /api/auth/register`

Registers a new user account with full name, email, and password. A 6-digit one-time verification passcode (OTP) is automatically dispatched to the learner's email via Gmail SMTP.

#### Request
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "fullName": "Alex Mercer",
  "email": "alex.mercer@example.com",
  "password": "Password123!"
}
```

#### Response (`202 Accepted`)
```json
{
  "success": true,
  "message": "If the email is eligible, a 6-digit verification code has been sent.",
  "data": {
    "email": "alex.mercer@example.com",
    "verificationRequired": true,
    "otpExpiresInSeconds": 900
  },
  "timestamp": "2026-10-29T10:00:00.000"
}
```

---

### 3.8 Confirm Email Verification OTP

`POST /api/auth/email-verification/confirm`  
*(Alternative Alias: `POST /api/auth/email-verification/verify-otp`)*

Verifies the 6-digit OTP code sent during registration. Upon confirmation, marks the email as verified, provisions active credentials, and sets the `refresh_token` cookie.

#### Request
- **Headers:**
  - `Content-Type: application/json`
  - *(Optional)* `X-Client-Platform: mobile` (if calling from a mobile device)
- **Body:**
```json
{
  "email": "alex.mercer@example.com",
  "otp": "491823"
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresInSeconds": 900,
    "refreshToken": null,
    "user": {
      "id": 1,
      "email": "alex.mercer@example.com",
      "fullName": "Alex Mercer",
      "role": "USER"
    }
  },
  "timestamp": "2026-10-29T10:02:00.000"
}
```

---

### 3.9 Resend Email Verification OTP

`POST /api/auth/email-verification/resend`

Generates and emails a fresh 6-digit verification code with a renewed 15-minute TTL. Rate limited to prevent email flooding.

#### Request
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "email": "alex.mercer@example.com"
}
```

#### Response (`202 Accepted`)
```json
{
  "success": true,
  "message": "If the email is eligible, a 6-digit verification code has been sent.",
  "data": {
    "email": "alex.mercer@example.com",
    "verificationRequired": true,
    "otpExpiresInSeconds": 900
  },
  "timestamp": "2026-10-29T10:03:00.000"
}
```

---

### 3.10 Email & Password Login

`POST /api/auth/login`

Authenticates a verified user with email and password.

#### Request
- **Headers:**
  - `Content-Type: application/json`
  - *(Optional)* `X-Client-Platform: mobile`
- **Body:**
```json
{
  "email": "alex.mercer@example.com",
  "password": "Password123!"
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresInSeconds": 900,
    "refreshToken": null,
    "user": {
      "id": 1,
      "email": "alex.mercer@example.com",
      "fullName": "Alex Mercer",
      "role": "USER"
    }
  },
  "timestamp": "2026-10-29T10:04:00.000"
}
```

---

### 3.11 Password Reset Lifecycle

#### A. Request Reset Code
`POST /api/auth/forgot-password`
```json
{ "email": "alex.mercer@example.com" }
```
*Response (`200 OK`):* `{"success": true, "message": "If an account exists with this email, a password reset code has been sent."}`

#### B. Verify Reset OTP
`POST /api/auth/verify-reset-otp`
```json
{
  "email": "alex.mercer@example.com",
  "otp": "829104"
}
```
*Response (`200 OK`):*
```json
{
  "success": true,
  "message": "OTP verified successfully.",
  "data": {
    "resetToken": "7b8c9d0e-1f2a-4b5c-8d9e-0f1a2b3c4d5e"
  }
}
```

#### C. Finalize Password Reset
`POST /api/auth/reset-password`
```json
{
  "email": "alex.mercer@example.com",
  "resetToken": "7b8c9d0e-1f2a-4b5c-8d9e-0f1a2b3c4d5e",
  "newPassword": "NewStrongPassword456!"
}
```
*Response (`200 OK`):* `{"success": true, "message": "Password has been reset successfully."}`

---

### 3.12 Mobile Client Platform Support (`X-Client-Platform: mobile`)

When calling from native mobile clients (React Native, Flutter, or native apps):
1. Include the header: `X-Client-Platform: mobile`.
2. The gateway will skip setting browser `HttpOnly` cookies. Instead, the raw `refreshToken` is returned directly in the response payload `data.refreshToken`.
3. When refreshing tokens via `POST /api/auth/refresh` or logging out via `POST /api/auth/logout`, mobile clients pass `{ "refreshToken": "<token>" }` in the JSON body.

---

## 4. Onboarding & Adaptive Assessment Endpoints (`/api/v1/assessments`)

### 4.1 How the Adaptive Engine Works (CAT)
The platform evaluates learner proficiency using an Item Response Theory (IRT) staircase algorithm:
1. **Starting Point**: Every assessment begins at difficulty `0.0` (or calibrated higher based on declared known skills).
2. **Step Adjustments**: Answering correctly adjusts the candidate's estimated ability ($\theta$) upwards by `+0.35`; answering incorrectly adjusts it downwards by `-0.35`.
3. **Adaptive Item Selection**: The backend dynamically queries the unused item pool whose calibrated difficulty is closest to the candidate's current $\theta$.
   - **Direct Indexed Anti-Join:** Candidate selection queries the item pool using an indexed `LEFT JOIN ... WHERE r.id IS NULL` anti-join on sequential responses, ensuring consistent state and zero proxy bypass issues.
4. **Early Termination Rules**:
   - Minimum: **8 questions**.
   - Maximum: **9 questions**.
   - Stop condition: Once at least 8 questions are answered, if the answers have oscillated direction at least twice (`directionChanges >= 2`), the ability level is confirmed (`LEVEL_CONFIRMED`) and the assessment terminates early.
5. **Proficiency Levels**:
   - `BEGINNER`: $\theta < -0.5$
   - `INTERMEDIATE`: $-0.5 \le \theta \le 0.75$
   - `ADVANCED`: $\theta > 0.75$
6. **Skill States**:
   - `MASTERED`: Difficulty is well below ability ($\text{diff} \le \theta - 0.25$) or skill was declared during onboarding.
   - `FRONTIER`: Not mastered yet, but 100% of prerequisites are mastered (the optimal target for upcoming learning milestones).
   - `LOCKED`: One or more prerequisite skills have not yet been mastered.

---

### 4.2 List Active Tracks

`GET /api/v1/assessments/tracks`

Lists all `ACTIVE` tracks for the onboarding track-picker dropdown.

#### Request
- **Headers:** None required (Public / Authenticated)

#### Response (`200 OK`)
```json
[
  {
    "trackId": "00000000-0000-0000-0000-000000000001",
    "slug": "backend-engineering",
    "name": "Backend Engineering"
  }
]
```

---

### 4.3 List Track Skills for Pre-Test Calibration

`GET /api/v1/assessments/tracks/{trackId}/skills`

Lists all skills within a track for the onboarding pre-selection checklist. Learners mark the skills they already feel comfortable with.

#### Path Variables
- `trackId`: UUID of the track.

#### Request
- **Headers:** None required (Public / Authenticated)

#### Response (`200 OK`)
```json
[
  {
    "skillId": "11111111-0000-0000-0000-000000000001",
    "slug": "programming-basics",
    "name": "Programming Basics",
    "cluster": "Foundations",
    "difficulty": -2.0
  },
  {
    "skillId": "11111111-0000-0000-0000-000000000002",
    "slug": "git-basics",
    "name": "Git Basics",
    "cluster": "Foundations",
    "difficulty": -1.8
  }
]
```

---

### 4.4 Start or Resume Assessment

`POST /api/v1/assessments`

Starts a new diagnostic assessment for the specified track or resumes the one already in progress. Accepts optional `knownSkillSlugs` for pre-test calibration.

#### Request
- **Headers:**
  - `Authorization: Bearer <accessToken>`
  - `Content-Type: application/json`
- **Body:**
```json
{
  "trackId": "00000000-0000-0000-0000-000000000001",
  "knownSkillSlugs": [
    "programming-basics",
    "git-basics",
    "sql-basics"
  ]
}
```

#### Response (`201 Created`)
```json
{
  "assessmentId": "d3b07384-d113-467f-bb8e-a43878b2d19f",
  "status": "IN_PROGRESS",
  "done": false,
  "question": {
    "itemId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "stem": "Which of the following describes the difference between preemptive and non-preemptive CPU scheduling?",
    "options": [
      "In preemptive scheduling, the CPU can be released from a running process before it terminates or blocks",
      "Non-preemptive scheduling utilizes timers to force context switches at regular quantum intervals",
      "Preemptive scheduling prevents high-priority processes from starving low-priority processes",
      "Non-preemptive scheduling is exclusive to real-time embedded operating systems"
    ]
  },
  "answered": 0,
  "max": 9,
  "progress": {
    "answered": 0,
    "max": 9
  }
}
```

#### Error Responses
- `401 Unauthorized`: Missing or invalid Bearer token.
- `404 Not Found`: Track ID does not exist (`Track not found`).
- `409 Conflict`: Track is not active (`Track is not available yet`).

#### Sample Fetch Call
```javascript
export async function startAssessment(accessToken, trackId, knownSkillSlugs = []) {
  const response = await fetch(`${API_BASE_URL}/api/v1/assessments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ trackId, knownSkillSlugs }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to start assessment');
  }

  return response.json(); // returns AssessmentState
}
```

---

### 4.5 Get Assessment State / Resume

`GET /api/v1/assessments/{id}`

Returns the current status of an assessment and the next question waiting to be answered. Ideal for resuming after a page reload.

#### Path Variables
- `id`: UUID of the assessment.

#### Request
- **Headers:**
  - `Authorization: Bearer <accessToken>`

#### Response (`200 OK`)
When still in progress:
```json
{
  "assessmentId": "d3b07384-d113-467f-bb8e-a43878b2d19f",
  "status": "IN_PROGRESS",
  "done": false,
  "question": {
    "itemId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "stem": "When designing an ACID-compliant database transaction, what property does the 'I' represent?",
    "options": [
      "Integrity",
      "Isolation",
      "Immutability",
      "Idempotency"
    ]
  },
  "answered": 2,
  "max": 9,
  "progress": {
    "answered": 2,
    "max": 9
  }
}
```

When already completed:
```json
{
  "assessmentId": "d3b07384-d113-467f-bb8e-a43878b2d19f",
  "status": "COMPLETED",
  "done": true,
  "question": null,
  "answered": 6,
  "max": 9,
  "progress": {
    "answered": 6,
    "max": 9
  }
}
```

#### Error Responses
- `401 Unauthorized`: Authentication required.
- `404 Not Found`: Assessment does not exist or does not belong to the authenticated user.

#### Sample Fetch Call
```javascript
export async function getAssessmentState(accessToken, assessmentId) {
  const response = await fetch(`${API_BASE_URL}/api/v1/assessments/${assessmentId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Could not load assessment state');
  }

  return response.json();
}
```

---

### 4.4 Submit Answer

`POST /api/v1/assessments/{id}/responses`

Submits the learner's choice for the current question. The backend performs database row-level locking to prevent race conditions or double submissions.

#### Path Variables
- `id`: UUID of the assessment.

#### Request
- **Headers:**
  - `Authorization: Bearer <accessToken>`
  - `Content-Type: application/json`
- **Body:**
```json
{
  "itemId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "selectedOption": 1
}
```
*Note:* `selectedOption` is an integer index (0-indexed) pointing to the learner's chosen entry in the question's `options` array.

#### Response (`200 OK`)
If additional questions remain:
```json
{
  "assessmentId": "d3b07384-d113-467f-bb8e-a43878b2d19f",
  "status": "IN_PROGRESS",
  "done": false,
  "question": {
    "itemId": "8c4d2e1b-9f0a-4b3c-8d5e-6f7a8b9c0d1e",
    "stem": "Which HTTP caching header allows a client to perform conditional validation with the origin server?",
    "options": [
      "ETag / If-None-Match",
      "Content-Encoding",
      "Transfer-Encoding",
      "Strict-Transport-Security"
    ]
  },
  "answered": 3,
  "max": 9,
  "progress": {
    "answered": 3,
    "max": 9
  }
}
```

If this answer triggered assessment completion:
```json
{
  "assessmentId": "d3b07384-d113-467f-bb8e-a43878b2d19f",
  "status": "COMPLETED",
  "done": true,
  "question": null,
  "answered": 6,
  "max": 9,
  "progress": {
    "answered": 6,
    "max": 9
  }
}
```

#### Error Responses
- `400 Bad Request`: `selectedOption` is negative or outside bounds (`Invalid option`).
- `409 Conflict`: The submitted `itemId` does not match the question currently expected by the adaptive engine (`That is not the current question`) or assessment is already finished.

#### Sample Fetch Call
```javascript
export async function submitAssessmentAnswer(accessToken, assessmentId, itemId, selectedOption) {
  const response = await fetch(`${API_BASE_URL}/api/v1/assessments/${assessmentId}/responses`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      itemId,
      selectedOption,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit answer');
  }

  return response.json(); // returns updated AssessmentState
}
```

---

### 4.6 Fetch Assessment Result

`GET /api/v1/assessments/{id}/result`

Returns the comprehensive diagnostic score and the mapped skill tree once the assessment is `COMPLETED`.

#### Path Variables
- `id`: UUID of the assessment.

#### Request
- **Headers:**
  - `Authorization: Bearer <accessToken>`

#### Response (`200 OK`)
```json
{
  "assessmentId": "d3b07384-d113-467f-bb8e-a43878b2d19f",
  "level": "INTERMEDIATE",
  "theta": 0.35,
  "answered": 7,
  "correct": 5,
  "skills": [
    {
      "skillId": "5a4b3c2d-1e0f-9a8b-7c6d-5e4f3a2b1c0d",
      "slug": "http-basics",
      "name": "HTTP / REST API Fundamentals",
      "cluster": "Web APIs",
      "state": "MASTERED",
      "prerequisites": ["11111111-0000-0000-0000-000000000001"]
    },
    {
      "skillId": "7c6d5e4f-3a2b-1c0d-9e8f-7a6b5c4d3e2f",
      "slug": "redis-in-memory",
      "name": "Distributed Caching with Redis",
      "cluster": "Performance",
      "state": "FRONTIER",
      "prerequisites": ["5a4b3c2d-1e0f-9a8b-7c6d-5e4f3a2b1c0d"]
    }
  ]
}
```

#### Error Responses
- `409 Conflict`: The test is still `IN_PROGRESS` (`Assessment not finished yet`).
- `404 Not Found`: Assessment does not exist or unauthorized.

---

### 4.7 Fetch Comprehensive Post-Assessment Report

`GET /api/v1/assessments/{id}/report`

Returns the full post-assessment report once `COMPLETED`. Includes:
1. `responses`: Per-question review with question stem, learner's chosen option text, correct option text, tested skill slug and name, and correctness boolean.
2. `skills`: Full skill graph state (`MASTERED`, `FRONTIER`, `LOCKED`) for every node in the track.
3. `unlockedSkills`: Every skill that is newly accessible (`MASTERED` or `FRONTIER`) as a result of this diagnostic test — the frontend uses this array to update and highlight graph nodes and unlock upcoming roadmap steps.

#### Path Variables
- `id`: UUID of the assessment.

#### Request
- **Headers:**
  - `Authorization: Bearer <accessToken>`

#### Response (`200 OK`)
```json
{
  "assessmentId": "d3b07384-d113-467f-bb8e-a43878b2d19f",
  "level": "INTERMEDIATE",
  "initialTheta": 0.0,
  "finalTheta": 0.35,
  "answered": 7,
  "correct": 5,
  "stopReason": "LEVEL_CONFIRMED",
  "responses": [
    {
      "itemStem": "Which HTTP caching header allows a client to perform conditional validation with the origin server?",
      "yourAnswer": "ETag / If-None-Match",
      "correctAnswer": "ETag / If-None-Match",
      "skillSlug": "http-basics",
      "skillName": "HTTP Basics",
      "correct": true
    },
    {
      "itemStem": "When designing an ACID-compliant database transaction, what property does the 'I' represent?",
      "yourAnswer": "Integrity",
      "correctAnswer": "Isolation",
      "skillSlug": "transactions-acid",
      "skillName": "ACID Transactions",
      "correct": false
    }
  ],
  "skills": [
    {
      "skillId": "5a4b3c2d-1e0f-9a8b-7c6d-5e4f3a2b1c0d",
      "slug": "http-basics",
      "name": "HTTP Basics",
      "cluster": "Web APIs",
      "state": "MASTERED",
      "prerequisites": []
    },
    {
      "skillId": "7c6d5e4f-3a2b-1c0d-9e8f-7a6b5c4d3e2f",
      "slug": "redis-in-memory",
      "name": "Redis In-Memory Caching",
      "cluster": "Performance",
      "state": "FRONTIER",
      "prerequisites": ["5a4b3c2d-1e0f-9a8b-7c6d-5e4f3a2b1c0d"]
    }
  ],
  "unlockedSkills": [
    {
      "skillId": "5a4b3c2d-1e0f-9a8b-7c6d-5e4f3a2b1c0d",
      "slug": "http-basics",
      "name": "HTTP Basics",
      "cluster": "Web APIs",
      "state": "MASTERED",
      "prerequisites": []
    },
    {
      "skillId": "7c6d5e4f-3a2b-1c0d-9e8f-7a6b5c4d3e2f",
      "slug": "redis-in-memory",
      "name": "Redis In-Memory Caching",
      "cluster": "Performance",
      "state": "FRONTIER",
      "prerequisites": ["5a4b3c2d-1e0f-9a8b-7c6d-5e4f3a2b1c0d"]
    }
  ]
}
```

---

## 5. Complete Frontend Service Module (`assessmentService.js`)

Below is the production-ready service module matching `web-app/src/services/assessmentService.js`:

```javascript
import { apiClient } from './api';

// Fixed UUID for Backend Engineering track matching backend seed
export const BACKEND_TRACK_ID = '00000000-0000-0000-0000-000000000001';

export const assessmentService = {
  /**
   * Fetch all active learning tracks for the onboarding dropdown.
   * Endpoint: GET /api/v1/assessments/tracks
   */
  async getTracks() {
    return apiClient('/api/v1/assessments/tracks', {
      method: 'GET',
    });
  },

  /**
   * Fetch all skills of a track for the onboarding pre-selection checklist.
   * Endpoint: GET /api/v1/assessments/tracks/{trackId}/skills
   * @param {string} trackId - UUID of the track.
   */
  async getSkillsForTrack(trackId) {
    if (!trackId) throw new Error('Track ID is required');
    return apiClient(`/api/v1/assessments/tracks/${trackId}/skills`, {
      method: 'GET',
    });
  },

  /**
   * Start a new assessment or resume existing active test with declared skills.
   * Endpoint: POST /api/v1/assessments
   * @param {string} trackId - UUID of the track.
   * @param {string[]} [knownSkillSlugs=[]] - Declared familiar skill slugs.
   */
  async startAssessment(trackId, knownSkillSlugs = []) {
    if (!trackId) throw new Error('Track ID is required');
    return apiClient('/api/v1/assessments', {
      method: 'POST',
      body: {
        trackId,
        knownSkillSlugs: Array.isArray(knownSkillSlugs) ? knownSkillSlugs : [],
      },
    });
  },

  /** Backward-compatible alias */
  async startOrResume(trackId, knownSkillSlugs = []) {
    return this.startAssessment(trackId || BACKEND_TRACK_ID, knownSkillSlugs);
  },

  /**
   * Fetch current state by assessment ID.
   * Endpoint: GET /api/v1/assessments/{id}
   */
  async getState(assessmentId) {
    if (!assessmentId) throw new Error('Assessment ID is required');
    return apiClient(`/api/v1/assessments/${assessmentId}`, {
      method: 'GET',
    });
  },

  /**
   * Submit an answer to the current question.
   * Endpoint: POST /api/v1/assessments/{id}/responses
   * @param {string} assessmentId - Assessment UUID.
   * @param {string} itemId - Question UUID.
   * @param {number} selectedOption - 0-indexed choice integer.
   */
  async submitAnswer(assessmentId, itemId, selectedOption) {
    return apiClient(`/api/v1/assessments/${assessmentId}/responses`, {
      method: 'POST',
      body: { itemId, selectedOption },
    });
  },

  /**
   * Retrieve summary score and skill results once status is COMPLETED.
   * Endpoint: GET /api/v1/assessments/{id}/result
   */
  async getResult(assessmentId) {
    return apiClient(`/api/v1/assessments/${assessmentId}/result`, {
      method: 'GET',
    });
  },

  /**
   * Retrieve full comprehensive post-assessment report once COMPLETED.
   * Endpoint: GET /api/v1/assessments/{id}/report
   */
  async getReport(assessmentId) {
    if (!assessmentId) throw new Error('Assessment ID is required');
    return apiClient(`/api/v1/assessments/${assessmentId}/report`, {
      method: 'GET',
    });
  },
};
```

---

## 6. TypeScript Type Definitions

```typescript
export type AssessmentStatus = 'IN_PROGRESS' | 'COMPLETED';
export type SkillState = 'MASTERED' | 'FRONTIER' | 'LOCKED';
export type LearnerLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface TrackSummary {
  trackId: string;
  slug: string;
  name: string;
}

export interface SkillSummary {
  skillId: string;
  slug: string;
  name: string;
  cluster: string;
  difficulty: number;
}

export interface AssessmentQuestion {
  itemId: string;
  stem: string;
  options: string[];
}

export interface AssessmentProgress {
  answered: number;
  max: number;
}

export interface AssessmentState {
  assessmentId: string;
  status: AssessmentStatus;
  done: boolean;
  question: AssessmentQuestion | null;
  answered: number;
  max: number;
  progress: AssessmentProgress;
}

export interface SkillResult {
  skillId: string;
  slug?: string;
  name: string;
  cluster: string;
  state: SkillState;
  prerequisites?: string[];
}

export interface AssessmentResultView {
  assessmentId: string;
  level: LearnerLevel;
  theta: number;
  answered: number;
  correct: number;
  skills: SkillResult[];
}

export interface ResponseDetail {
  itemStem: string;
  yourAnswer: string;
  correctAnswer: string;
  skillSlug: string;
  skillName: string;
  correct: boolean;
}

export interface AssessmentReport {
  assessmentId: string;
  level: LearnerLevel;
  initialTheta: number;
  finalTheta: number;
  answered: number;
  correct: number;
  stopReason: string;
  responses: ResponseDetail[];
  skills: SkillResult[];
  unlockedSkills: SkillResult[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface AuthTokens {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  refreshToken: string | null;
  user: {
    id: number;
    email: string;
    fullName: string;
    role: string;
  };
}
```

---

## 7. Error Handling Guide & HTTP Status Matrix

| Status Code | Meaning | Example Cause | Frontend Action |
| :--- | :--- | :--- | :--- |
| **200 OK** | Success | State fetched, answer accepted | Update UI state immediately. |
| **201 Created** | Created | Assessment started, Link intent created | Save `assessmentId`, render first question. |
| **204 No Content**| Successful Logout | Session terminated | Clear local auth state, navigate to `/`. |
| **400 Bad Request**| Malformed Payload | Missing `itemId` or invalid `selectedOption` index | Validate option selection before firing fetch. |
| **401 Unauthorized**| Token Expired/Missing | Access token expired (>15 min) | Call `/api/auth/refresh`. If refresh fails, redirect to `/login`. |
| **403 Forbidden** | Access Denied | Disallowed origin or deactivated user account | Show alert to contact support; log out. |
| **404 Not Found** | Resource Missing | Invalid `trackId` or invalid `assessmentId` | Show 404 message or redirect to track catalogue. |
| **409 Conflict** | State Conflict | Submitting out-of-order question, or fetching result before test completes | Refresh state with `getState(id)` to synchronize with server. |
| **500 Server Error**| Internal Server Error | Unhandled backend exception | Show graceful error banner with reference ID. |

---

## 8. Local Testing & Verification Checklist

1. **Verify Backend Status**:
   ```bash
   curl http://localhost:8080/actuator/health
   # Expected response: {"status":"UP"}
   ```
2. **Initiate OAuth Flow**:
   Open browser at `http://localhost:8080/oauth2/authorization/github`. Consent and verify redirection to `http://localhost:5173/auth/callback?code=...`.
3. **Verify Assessment Start**:
   Using an active access token:
   ```bash
   curl -X POST http://localhost:8080/api/v1/assessments \
     -H "Authorization: Bearer <TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"trackId":"3fa85f64-5717-4562-b3fc-2c963f66afa6"}'
   ```
4. **CORS Check**: Ensure request headers include `Origin: http://localhost:5173`. Response header must include `Access-Control-Allow-Origin: http://localhost:5173` and `Access-Control-Allow-Credentials: true`.
