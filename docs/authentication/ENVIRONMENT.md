# Authentication Environment & Configuration Guide

This guide details all configurations, environment variables, credentials, and identity provider setups required to run and test the authentication system.

---

## 1. Environment Variables Reference

Configure these in your local environment, terminal, or IDE run configuration. Placeholders are supported with sensible defaults for local development.

| Variable Name | Required? | Default / Example Value | Description |
|---|---|---|---|
| `GOOGLE_CLIENT_ID` | Yes (for Google login) | `your-google-client-id.apps.googleusercontent.com` | Google Cloud OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | Yes (for Google login) | `GOCSPX-your-secret` | Google Cloud OAuth 2.0 Client Secret |
| `GITHUB_CLIENT_ID` | Yes (for GitHub login) | `Ov23li...` | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | Yes (for GitHub login) | `a8b9c...` | GitHub OAuth App Client Secret |
| `APP_AUTH_JWT_SECRET` | **Yes (Security-critical)** | `min-32-chars-random-string-replace-for-prod` | HMAC-SHA256 secret for signing application JWTs (must be >= 32 bytes / 256 bits) |
| `SPRING_DATASOURCE_URL` | Yes (for PostgreSQL) | `jdbc:postgresql://localhost:5432/mydatabase` | PostgreSQL connection URL |
| `SPRING_DATASOURCE_USERNAME` | Yes (for PostgreSQL) | `myuser` | Database username |
| `SPRING_DATASOURCE_PASSWORD` | Yes (for PostgreSQL) | `secret` | Database password |
| `APP_CORS_ALLOWED_ORIGINS` | Optional | `http://localhost:5173,http://localhost:3000` | Comma-separated list of allowed frontend origins |
| `APP_FRONTEND_WEB_CALLBACK_URL` | Optional | `http://localhost:5173/auth/callback` | Web frontend callback endpoint where single-use login code is delivered |
| `APP_FRONTEND_WEB_ERROR_URL` | Optional | `http://localhost:5173/auth/error` | Web frontend error redirect URL for OAuth failure codes |
| `APP_FRONTEND_MOBILE_CALLBACK_URL`| Optional | `myapp://auth/callback` | Mobile deep-link / universal link callback |
| `APP_FRONTEND_MOBILE_ERROR_URL` | Optional | `myapp://auth/error` | Mobile deep-link error callback |

---

## 2. Google OAuth 2.0 / OIDC Setup Guide

To enable Google Sign-In:

1. **Go to Google Cloud Console**: [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. **Create or select a project**:
   - Click the project dropdown at the top and click **New Project** (e.g., `ai-upskilling-platform`).
3. **Configure the OAuth Consent Screen**:
   - Navigate to **APIs & Services** > **OAuth consent screen**.
   - User Type: Select **External** (or Internal if using Google Workspace). Click **Create**.
   - App Information: Enter App name (e.g. `AI Upskilling Platform`) and User support email.
   - Developer contact information: Enter your email.
   - Click **Save and Continue**.
   - **Scopes**: Click **Add or Remove Scopes**. Select:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
   - Click **Save and Continue**.
   - **Test Users** (while in testing mode): Add the Google accounts you want to test with.
4. **Create OAuth 2.0 Credentials**:
   - Go to **APIs & Services** > **Credentials**.
   - Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
   - Application type: Select **Web application**.
   - Name: `Spring Boot Gateway Dev`.
   - **Authorized JavaScript origins**:
     - `http://localhost:8080`
     - `http://localhost:5173`
   - **Authorized redirect URIs** (Critical! Must match Spring Security's default):
     - `http://localhost:8080/login/oauth2/code/google`
   - Click **Create**.
5. **Save your credentials**:
   - Copy the **Client ID** and **Client Secret**.
   - Set them as environment variables:
     ```powershell
     $env:GOOGLE_CLIENT_ID="<your-client-id>"
     $env:GOOGLE_CLIENT_SECRET="<your-client-secret>"
     ```

---

## 3. GitHub OAuth App Setup Guide

To enable GitHub Sign-In:

1. **Go to GitHub Developer Settings**:
   - Open GitHub > Click your profile icon (top right) > **Settings**.
   - On the left sidebar, click **Developer settings** (at the bottom).
   - Click **OAuth Apps** > **New OAuth App**.
2. **Register a new OAuth Application**:
   - **Application name**: `AI Upskilling Platform Dev`
   - **Homepage URL**: `http://localhost:5173` (or `http://localhost:8080`)
   - **Authorization callback URL** (Critical! Must match Spring Security's default):
     - `http://localhost:8080/login/oauth2/code/github`
   - Click **Register application**.
3. **Generate Client Secret**:
   - On the application page, copy the **Client ID**.
   - Click **Generate a new client secret**.
   - Copy the generated **Client Secret** immediately.
4. **Set environment variables**:
   ```powershell
   $env:GITHUB_CLIENT_ID="<your-github-client-id>"
   $env:GITHUB_CLIENT_SECRET="<your-github-client-secret>"
   ```

---

## 4. JWT Secret Key Setup

The post-login token service signs JWT access tokens using HMAC-SHA256 (`HS256`).
Spring Security and the token service require a key of at least **32 bytes (256 bits)** for security.

Generate a secure random key using PowerShell:
```powershell
# In PowerShell:
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```
Or in bash:
```bash
openssl rand -base64 32
```
Set the generated key:
```powershell
$env:APP_AUTH_JWT_SECRET="<your-generated-base64-or-random-string-at-least-32-chars>"
```

---

## 5. PostgreSQL Database Setup

1. **Using Neon Cloud PostgreSQL (Default)**:
   The application is configured to connect to Neon PostgreSQL:
   ```powershell
   $env:SPRING_DATASOURCE_URL="jdbc:postgresql://ep-long-star-b53x3tu6-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require"
   $env:SPRING_DATASOURCE_USERNAME="neondb_owner"
   $env:SPRING_DATASOURCE_PASSWORD="<password>"
   ```

2. **Using a Local PostgreSQL instance**:
   Ensure a database exists:
   ```sql
   CREATE DATABASE mydatabase;
   ```
   Provide credentials via environment variables:
   ```powershell
   $env:SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/mydatabase"
   $env:SPRING_DATASOURCE_USERNAME="<your-user>"
   $env:SPRING_DATASOURCE_PASSWORD="<your-password>"
   ```

---

## 6. How to Build & Run Locally

### 1. Run all Automated Tests
In the `gateway/ai-upskilling-platform` directory:
```powershell
./mvnw.cmd test
```
All unit and MockMvc integration tests run in-memory using H2 (PostgreSQL compatibility mode) and do not require external credentials or database instances to be active.

### 2. Start the Application
With your environment variables set:
```powershell
cd gateway/ai-upskilling-platform
./mvnw.cmd spring-boot:run
```
The application will start on port `8080`.

---

## 7. Verifying the Authentication Flows

### 1. Initiate Google Login
In your browser, navigate to:
```
http://localhost:8080/oauth2/authorization/google
```
- You will be redirected to Google's consent screen.
- After consenting, Google calls `http://localhost:8080/login/oauth2/code/google`.
- The server resolves your Google identity, provisions your account if new, creates a single-use login code, and redirects to:
  `http://localhost:5173/auth/callback?code=<ONE_TIME_CODE>`

### 2. Initiate GitHub Login
In your browser, navigate to:
```
http://localhost:8080/oauth2/authorization/github
```
- You will be redirected to GitHub to authorize the app.
- GitHub redirects to `http://localhost:8080/login/oauth2/code/github`.
- The server resolves your GitHub numeric ID and primary verified email, and redirects to:
  `http://localhost:5173/auth/callback?code=<ONE_TIME_CODE>`

### 3. Exchange Code for Application Tokens
The frontend exchanges the code for the JWT access token and refresh token:
```bash
curl -X POST http://localhost:8080/api/auth/oauth2/exchange \
  -H "Content-Type: application/json" \
  -d '{"code":"<ONE_TIME_CODE>"}'
```
Response:
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
      "email": "user@example.com",
      "fullName": "Your Name",
      "role": "USER"
    }
  }
}
```
*Note: For web clients, the refresh token is stored in an `HttpOnly; Secure; SameSite=Lax` cookie named `refresh_token`.*

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

---

## 8. Email/Password Authentication Flows

### 1. Register a New Account
Submit user registration details. A generic `202 Accepted` is returned regardless of whether the email is new or already exists (preventing email enumeration):
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "riya.dev@example.com",
    "password": "MyStrongPassword123!",
    "fullName": "Riya Dev"
  }'
```
Response (`202 Accepted`):
```json
{
  "success": true,
  "message": "If the email is eligible, a verification link has been sent.",
  "data": {
    "email": "riya.dev@example.com",
    "verificationRequired": true
  }
}
```

### 2. Confirm Email Verification Token
When running locally with Mailpit/mail-catcher, open `http://localhost:8025` to find the email containing the verification link (`http://localhost:5173/verify-email#token=<RAW_TOKEN>`).
The frontend extracts `<RAW_TOKEN>` from the fragment and calls the confirmation endpoint:
```bash
curl -X POST http://localhost:8080/api/auth/email-verification/confirm \
  -H "Content-Type: application/json" \
  -d '{"token":"<RAW_TOKEN>"}'
```
Response (`200 OK`):
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "emailVerified": true
  }
}
```

### 3. Resend Verification Link
If the link expired or was missed, request a resend (subject to 60-second cooldown and max 5/hour per account, plus 20/hour per IP):
```bash
curl -X POST http://localhost:8080/api/auth/email-verification/resend \
  -H "Content-Type: application/json" \
  -d '{"email":"riya.dev@example.com"}'
```
Response (`202 Accepted`):
```json
{
  "success": true,
  "message": "If the email is eligible, a verification link has been sent.",
  "data": {
    "email": "riya.dev@example.com",
    "verificationRequired": true
  }
}
```

### 4. Password Login
Authenticate using email and password:

#### Web Client (Refresh Token in HttpOnly Cookie):
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "riya.dev@example.com",
    "password": "MyStrongPassword123!"
  }'
```
Response (`200 OK` + `Set-Cookie: refresh_token=...`):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1Ni...",
    "tokenType": "Bearer",
    "expiresInSeconds": 900,
    "refreshToken": null,
    "user": {
      "id": 1,
      "email": "riya.dev@example.com",
      "fullName": "Riya Dev",
      "role": "USER"
    }
  }
}
```

#### Mobile Client (Refresh Token in JSON Body):
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Client-Platform: mobile" \
  -d '{
    "email": "riya.dev@example.com",
    "password": "MyStrongPassword123!"
  }'
```

