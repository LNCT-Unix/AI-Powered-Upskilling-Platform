# Authentication UI Components & Pages

This directory houses the reusable authentication UI forms for the web application, styled with Tailwind CSS v4 and designed to plug directly into [`AuthContext.jsx`](../../context/AuthContext.jsx).

---

## 1. Directory Structure

```
web-app/src/
├── components/auth/
│   ├── login.jsx          # Interactive Login form (Email/Password, Google & GitHub OAuth triggers)
│   ├── signup.jsx         # Interactive Signup form (Full Name, Email, Password, Validation, OAuth)
│   ├── forgotPass.jsx     # Interactive Password Reset form (Email input, OTP verification, new password)
│   ├── AuthView.jsx       # Unified interactive auth modal/view (Sign-in, Register, OTP confirmation)
│   ├── AuthPage.css       # Dedicated responsive auth styling and animations
│   ├── ProtectedRoute.jsx # Route guard verifying authentication before granting dashboard access
│   └── README.md          # This component specification
│
├── pages/
│   ├── LoginPage.jsx      # Page view at `/login` (handles state, useAuth & redirection)
│   ├── SignupPage.jsx     # Page view at `/signup` (handles registration & redirection)
│   ├── VerifyEmailPage.jsx# Page view at `/verify-email` (handles 6-digit OTP verification & resend)
│   ├── AuthCallbackPage.jsx # Page view at `/auth/callback` (exchanges OAuth2 login code for JWT)
│   └── AuthErrorPage.jsx  # Page view at `/auth/error` (displays OAuth failure guidance)
│
├── context/
│   └── AuthContext.jsx    # Central authentication provider (login, register, OTP confirm, logout, session)
│
└── services/
    └── authService.js     # Client communicating with Spring Boot Gateway (`/api/auth/*`)
```

---

## 2. Component API & Props

### `<Login />` (`login.jsx`)
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `onSubmit` | `Function: ({ email, password, remember }) => Promise<void>` | Required | Async submission callback. Throws an error to show an in-form alert. |
| `onGoogleSignIn` | `Function: () => void` | Required | Triggers Google OAuth authorization redirect. |
| `onGitHubSignIn` | `Function: () => void` | Required | Triggers GitHub OAuth authorization redirect. |
| `userName` | `string` | `"Learner"` | Greeting displayed in the header. |
| `signUpHref` | `string` | `"/signup"` | Link destination for the sign-up callout. |
| `forgotPasswordHref` | `string` | `"/forgot-password"` | Link destination for password reset. |

### `<Signup />` (`signup.jsx`)
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `onSubmit` | `Function: ({ fullName, email, password }) => Promise<void>` | Required | Async submission callback. Throws an error to show an in-form alert. |
| `onGoogleSignIn` | `Function: () => void` | Required | Triggers Google OAuth authorization redirect. |
| `onGitHubSignIn` | `Function: () => void` | Required | Triggers GitHub OAuth authorization redirect. |
| `loginHref` | `string` | `"/login"` | Link destination for returning users to log in. |

### `<ForgotPass />` (`forgotPass.jsx`)
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `onBack` | `Function: () => void` | Optional | Navigates back to login view. |

---

## 3. How to Test Authentication Locally

### 1. Mock Mode (Default)
In `.env`:
```env
VITE_USE_MOCK_AUTH=true
```
- Submitting login or signup simulates a valid session immediately and navigates to `/dashboard`.
- No database or gateway service required.

### 2. Live Spring Boot Gateway Mode
When running alongside the Spring Boot Gateway on port `8080`:
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_USE_MOCK_AUTH=false
```
- **Login Endpoint:** `POST /api/auth/login` (Body: `{ email, password }`)
- **Register Endpoint:** `POST /api/auth/register` (Body: `{ fullName, email, password }`) -> dispatches 6-digit OTP via Gmail SMTP.
- **Confirm Email OTP:** `POST /api/auth/email-verification/confirm` (Body: `{ email, otp }`)
- **Resend OTP:** `POST /api/auth/email-verification/resend` (Body: `{ email }`)
- **Forgot Password:** `POST /api/auth/forgot-password` (Body: `{ email }`)
- **Verify Reset OTP:** `POST /api/auth/verify-reset-otp` (Body: `{ email, otp }`)
- **Reset Password:** `POST /api/auth/reset-password` (Body: `{ email, resetToken, newPassword }`)
- **OAuth Google:** Redirects to `http://localhost:8080/oauth2/authorization/google`
- **OAuth GitHub:** Redirects to `http://localhost:8080/oauth2/authorization/github`
- **OAuth Callback:** Handled automatically at `/auth/callback` via `POST /api/auth/oauth2/exchange`
