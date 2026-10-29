# AI Upskilling Platform — AI Worker Subsystem

> **Architecture:** Decoupled Asynchronous Generative Services  
> **Runtime:** Node.js 20+ • Express • Jest  
> **Default Port:** `3001` (Configurable via `PORT`)  
> **Maintainers:** Team Unix (EPAM Systems CoE Programme)  

---

## 📑 Table of Contents

1. [Overview & Role](#1-overview--role)
2. [Subsystem Architecture](#2-subsystem-architecture)
3. [Component Services](#3-component-services)
   - [Adaptive Question Service](#adaptive-question-service)
   - [Personalized Roadmap Generator (Sprint 2/3)](#personalized-roadmap-generator-sprint-23)
4. [Security & Isolation Boundary](#4-security--isolation-boundary)
5. [OpenRouter & LLM Integration](#5-openrouter--llm-integration)
6. [Configuration & Environment Variables](#6-configuration--environment-variables)
7. [Local Development & Testing Workflows](#7-local-development--testing-workflows)

---

## 1. Overview & Role

The **AI Worker Subsystem** is an isolated, compute-intensive generative service designed to offload long-running and stochastic LLM operations from the synchronous Spring Boot Gateway.

Its responsibilities include:
- **Dynamic Question Generation:** Generating psychometrically calibrated multiple-choice questions dynamically tailored to a learner's demonstrated weak areas.
- **Topological Roadmap Synthesis:** Formulating structured, milestone-driven learning plans from diagnostic IRT ability scores and skill graph gap analysis.
- **Automated Capstone Code Audits (Planned):** Performing AST parsing, linting, test suite execution, and semantic architecture reviews on submitted student GitHub repositories.
- **Mock Interview Simulation (Planned):** Providing real-time prompt generation and scored feedback for technical mock interviews.

---

## 2. Subsystem Architecture

The AI Worker operates within a private subnet and **never** communicates with the PostgreSQL database directly. All state transitions, user access tokens, and persistence are managed by the Spring Boot Gateway:

```
┌─────────────────────────────────┐
│   Web App Client (React 19)     │
└────────────────┬────────────────┘
                 │ Public HTTPS / REST
                 ▼
┌─────────────────────────────────┐       Internal HTTP        ┌──────────────────────────────────┐
│   Spring Boot Gateway (Port 8080)│ ────────────────────────► │   AI Worker Node.js (Port 3001)   │
│   Rasch CAT • User Auth • DB    │   X-Internal-API-Key       │   Stateless LLM Client           │
└────────────────┬────────────────┘                            └────────────────┬─────────────────┘
                 │                                                              │
                 ▼                                                              ▼
┌─────────────────────────────────┐                            ┌──────────────────────────────────┐
│   PostgreSQL Database (Neon)    │                            │   OpenRouter API Gateway         │
│   (Private Persistence Layer)   │                            │   Claude / GPT-4 / Gemini Flash  │
└─────────────────────────────────┘                            └──────────────────────────────────┘
```

---

## 3. Component Services

### Adaptive Question Service (`adaptive-question-service/`)
Located at `ai-worker/adaptive-question-service/`:
- **Role:** Generates next candidate questions on-the-fly and adapts difficulty according to previous question responses.
- **Endpoints:**
  - `GET /health`: Liveness probe.
  - `POST /internal/assessment/next-question`: Generates question item with options, calibrated difficulty, correct answer index, and pedagogical rationale.
- **Internal Security:** Requires `X-Internal-API-Key: <shared_secret>` header on all requests.
- **Mock Mode:** Built-in offline mock mode (`MOCK_LLM=true`) simulating intelligent question adaptation without external API token costs.

### Personalized Roadmap Generator (Sprint 2/3)
- Synthesizes personalized step-by-step roadmaps from the post-assessment report (`/api/v1/assessments/{id}/report`).
- Ingests unlocked frontier skills, orders topics topologically respecting prerequisite constraints, and attaches vetted learning resources (videos, documentation, sandbox exercises).

---

## 4. Security & Isolation Boundary

1. **No Direct Database Access:** The AI Worker has zero direct database credentials. It receives data solely via request payloads from the Gateway.
2. **Internal API Authentication:** All internal endpoints require the `X-Internal-API-Key` HTTP header. Requests with missing or invalid keys return `401 Unauthorized`.
3. **No Frontend Exposure:** Frontend clients never call the AI Worker directly; all client requests route through the Gateway.
4. **Answer Obfuscation:** Generated correct answers and explanations are returned exclusively to the Gateway. The Gateway never reveals the correct answer to the client during active testing.

---

## 5. OpenRouter & LLM Integration

When `MOCK_LLM=false`, the service routes inference calls through OpenRouter, enabling multi-model redundancy and cost optimization:
- Primary Model: `google/gemini-2.0-flash` or `anthropic/claude-3-haiku` for fast, deterministic question generation.
- Fallback Model: Configurable via `OPENROUTER_MODEL`.

---

## 6. Configuration & Environment Variables

Create `.env` inside `ai-worker/adaptive-question-service/`:

```env
# Server Port
PORT=3001

# Shared Secret with Spring Boot Gateway
SPRING_BOOT_API_KEY=your_shared_internal_secret

# LLM Mode (true = offline mock generator, false = live OpenRouter API)
MOCK_LLM=true

# OpenRouter Credentials (required when MOCK_LLM=false)
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key
OPENROUTER_MODEL=google/gemini-2.0-flash-001
```

---

## 7. Local Development & Testing Workflows

### Prerequisites
- Node.js `^20.0.0` or `^22.0.0`
- npm `^10.0.0`

### Run in Mock Mode (Offline Development)
```bash
cd ai-worker/adaptive-question-service
npm install
npm run dev:mock
```
Service starts on `http://localhost:3001`.

### Run Automated Tests
```bash
cd ai-worker/adaptive-question-service
npm test
```
All unit tests and adaptive algorithm assertions will execute via Jest.
