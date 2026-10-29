# Authentication Environment & Configuration Guide

This guide details all configurations, environment variables, credentials, and identity provider setups required to run and test the authentication and caching systems.

---

## 1. Environment Variables Reference

Configure these in your local environment, terminal, or IDE run configuration. Placeholders are supported with sensible defaults for local development.

| Variable Name | Required? | Default / Example Value | Description |
|---|---|---|---|
| `SERVER_PORT` | Optional | `8080` | Port for the Spring Boot Gateway service |
| `SPRING_DATASOURCE_URL` | Yes (for PostgreSQL) | `jdbc:postgresql://localhost:5432/UpskillDB` | PostgreSQL connection URL |
| `SPRING_DATASOURCE_USERNAME` | Yes (for PostgreSQL) | `postgres` | Database username |
| `SPRING_DATASOURCE_PASSWORD` | Yes (for PostgreSQL) | `secret` | Database password |
| `SPRING_MAIL_HOST` | Yes (for OTP emails) | `smtp.gmail.com` | SMTP host for sending verification emails |
| `SPRING_MAIL_PORT` | Yes (for OTP emails) | `587` | SMTP port (STARTTLS enabled) |
| `SPRING_MAIL_USERNAME` | Yes (for OTP emails) | `teamunix41@gmail.com` | Google account username for SMTP dispatch |
| `SPRING_MAIL_PASSWORD` | Yes (for OTP emails) | `your-16-char-app-password` | Google 16-character App Password |
| `APP_MAIL_FROM` | Optional | `teamunix41@gmail.com` | Sender address appearing on verification emails |
| `GOOGLE_CLIENT_ID` | Yes (for Google login) | `444317958866-...apps.googleusercontent.com` | Google Cloud OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | Yes (for Google login) | `GOCSPX-...` | Google Cloud OAuth 2.0 Client Secret |
| `GITHUB_CLIENT_ID` | Yes (for GitHub login) | `Ov23li1uXQnIYi33lg5c` | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | Yes (for GitHub login) | `your-github-secret` | GitHub OAuth App Client Secret |
| `APP_AUTH_JWT_SECRET` | **Yes (Security-critical)** | `min-32-chars-random-string-replace-for-prod` | HMAC-SHA256 secret for signing application JWTs (must be >= 32 bytes / 256 bits) |
| `APP_CORS_ALLOWED_ORIGINS` | Optional | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated list of allowed frontend origins |
| `APP_FRONTEND_WEB_CALLBACK_URL` | Optional | `http://localhost:5173/auth/callback` | Web frontend callback endpoint where single-use login code is delivered |
| `APP_FRONTEND_WEB_ERROR_URL` | Optional | `http://localhost:5173/auth/error` | Web frontend error redirect URL for OAuth failure codes |
| `APP_FRONTEND_MOBILE_CALLBACK_URL`| Optional | `myapp://auth/callback` | Mobile deep-link / universal link callback |
| `APP_FRONTEND_MOBILE_ERROR_URL` | Optional | `myapp://auth/error` | Mobile deep-link error callback |

---

## 2. Google OAuth 2.0 / OIDC Setup Guide

To enable Google Sign-In:

1. **Go to Google Cloud Console**: [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. **Create or select a project**:
   - Select or create project `ai-upskilling-platform`.
3. **Configure the OAuth Consent Screen**:
   - Navigate to **APIs & Services** > **OAuth consent screen**.
   - User Type: Select **External** (or Internal if using Google Workspace). Click **Create**.
   - Scopes:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
4. **Create OAuth 2.0 Credentials**:
   - Go to **APIs & Services** > **Credentials**.
   - Application type: **Web application**.
   - **Authorized JavaScript origins**:
     - `http://localhost:8080`
     - `http://localhost:5173`
   - **Authorized redirect URIs**:
     - `http://localhost:8080/login/oauth2/code/google`
5. **Save credentials**:
   - Copy Client ID and Secret to environment variables:
     ```powershell
     $env:GOOGLE_CLIENT_ID="<your-client-id>"
     $env:GOOGLE_CLIENT_SECRET="<your-client-secret>"
     ```

---

## 3. GitHub OAuth App Setup Guide

To enable GitHub Sign-In:

1. **Go to GitHub Developer Settings**:
   - Open GitHub > **Settings** > **Developer settings** > **OAuth Apps**.
2. **Register a new OAuth Application**:
   - **Application name**: `AI Upskilling Platform Dev`
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**:
     - `http://localhost:8080/login/oauth2/code/github`
3. **Generate Client Secret**:
   - Copy the **Client ID** (`Ov23li1uXQnIYi33lg5c`) and click **Generate a new client secret**.
4. **Set environment variables**:
   ```powershell
   $env:GITHUB_CLIENT_ID="<your-github-client-id>"
   $env:GITHUB_CLIENT_SECRET="<your-github-client-secret>"
   ```

---

## 4. Gmail SMTP Email & OTP Setup Guide

The application sends 6-digit verification passcodes and password reset OTPs via Google's secure SMTP server.

1. **Enable 2-Step Verification** on your Google Account:
   - Go to [Google Account Security](https://myaccount.google.com/security).
2. **Generate an App Password**:
   - Search for **App passwords** under Security.
   - App name: `AI Upskilling Gateway`.
   - Copy the generated 16-character code (e.g. `krri uwsd iidq ndja`).
3. **Configure in Gateway**:
   ```properties
   spring.mail.host=smtp.gmail.com
   spring.mail.port=587
   spring.mail.username=teamunix41@gmail.com
   spring.mail.password=krri uwsd iidq ndja
   spring.mail.properties.mail.smtp.auth=true
   spring.mail.properties.mail.smtp.starttls.enable=true
   app.mail.from=teamunix41@gmail.com
   ```

---

## 5. JWT Secret Key Setup

The post-login token service signs JWT access tokens using HMAC-SHA256 (`HS256`).
Spring Security requires a key of at least **32 bytes (256 bits)**.

Generate a secure key in PowerShell:
```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

Set as an environment variable:
```powershell
$env:APP_AUTH_JWT_SECRET="<base64-or-raw-32-char-string>"
```

---

## 6. Testing Endpoints via cURL

### 1. Register with Email/Password & Dispatch OTP
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Alex Mercer",
    "email": "alex.mercer@example.com",
    "password": "Password123!"
  }'
```
*Response (`202 Accepted`):* Dispatches 6-digit OTP code to the email.

### 2. Confirm Email OTP & Receive Credentials
```bash
curl -X POST http://localhost:8080/api/auth/email-verification/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alex.mercer@example.com",
    "otp": "491823"
  }'
```
*Response (`200 OK`):* Marks email verified and returns JWT `accessToken` in body with `refresh_token` in cookie.

### 3. Password Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alex.mercer@example.com",
    "password": "Password123!"
  }'
```

### 4. Who Am I (`/api/auth/me`)
```bash
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
```

### 5. Refresh Access Token
```bash
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Origin: http://localhost:5173" \
  --cookie "refresh_token=<REFRESH_TOKEN>"
```

### 6. Logout
```bash
curl -X POST http://localhost:8080/api/auth/logout \
  -H "Origin: http://localhost:5173" \
  --cookie "refresh_token=<REFRESH_TOKEN>"
```
