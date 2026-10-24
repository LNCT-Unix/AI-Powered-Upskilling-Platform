# Authentication Team Contract — Riya and Aadi

| | |
|---|---|
| **File** | `docs/authentication/AUTHENTICATION_TEAM_CONTRACT.md` |
| **Repository** | <https://github.com/LNCT-Unix/AI-Powered-Upskilling-Platform> |
| **Backend** | `gateway/ai-upskilling-platform/` (base package `com.unix.ai_upskilling_platform`) |
| **Status** | **v1.0 (Implemented & Verified)** |
| **Audience** | Riya (email auth), Aadi (OAuth2 + integration) |

---

## 1. Scope & Ownership Summary

- **Riya**: Registration, password validation/hashing, email verification tokens and delivery, password login.
- **Aadi**: Google OIDC and GitHub OAuth2 authentication, provider identity extraction (`OAuthIdentity`), safe account linking (`OAuthAccountLinkingService`), unified `SecurityConfig`, application-issued credential management (`AuthTokenService`, JWT access tokens + rotating opaque refresh tokens), OAuth one-time code exchange, `/api/auth/me`, shared exception and error contract, and foundational integration tests.

---

## 2. API Contract & Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/oauth2/authorization/{google\|github}` | GET | Public | Spring Security OAuth2 authorization redirect |
| `/login/oauth2/code/{google\|github}` | GET | Public | Spring Security OAuth2 callback processing |
| `/api/auth/oauth2/exchange` | POST | Public | Exchanges single-use one-time code for application credentials |
| `/api/auth/refresh` | POST | Public (Token/Cookie) | Rotates refresh token (cookie or mobile body) and returns new credentials |
| `/api/auth/logout` | POST | Public (Token/Cookie) | Revokes active refresh token family and clears web cookie |
| `/api/auth/me` | GET | Bearer Token | Returns current authenticated user profile (`UserResponse`) |
| `/api/auth/oauth-links/{provider}/intent` | POST | Bearer Token | Creates short-lived single-use intent to link an OAuth provider to current account |

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
