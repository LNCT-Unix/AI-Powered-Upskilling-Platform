# AI-Powered Upskilling Platform — Web App Frontend

The modern web application for the AI-Powered Upskilling Platform.

## Technology Stack
- **Framework:** React 19 (`react`, `react-dom` ^19.3.1)
- **Build Tool:** Vite 8 (`vite` ^8.3.4) with `@vitejs/plugin-react` (Oxc parser)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`, `tailwindcss` ^4.3.3)
- **Routing:** React Router v7 (`react-router-dom` ^7.13.0)
- **Icons:** Lucide React (`lucide-react` ^1.16.0)

## Getting Started

1. Navigate to the `web-app` directory:
   ```bash
   cd web-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Environment Configuration
Copy `.env.example` to `.env`:
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_USE_MOCK_AUTH=true
```

Set `VITE_USE_MOCK_AUTH=false` when running against the live Spring Boot Gateway.
