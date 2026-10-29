# AI Upskilling Platform — Mobile Application

> **Status:** Planned & Architectural Contract Specified (Sprint 3 Delivery)  
> **Target Framework:** Cross-Platform Mobile Client (React Native / Flutter / Capacitor)  
> **Backend Service:** Spring Boot Gateway (`gateway/ai-upskilling-platform`)  
> **Maintainers:** Team Unix (EPAM Systems CoE Programme)  

---

## 📑 Table of Contents

1. [Overview & Strategy](#1-overview--strategy)
2. [Mobile Integration Contract](#2-mobile-integration-contract)
   - [The `X-Client-Platform` Header](#the-x-client-platform-header)
   - [Deep-Link Authentication Callbacks](#deep-link-authentication-callbacks)
3. [Token Storage & Security Guidelines](#3-token-storage--security-guidelines)
4. [Mobile Experience & Feature Roadmap](#4-mobile-experience--feature-roadmap)
5. [Local Development & Emulation Setup (Upcoming)](#5-local-development--emulation-setup-upcoming)

---

## 1. Overview & Strategy

The **Mobile Application** expands the AI-Powered Upskilling Platform to native Android and iOS devices, catering to learners who require on-the-go micro-learning, daily habit tracking, and quick diagnostic assessments.

The web client (`web-app/`) was engineered mobile-first with touch-friendly UI elements, responsive flex layouts, and safe-area inset compatibility. The mobile client will either wrap the responsive React client via **Capacitor** or deploy as a dedicated **React Native** application, sharing the identical REST API contracts of the Spring Boot Gateway.

---

## 2. Mobile Integration Contract

Because mobile applications run in native webview or native thread contexts without shared browser cookie storage, the Spring Boot Gateway implements dedicated mobile adaptations:

### The `X-Client-Platform` Header
All HTTP requests originating from the mobile client must include the header:

```http
X-Client-Platform: mobile
```

#### Gateway Behavior with `mobile` Header:
1. **Refresh Token Delivery:** Instead of writing the `refresh_token` to an `HttpOnly` cookie (which mobile webviews often drop across sandboxed origins), the backend returns the raw refresh token string directly in the JSON response payload:
   ```json
   {
     "success": true,
     "message": "Login successful",
     "data": {
       "accessToken": "eyJhbGciOiJIUzI1Ni...",
       "tokenType": "Bearer",
       "expiresInSeconds": 900,
       "refreshToken": "7a8b9c0d-1e2f-4a5b-8c9d-0e1f2a3b4c5d",
       "user": {
         "id": 1,
         "email": "learner@epam.com",
         "fullName": "Learner Name",
         "role": "USER"
       }
     }
   }
   ```
2. **Refresh Token Consumption:** When rotating tokens via `POST /api/auth/refresh`, the mobile client sends the refresh token in the JSON request body:
   ```json
   {
     "refreshToken": "7a8b9c0d-1e2f-4a5b-8c9d-0e1f2a3b4c5d"
   }
   ```

### Deep-Link Authentication Callbacks
For OAuth2 login flows (Google and GitHub):
1. The mobile app opens an in-app browser (`ASWebAuthenticationSession` on iOS or `CustomTabs` on Android) to:
   ```
   http://localhost:8080/oauth2/authorization/{provider}
   ```
2. Upon successful authentication, the Gateway inspects the client platform and redirects to the configured mobile deep link:
   - Success: `myapp://auth/callback?code=<ONE_TIME_CODE>`
   - Error: `myapp://auth/error?error=<ERROR_CODE>`
3. The native app catches the deep-link URL, extracts the single-use code, and completes the handshake via `POST /api/auth/oauth2/exchange`.

---

## 3. Token Storage & Security Guidelines

- **Access Token:** Maintained strictly in-memory (e.g., inside mobile state management like Zustand or Redux). Never persist raw access tokens to unencrypted storage.
- **Refresh Token:** Stored exclusively in hardware-backed secure storage:
  - **iOS:** iOS Keychain Services via `kSecClassGenericPassword`.
  - **Android:** Android KeyStore / `EncryptedSharedPreferences`.
- **Biometric Unlock (Planned):** Secure biometric prompt (Face ID / Fingerprint) before retrieving refresh tokens after app backgrounding.

---

## 4. Mobile Experience & Feature Roadmap

- **Phase 1: Mobile Adaptive Diagnostic:**
  - One-card-at-a-time touch-optimized question runner.
  - Haptic feedback on answer submission.
  - Instant diagnostic report rendering.
- **Phase 2: Offline Micro-Learning:**
  - Cached reading materials and offline practice flashcards.
  - Background synchronization when network connectivity restores.
- **Phase 3: Push Notifications & Daily Streaks:**
  - Scheduled study reminders aligned with learner's chosen daily time budget.
  - Milestone unlock alerts and weekly competency digests.
