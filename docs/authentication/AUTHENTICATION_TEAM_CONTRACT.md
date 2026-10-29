# Authentication Team Contract — Riya and Aadi

| | |
|---|---|
| **File** | `docs/authentication/AUTHENTICATION_TEAM_CONTRACT.md` |
| **Repository** | <https://github.com/LNCT-Unix/AI-Powered-Upskilling-Platform> |
| **Backend** | `gateway/ai-upskilling-platform/` (base package `com.unix.aiupskilling`) |
| **Status** | **v1.1 (Fully Implemented & Verified)** |
| **Audience** | Riya (email auth & OTP), Aadi (OAuth2 + token management) |

---

## 1. Scope & Ownership Summary

- **Riya**:
  - Email/password user registration (`POST /api/auth/register`).
  - 6-digit email verification OTP generation, persistence, and delivery via Gmail SMTP (`POST /api/auth/email-verification/confirm` and `/resend`).
  - Password authentication (`POST /api/auth/login`) with BCrypt password hashing.
  - Password reset lifecycle: forgot password OTP request (`POST /api/auth/forgot-password`), OTP verification (`POST /api/auth/verify-reset-otp`), and secure password reset (`POST /api/auth/reset-password`).
- **Aadi**:
  - Google OIDC and GitHub OAuth2 authentication protocol handshakes (`/oauth2/authorization/*`, `/login/oauth2/code/*`).
  - Provider identity extraction (`OAuthIdentity`, GitHub primary verified email fallback via `GitHubEmailResolver`).
  - Safe account linking and hijack protection (`OAuthAccountLinkingService`).
  - Unified stateless `SecurityConfig` with CORS origin verification.
  - Application-issued credential management (`AuthTokenService`): 15-minute HMAC-SHA256 JWT access tokens + 30-day rotating opaque refresh tokens stored in PostgreSQL.
  - OAuth single-use one-time code exchange (`POST /api/auth/oauth2/exchange`).
  - Profile hydration (`GET /api/auth/me`), token rotation (`POST /api/auth/refresh`), and logout revocation (`POST /api/auth/logout`).
  - Cross-platform support (`X-Client-Platform: mobile`) for delivering refresh tokens in body payload to mobile apps.

---

## 2. API Contract & Endpoints

| Endpoint | Method | Auth | Owner | Description |
|---|---|---|---|---|
| `/oauth2/authorization/{google\|github}` | GET | Public | Aadi | Spring Security OAuth2 authorization redirect |
| `/login/oauth2/code/{google\|github}` | GET | Public | Aadi | Spring Security OAuth2 callback processing |
| `/api/auth/oauth2/exchange` | POST | Public | Aadi | Exchanges single-use one-time code for application credentials |
| `/api/auth/register` | POST | Public | Riya | Registers user; sends 6-digit verification code to email |
| `/api/auth/email-verification/confirm` | POST | Public | Riya | Confirms 6-digit email OTP (alias `/verify-otp`) & logs user in |
| `/api/auth/email-verification/resend` | POST | Public | Riya | Resends 6-digit email verification OTP |
| `/api/auth/login` | POST | Public | Riya | Authenticates user with email and password |
| `/api/auth/forgot-password` | POST | Public | Riya | Sends 6-digit password reset OTP to email |
| `/api/auth/verify-reset-otp` | POST | Public | Riya | Validates reset OTP; returns reset token |
| `/api/auth/reset-password` | POST | Public | Riya | Updates password using validated reset token |
| `/api/auth/refresh` | POST | Public (Cookie/Body) | Aadi | Rotates refresh token and returns new credentials |
| `/api/auth/logout` | POST | Public (Cookie/Body) | Aadi | Revokes active refresh token family and clears web cookie |
| `/api/auth/me` | GET | Bearer Token | Aadi | Returns current authenticated user profile (`UserResponse`) |
| `/api/auth/oauth-links/{provider}/intent` | POST | Bearer Token | Aadi | Creates short-lived single-use intent to link an OAuth provider |

---

## 3. Account Linking Decision Matrix (Section 4.4)

1. **Existing Provider Mapping**: If `(provider, provider_subject)` already exists in `oauth_accounts`, log in as that user and update `lastLoginAt`.
2. **Missing Provider Email**: If provider returns no email (e.g. private GitHub email without primary verified email), reject with `OAUTH_EMAIL_REQUIRED`.
3. **Unverified Provider Email**: If provider email is unverified, reject with `OAUTH_EMAIL_UNVERIFIED`.
4. **New User**: If verified email and no existing internal user, provision new `User` (`Role.USER`, `emailVerified=true`, no password) and insert `OAuthAccount`.
5. **Existing Verified User**: If an account with that email already exists and is verified, **do not auto-link by email**; reject with `OAUTH_ACCOUNT_EXISTS`. User must log in and link explicitly.
6. **Existing Unverified Password Account (D-5 Reclaim)**: Reclaim account by clearing password hash, setting `emailVerified=true`, and creating `OAuthAccount` mapping.
7. **Explicit Linking**: Authenticated user requests link intent, re-authenticates if password account, and callback links `OAuthAccount` to that user.
8. **Already Linked Elsewhere**: If external identity is already linked to another user, reject with `OAUTH_ALREADY_LINKED`.
9. **Disabled User**: Reject with `OAUTH_ACCOUNT_DISABLED`.

---

## 4. Mobile Client Protocol Adaptation

- When `X-Client-Platform: mobile` is passed in the request headers:
  - The gateway suppresses the `Set-Cookie: refresh_token=...` response header.
  - The refresh token is provided directly in `data.refreshToken` in the JSON response payload.
  - Mobile clients store the access token in-memory and the refresh token in OS-level hardware-backed secure storage (iOS Keychain / Android EncryptedSharedPreferences).
