# Authentication UI Components & Pages

This directory houses the reusable authentication UI forms for the web application, styled with Tailwind CSS v4 and designed to plug directly into [`AuthContext.jsx`](../../context/AuthContext.jsx).

---

## 1. Directory Structure

```
web-app/src/
├── components/auth/
│   ├── login.jsx          # Interactive Login form (Email/Password, Google & GitHub OAuth triggers)
│   ├── signup.jsx         # Interactive Signup form (Full Name, Email, Password, Validation, OAuth)
│   └── README.md          # This component specification
│
├── pages/
│   ├── LoginPage.jsx      # Page view at `/login` (handles state, useAuth & redirection)
│   └── SignupPage.jsx     # Page view at `/signup` (handles registration & redirection)
│
├── context/
│   └── AuthContext.jsx    # Central authentication provider (login, register, logout, user session)
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

---

## 3. How to Test Authentication Locally

### 1. Mock Mode (Default)
In `.env` or `.env.example`:
```env
VITE_USE_MOCK_AUTH=true
```
- Submitting either form logs in immediately using simulated credentials and redirects to `/dashboard`.
- No backend setup or database is needed.

### 2. Live Spring Boot Gateway Mode
When running alongside Aadi & Riya's backend on port `8080`:
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_USE_MOCK_AUTH=false
```
- **Login Endpoint:** `POST /api/auth/login` (Body: `{ email, password }`)
- **Register Endpoint:** `POST /api/auth/register` (Body: `{ fullName, email, password }`)
- **OAuth Google:** Redirects to `http://localhost:8080/oauth2/authorization/google`
- **OAuth GitHub:** Redirects to `http://localhost:8080/oauth2/authorization/github`
- **OAuth Callback:** Handled automatically at `/auth/callback` via `POST /api/auth/oauth2/exchange`
