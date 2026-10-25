# Adaptive Question Service

A Node.js service for the AI-Powered Adaptive Upskilling Platform that generates diagnostic questions and adapts difficulty based on previous answers.

## Tech Stack
- Node.js and Express
- OpenRouter for LLM integration
- Mock mode for local testing
- Jest for automated tests

## Architecture

- **Spring Boot:** Handles authentication, assessment progress, answer evaluation, and database storage.
- **Node.js:** Generates adaptive questions and validates LLM responses.
- **OpenRouter:** Provides LLM-based question generation.

The service is stateless and does not use a database.

## Setup

**Requirements:** Node.js 20+

Install dependencies:

```bash
npm install
```

Create your environment file:

```powershell
Copy-Item .env.example .env
```

Start in mock mode:

```bash
npm run dev:mock
```

The service runs at `http://localhost:3001`.

## Environment Configuration

Configure these variables in `.env`:

```env
PORT=3001
SPRING_BOOT_API_KEY=your_shared_secret
MOCK_LLM=true
OPENROUTER_API_KEY=your_api_key
OPENROUTER_MODEL=your_model_identifier
```

For real LLM generation, set `MOCK_LLM=false` and configure a valid OpenRouter API key and model.

## API Endpoints

### Health Check

`GET /health`

Checks service status.

### Generate Next Question

`POST /internal/assessment/next-question`

Required header:

```http
X-Internal-API-Key: your_shared_secret
```

Example request:

```json
{
  "assessmentId": "assessment-123",
  "skill": "Java",
  "questionNumber": 1,
  "totalQuestions": 10,
  "previousAnswers": []
}
```

The response includes the question, options, correct answer, and explanation. Spring Boot must not expose the correct answer or explanation to the frontend before submission.

## Adaptive Logic

- Starts with an easy question.
- Correct answers generally increase difficulty.
- Incorrect answers reduce difficulty.
- Incorrectly answered concepts may be revisited once.
- Previously covered topics are avoided where possible.

## Spring Boot Integration

Spring Boot calls the Node.js service to request questions, saves the responses in its database, and sends learner-facing question data to the frontend.

Spring Boot should:
- Send assessment details and previous answer history.
- Authenticate internal requests using `X-Internal-API-Key`.
- Store questions and answer keys.
- Reuse saved questions instead of generating duplicates when a learner reloads the page.

## Testing

Run automated tests:

```bash
npm test
```

Test the health endpoint:

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get
```

A Postman collection is available at `docs/postman_collection.json`.

## Security

- Keep API keys and secrets in `.env`; never commit them.
- Restrict access to internal endpoints.
- Use HTTPS in production.
- Validate requests and generated questions.
