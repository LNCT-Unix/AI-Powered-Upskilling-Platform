# Authentication UI Components & Pages

Welcome! This directory contains the scaffolded authentication components initialized for Team Unix.

## Architecture & File Structure

```
web-app/src/
├── components/auth/
│   ├── login.jsx          # Interactive Login UI (Email/Password, Google & GitHub OAuth)
│   ├── signup.jsx         # Interactive Signup UI (Full Name, Email, Password, Confirm Password, OAuth)
│   ├── auth.css           # Custom styles & animation extensions for auth
│   └── README.md          # This developer guide
│
├── pages/
│   ├── LoginPage.jsx      # Page wrapper at route `/login` (handles state, useAuth & redirects)
│   └── SignupPage.jsx     # Page wrapper at route `/signup` (handles registration & redirects)
│
├── context/
│   └── AuthContext.jsx    # Central authentication provider exposing `login`, `register`, `logout`, `user`
│
└── services/
    └── authService.js     # API client interacting with Spring Boot Gateway (`/api/auth/*`)
```

## How to Test Locally

1. **Mock Mode (Default):**
   In `.env` or `.env.example`:
   ```env
   VITE_USE_MOCK_AUTH=true
   ```
   In mock mode, submitting the login or signup forms will simulate successful authentication and route directly to `/dashboard`.

2. **Live Spring Boot Gateway Mode:**
   When running with Aadi and Riya's backend:
   ```env
   VITE_API_BASE_URL=http://localhost:8080
   VITE_USE_MOCK_AUTH=false
   ```
   - **Login Endpoint:** `POST /api/auth/login` (Body: `{ email, password }`)
   - **Register Endpoint:** `POST /api/auth/register` (Body: `{ fullName, email, password }`)
   - **OAuth Google:** Redirects to `http://localhost:8080/oauth2/authorization/google`
   - **OAuth GitHub:** Redirects to `http://localhost:8080/oauth2/authorization/github`
   - **Callback handler:** Handled automatically at `/auth/callback`

## Customizing Props & Logic

### `<Login />`
- `onSubmit`: Async callback `({ email, password, remember }) => Promise<void>`
- `onGoogleSignIn`: Triggers Google OAuth redirect
- `onGitHubSignIn`: Triggers GitHub OAuth redirect
- `signUpHref`: Link to registration page (default `"/signup"`)

### `<Signup />`
- `onSubmit`: Async callback `({ fullName, email, password }) => Promise<void>`
- `onGoogleSignIn`: Triggers Google OAuth redirect
- `onGitHubSignIn`: Triggers GitHub OAuth redirect
- `loginHref`: Link to login page (default `"/login"`)
