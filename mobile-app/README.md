# AI Upskilling Platform — Mobile Application (octoByte)

> **Status:** Implemented & Scaffolded with Capacitor 7 Native Android Bridge  
> **Target Framework:** Capacitor Cross-Platform Native Runtime (Android & iOS)  
> **Backend Service:** Spring Boot Gateway (`gateway/ai-upskilling-platform`)  
> **App Name:** octoByte  
> **Package / App ID:** `com.unix.aiupskilling`  
> **Custom Scheme:** `octobyte://`  
> **Maintainers:** Team Unix (EPAM Systems CoE Programme)  

---

## 📑 Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [Mobile Integration Contract Implementation](#2-mobile-integration-contract-implementation)
   - [The `X-Client-Platform: mobile` Header](#the-x-client-platform-mobile-header)
   - [Secure Hardware Token Storage](#secure-hardware-token-storage)
   - [Deep-Link OAuth2 Handshake (`octobyte://auth/callback`)](#deep-link-oauth2-handshake-octobyteauthcallback)
3. [Native Mobile Plugins & UX Enhancements](#3-native-mobile-plugins--ux-enhancements)
   - [Tactile Haptics Engine](#tactile-haptics-engine)
   - [Status Bar & Splash Screen](#status-bar--splash-screen)
   - [Android Hardware Back-Button](#android-hardware-back-button)
4. [Developer Workflow: Build, Emulation & Running](#4-developer-workflow-build-emulation--running)
   - [Prerequisites](#prerequisites)
   - [One-Command Web Build & Mobile Sync](#one-command-web-build--mobile-sync)
   - [Opening in Android Studio](#opening-in-android-studio)
   - [Running on Android Emulator / Physical Device](#running-on-android-emulator--physical-device)
   - [Connecting to Local Spring Boot Backend](#connecting-to-local-spring-boot-backend)
5. [Release & Packaging](#5-release--packaging)

---

## 1. Overview & Architecture

The **octoByte Mobile Application** packages the responsive React 19 + Tailwind CSS single-page application into high-performance native Android (and iOS) containers using **Capacitor 7**.

### Key Architectural Benefits:
- **Zero UI Duplication:** Fully shares the 15+ views, the 56-skill interactive SVG Directed Acyclic Graph (`InteractiveSkillGraph.jsx`), the 1-PL Rasch Computerized Adaptive Testing (CAT) runner, mascot animations, and multi-language i18n.
- **Hardware-Backed Security:** Refresh tokens are never stored in unencrypted browser storage (`localStorage` / `sessionStorage`). Instead, they are persisted directly in native hardware-backed storage (`@capacitor/preferences` on Android KeyStore / iOS Keychain).
- **Native Hardware Access:** Seamless access to device vibration / haptics, status bar styling, splash screens, network status detection, and deep links.

---

## 2. Mobile Integration Contract Implementation

### The `X-Client-Platform: mobile` Header
All HTTP requests made via `web-app/src/services/api.js` detect native mobile execution via `Capacitor.isNativePlatform()` and inject:

```http
X-Client-Platform: mobile
```

### Secure Hardware Token Storage
- **Access Tokens:** Retained exclusively in volatile memory (`setAccessToken` in `api.js`).
- **Refresh Tokens:** Retrieved from and persisted to native storage via `web-app/src/services/mobileStorage.js` using `@capacitor/preferences`.
- **Silent Refresh:** On `401 Unauthorized`, `apiClient` reads the refresh token from native storage, issues `POST /api/auth/refresh` with `{ "refreshToken": "<token>" }` in the JSON body, and updates the stored refresh token when the server rotates it.

### Deep-Link OAuth2 Handshake (`octobyte://auth/callback`)
For Google and GitHub OAuth:
1. `authService.loginWithGoogle()` and `authService.loginWithGitHub()` trigger `openOAuthProvider()` in `mobileAuth.js`, launching the OAuth URL in an in-app browser (`@capacitor/browser`).
2. Upon successful authentication, the Spring Boot Gateway redirects to `octobyte://auth/callback?code=<ONE_TIME_CODE>`.
3. `@capacitor/app` captures the deep link, closes the in-app browser, and navigates React Router to `/auth/callback?code=...` where `AuthCallbackPage.jsx` completes the exchange via `POST /api/auth/oauth2/exchange`.

---

## 3. Native Mobile Plugins & UX Enhancements

| Feature | Plugin | Implementation |
| :--- | :--- | :--- |
| **Tactile Haptics** | `@capacitor/haptics` | Selection ticks on question choices, medium impact on answer submission, and success vibration on assessment completion (`hapticsService.js`). |
| **Status Bar** | `@capacitor/status-bar` | Warm Deep Craft theme `#F7F3E8` with dark typography icons (`App.jsx`). |
| **Hardware Back Button** | `@capacitor/app` | Graceful back navigation with React Router; prompts or exits cleanly when on root `/` or `/dashboard`. |
| **Network Status** | `@capacitor/network` | Detection of offline status to avoid broken API calls and surface offline banners. |
| **In-App Browser** | `@capacitor/browser` | Clean modal OAuth login sessions without leaving the app sandbox. |

---

## 4. Developer Workflow: Build, Emulation & Running

### Prerequisites
- **Node.js:** v20+ (tested on Node v24)
- **Java:** JDK 17+ or Android Studio JBR
- **Android SDK:** Installed (default location: `%LOCALAPPDATA%\Android\Sdk`)
- **Android Studio:** Recommended for emulator management and APK profiling

### One-Command Web Build & Mobile Sync
From the project root:

```powershell
cd mobile-app
npm run build:mobile
```
*This command executes `vite build` in `web-app/` and immediately syncs the production bundle and Capacitor plugins into `mobile-app/android/app/src/main/assets/public`.*

### Opening in Android Studio
To launch the native Android project in Android Studio:

```powershell
cd mobile-app
npm run open:android
```
*(Or manually open the `mobile-app/android` directory in Android Studio).*

### Running on Android Emulator / Physical Device
```powershell
cd mobile-app
npx cap run android
```

### Connecting to Local Spring Boot Backend
When testing against a local Spring Boot Gateway (`gateway/ai-upskilling-platform` on port 8080):

1. **Android Emulator:**
   - Android emulators access the host machine via `http://10.0.2.2:8080`.
   - `web-app/src/services/api.js` automatically defaults to `http://10.0.2.2:8080` when running inside Capacitor.
2. **Physical Device over USB:**
   - Run: `adb reverse tcp:8080 tcp:8080`
   - The device can now reach `http://localhost:8080`.
3. **Physical Device over Wi-Fi / LAN:**
   - Specify `VITE_MOBILE_API_BASE_URL` in `web-app/.env`:
     ```env
     VITE_MOBILE_API_BASE_URL=http://192.168.1.X:8080
     ```
   - Re-run `npm run build:mobile`.

---

## 5. Release & Packaging

To generate an unsigned release APK or Android App Bundle (AAB):

```powershell
cd mobile-app\android
.\gradlew.bat assembleRelease
```
The generated APK will be located at:
`mobile-app/android/app/build/outputs/apk/release/app-release-unsigned.apk`
