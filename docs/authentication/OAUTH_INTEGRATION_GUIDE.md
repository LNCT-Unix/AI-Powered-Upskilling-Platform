# Complete OAuth 2.0 & OIDC Integration Guide

**Document Version:** 2.0  
**Target Audience:** Frontend Team, Backend Team, DevOps, and Project Contributors  
**Scope:** Full-stack OAuth 2.0 integration across Spring Boot Gateway (`port 8080`) and React Frontend (`port 5173`)  
**Associated Repositories / Modules:**
- Backend: `gateway/ai-upskilling-platform/` (Spring Boot 4.x / Java 25)
- Frontend: `web-app/` (React 19 / Vite / TailwindCSS)

---

## 1. System Architecture & End-to-End Handshake Flow

The platform uses a **BFF (Backend-For-Frontend) Dual-Token Architecture**:
- The browser **never** exchanges credentials directly with Google or GitHub.
- The **Spring Boot Gateway** coordinates the OAuth2 protocol dance, manages state/PKCE verification, queries provider APIs, provisions or links internal `User` accounts, and mints application-level credentials.
- The frontend acts as a **pure consumer and callback handler**, holding the short-lived `accessToken` strictly in-memory and allowing the browser to manage the long-lived `refresh_token` via a secure, `HttpOnly; SameSite=Lax` cookie.

```mermaid
sequenceDiagram
    autonumber
    actor Learner
    participant Web as Web Frontend (Port 5173)
    participant GW as Spring Boot Gateway (Port 8080)
    participant Provider as Google / GitHub OAuth2
    participant DB as PostgreSQL Database

    Learner->>Web: Clicks "Sign in with Google" or "GitHub"
    Web->>GW: Navigates window to /oauth2/authorization/{provider}
    Note over GW: Generates OAuth state & PKCE code verifier
    GW->>Provider: 302 Redirect to Provider Consent Screen
    Learner->>Provider: Authenticates and grants scopes
    Provider->>GW: 302 Callback /login/oauth2/code/{provider}?code=...&state=...
    Note over GW: Resolves identity (Google OIDC / GitHub verified email API)
    GW->>DB: Resolves / provisions User and records OAuthAccount
    GW->>DB: Stores single-use login code (60-second TTL, hashed)
    GW->>Web: 302 Redirect to http://localhost:5173/auth/callback?code=<ONE_TIME_CODE>
    Note over Web: AuthCallbackPage extracts ?code parameter
    Web->>GW: POST /api/auth/oauth2/exchange {"code": "<ONE_TIME_CODE>"}
    Note over GW: Validates & consumes code; issues JWT & sets HttpOnly cookie
    GW-->>Web: 200 OK { success: true, data: { accessToken, user } } + Set-Cookie: refresh_token=...
    Web->>Web: AuthContext updates state (in-memory access token)
    Web->>Learner: Navigates to /dashboard
```

---

## 2. GitHub 404 Root Cause & Resolution

### Why GitHub Was Returning 404
When initiating GitHub OAuth, Spring Boot redirects the browser to:
```
https://github.com/login/oauth/authorize?response_type=code&client_id=<CLIENT_ID>&redirect_uri=http://localhost:8080/login/oauth2/code/github...
```
If `spring.security.oauth2.client.registration.github.client-id` is left as the unconfigured placeholder (`github-client-id-placeholder`), GitHub checks its database for an application with that ID. Because no application exists with that identifier, GitHub serves its generic **404 Not Found** page.

### How It Was Fixed
1. Configured the registered application's Client ID `Ov23li1uXQnIYi33lg5c` in `gateway/ai-upskilling-platform/src/main/resources/application.properties`:
   ```properties
   spring.security.oauth2.client.registration.github.client-id=${GITHUB_CLIENT_ID:Ov23li1uXQnIYi33lg5c}
   spring.security.oauth2.client.registration.github.client-secret=${GITHUB_CLIENT_SECRET:github-client-secret-placeholder}
   ```
2. With this Client ID in place, `http://localhost:8080/oauth2/authorization/github` redirects cleanly to GitHub's authorization consent screen without 404s.

### Making Token Exchange Fully Runnable
To complete the token exchange when GitHub redirects back to the gateway callback, Spring Security requires the **GitHub Client Secret**:
- **Option A (Environment Variable - Recommended):**
  ```powershell
  $env:GITHUB_CLIENT_SECRET="your-generated-github-client-secret"
  ```
- **Option B (`application.properties` for local development):**
  Update `spring.security.oauth2.client.registration.github.client-secret=your-generated-github-client-secret`.

---

## 3. Provider Setup & Console Configuration

Both identity providers require specific redirect URIs matching Spring Security's convention: `{baseUrl}/login/oauth2/code/{registrationId}`.

### 3.1 Google Cloud Console Setup
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **APIs & Services > Credentials**.
3. Create an **OAuth 2.0 Client ID** with Application type **Web application**.
4. Configure URLs:
   - **Authorized JavaScript origins**:
     - `http://localhost:8080`
     - `http://localhost:5173`
   - **Authorized redirect URIs**:
     - `http://localhost:8080/login/oauth2/code/google`
5. Note the generated **Client ID** and **Client Secret**.
6. Default scopes requested: `openid`, `profile`, `email`.

### 3.2 GitHub Developer Settings Setup
1. Go to [GitHub Developer Settings > OAuth Apps](https://github.com/settings/developers).
2. Click **New OAuth App** (or edit existing app `Ov23li1uXQnIYi33lg5c`).
3. Fill in the fields:
   - **Application name:** `AI Upskilling Platform Dev`
   - **Homepage URL:** `http://localhost:5173`
   - **Authorization callback URL:** `http://localhost:8080/login/oauth2/code/github`
4. Click **Register application** (or **Generate a new client secret**).
5. Copy the secret immediately.
6. Scopes requested by the gateway: `read:user`, `user:email`.

---

## 4. Environment Variables & Properties Reference

Place these in your environment, terminal, or local `application.properties`:

| Variable Name | Required? | Default / Configured Value | Description |
|---|---|---|---|
| `GOOGLE_CLIENT_ID` | Yes (for Google) | `444317958866-98vgjrv0s5ve1hq0qbpnkng5ccvci7bn.apps.googleusercontent.com` | Google Cloud OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Yes (for Google) | Configured in `application.properties` | Google Cloud OAuth Client Secret |
| `GITHUB_CLIENT_ID` | Yes (for GitHub) | `Ov23li1uXQnIYi33lg5c` | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | Yes (for GitHub) | Provide via env or properties | GitHub OAuth App Client Secret |
| `APP_AUTH_JWT_SECRET` | Critical | 32+ char secret | HMAC-SHA256 signing secret for application JWTs |
| `APP_FRONTEND_WEB_CALLBACK_URL` | Optional | `http://localhost:5173/auth/callback` | Web URL for single-use login code redirect |
| `APP_FRONTEND_WEB_ERROR_URL` | Optional | `http://localhost:5173/auth/error` | Web URL for authentication failure redirect |
| `APP_CORS_ALLOWED_ORIGINS` | Optional | `http://localhost:5173,http://127.0.0.1:5173` | Allowed frontend origins |
| `SPRING_DATASOURCE_URL` | Optional | `jdbc:postgresql://localhost:5432/mydatabase` | PostgreSQL connection string |

---

## 5. Frontend Integration Guide (`web-app`)

### 5.1 Triggering OAuth Login
From any login or signup component, trigger OAuth by redirecting the browser window:

```javascript
// web-app/src/services/authService.js
const API_BASE_URL = 'http://localhost:8080';

export const authService = {
  loginWithGoogle() {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  },
  loginWithGitHub() {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/github`;
  }
};
```

### 5.2 Callback Route: `/auth/callback` (`AuthCallbackPage.jsx`)
When authentication succeeds, Spring Boot redirects the browser to:
`http://localhost:5173/auth/callback?code=<ONE_TIME_CODE>`

#### Key Responsibilities of `AuthCallbackPage`:
1. **Prevent React 19 StrictMode double-exchange:**
   React 19 mounts and unmounts components twice in dev mode. Because OAuth login codes are **single-use** (consumed immediately upon the first exchange), a duplicate request will fail with `INVALID_LOGIN_CODE`. Use a `useRef` flag:
   ```javascript
   const exchangeAttempted = useRef(false);
   
   useEffect(() => {
     if (exchangeAttempted.current) return;
     exchangeAttempted.current = true;
     // Trigger exchangeLoginCode(code)...
   }, []);
   ```
2. **Exchange Code:**
   Call `POST http://localhost:8080/api/auth/oauth2/exchange` with `credentials: 'include'`:
   ```javascript
   const response = await fetch('http://localhost:8080/api/auth/oauth2/exchange', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     credentials: 'include',
     body: JSON.stringify({ code })
   });
   ```
3. **Hydrate Session & Navigate:**
   Store `accessToken` in memory via `AuthContext`, update user profile state, and redirect to `/dashboard`.

### 5.3 Error Route: `/auth/error` (`AuthErrorPage.jsx`)
When an error occurs during OAuth, Spring Boot redirects to:
`http://localhost:5173/auth/error?error=<ERROR_CODE>`

#### Standard Gateway Error Codes Matrix:
| Error Code | Meaning | User Guidance |
|---|---|---|
| `OAUTH_ACCESS_DENIED` | Learner clicked "Cancel" on consent screen | "Sign-in was cancelled. Click below to try again." |
| `OAUTH_EMAIL_REQUIRED` | Provider did not return a verified email | "Your provider account does not have a verified email. Please verify your email with the provider and retry." |
| `OAUTH_EMAIL_UNVERIFIED` | Email returned by provider is unverified | "Your provider email is not verified. Please verify it before signing in." |
| `OAUTH_ACCOUNT_EXISTS` | An account already exists with password | "An account with this email already exists. Sign in with your password to link your provider." |
| `OAUTH_ALREADY_LINKED` | Provider identity is already linked to another user | "This external account is already associated with another profile." |
| `OAUTH_ACCOUNT_DISABLED` | Account has been deactivated | "Your account is disabled. Please contact support." |
| `OAUTH_PROVIDER_ERROR` | Upstream provider network or secret error | "Unable to authenticate with provider. Please try again later." |
| `INVALID_LOGIN_CODE` | Code was reused, expired (>60s), or invalid | "Authentication session expired. Please sign in again." |

### 5.4 Session Lifecycle (Refresh, Me, Logout)

#### Profile Recovery on Page Reload (`/api/auth/me`):
On initial app load or page refresh, if memory state is empty, call:
```http
GET /api/auth/me
Authorization: Bearer <accessToken>
```
If 401 Unauthorized, automatically attempt silent refresh.

#### Silent Refresh (`/api/auth/refresh`):
```http
POST /api/auth/refresh
credentials: include
```
The browser sends the `refresh_token` cookie. The gateway rotates the refresh token (replay attack prevention) and returns a fresh 15-minute `accessToken`.

#### Logout (`/api/auth/logout`):
```http
POST /api/auth/logout
credentials: include
```
Revokes the refresh token in the database and clears the `refresh_token` cookie in the browser.

---

## 6. Backend Security & Identity Linking Architecture

### 6.1 Strict Identity Mapping (`OAuthAccount`)
- Users are never identified by login name (which can change on GitHub).
- The gateway uses:
  - Google: `sub` claim from validated OIDC ID token.
  - GitHub: numeric `id` attribute.
- Account records are stored in `oauth_accounts` with a composite unique constraint on `(provider, provider_subject)`.

### 6.2 Verified Email Resolution (`GitHubEmailResolver`)
GitHub allows users to keep their email address private. In that case, the default `/user` endpoint does not return an email. `GitHubEmailResolver` uses the issued GitHub access token to query `https://api.github.com/user/emails` and filters for the email where `primary == true && verified == true`. If no verified email exists, registration is halted (`OAUTH_EMAIL_REQUIRED`).

### 6.3 Account Linking & Hijack Protection
To prevent identity hijacking:
1. **Existing Mapping:** If `(provider, providerSubject)` is already registered, the user is authenticated immediately.
2. **New Email:** A new `User` is provisioned and linked to the provider.
3. **Email Collision with Existing Verified Account:** If an existing verified account has the same email but has **never** been linked to this provider, automatic linking is **denied** (`OAUTH_ACCOUNT_EXISTS`). The user must sign in with their existing credentials first and explicitly link the provider from their account settings.
4. **Reclaiming Unverified Password Accounts:** If an unverified account exists from a password registration attempt, authenticating via a verified OAuth provider reclaims the account, marks `email_verified = true`, clears the stale password hash, revokes existing refresh tokens, and attaches the OAuth provider.

---

## 7. Verification & Runbook

### 7.1 Running All Automated Tests
From `gateway/ai-upskilling-platform/`:
```powershell
./mvnw.cmd test
```
*Expected Result:* All 37 integration and unit tests pass with zero failures.

### 7.2 Building the Frontend
From `web-app/`:
```powershell
npm run build
```
*Expected Result:* Vite builds `dist/` cleanly with 0 errors.

### 7.3 Manual E2E Testing Checklist
1. **Google Login:**
   - Go to `http://localhost:5173/login`.
   - Click **Google**.
   - Select account on Google consent screen.
   - Redirects to `/auth/callback?code=...` -> Handshake verified -> Redirects to `/dashboard`.
2. **GitHub Login:**
   - Click **GitHub**.
   - Verify redirect to GitHub authorization dialog (no 404).
   - Authorize app -> Redirects to `/auth/callback?code=...` -> Redirects to `/dashboard`.
3. **Session Refresh:**
   - Reload the `/dashboard` page.
   - Profile persists and does not redirect back to `/login`.
4. **Logout:**
   - Click **Logout**.
   - Browser clears session; refresh cookie is invalidated.
