# Application Tracking System

AI-powered resume analysis and cover-letter generation built with Next.js, Stack Auth, Convex, and Google Gemini.

## Features

- Resume analysis with match scoring, strengths, weaknesses, skills match, and recommendations
- Cover-letter generation with configurable tone and length
- PDF resume upload and parsing
- Searchable history for analyses and cover letters
- Auth-protected dashboard flows
- Rate limiting (Upstash Redis in production, in-memory fallback for local/test only)

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript 5
- Tailwind CSS 4
- Convex (data storage and queries)
- Stack Auth
- Google Gemini (`@google/generative-ai`)
- Radix UI + Lucide icons
- Vitest + Testing Library

## Getting Started

### Prerequisites

- Node.js 18+
- Bun 1.0+
- A Google Gemini API key
- A Convex project URL
- Stack Auth project credentials

### Installation

1. Clone and install dependencies

```bash
git clone https://github.com/Aditya190803/application-tracking-system.git
cd application-tracking-system
bun install --frozen-lockfile
```

2. Create local env file

```bash
cp .env.example .env.local
```

3. Set required variables in `.env.local`

```env
# Gemini
GOOGLE_API_KEY=""

# Convex
NEXT_PUBLIC_CONVEX_URL=""

# Stack Auth
NEXT_PUBLIC_STACK_PROJECT_ID=""
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=""
STACK_SECRET_SERVER_KEY=""

# Optional
NEXT_PUBLIC_APP_URL="http://localhost:3000"
MODEL_NAME="gemini-2.5-flash"
AI_TIMEOUT_MS="30000"
PDF_PARSE_TIMEOUT_MS="12000"
COVER_LETTER_ROUTE_TIMEOUT_MS="35000"
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
# Only set true for local emergency fallback; keep false/empty in production
ALLOW_IN_MEMORY_RATE_LIMIT=""
```

4. Start Convex dev backend and Next.js app

```bash
bunx convex dev
bun run dev
```

App runs at `http://localhost:3000`.

## Scripts

```bash
bun run dev         # Start Next.js dev server
bun run build       # Build app
bun run start       # Start production server
bun run lint        # Run ESLint
bun run test        # Run tests once (Vitest)
bun run test:watch  # Run tests in watch mode
bun run setup-db    # One-time Convex setup (convex dev --once)
```

## Route Structure

Primary user flows are under dashboard routes:

- `/dashboard/analysis`
- `/dashboard/analysis/[slug]`
- `/dashboard/cover-letter`
- `/dashboard/cover-letter/[slug]`
- `/dashboard/history`
- `/dashboard/upload`

Generation handoff uses slug `new`:

- `/dashboard/analysis/new`
- `/dashboard/cover-letter/new`

## API Endpoints

### `POST /api/analyze`

Analyzes a resume against a job description.

Body fields:

- `resumeText: string` (required)
- `jobDescription: string` (required)
- `analysisType: "overview" | "keywords" | "match" | "coverLetter"`
- `tone?: "professional" | "friendly" | "enthusiastic"`
- `length?: "concise" | "standard" | "detailed"`
- `companyName?: string`
- `hiringManagerName?: string`
- `achievements?: string`
- `resumeName?: string`
- `jobTitle?: string`
- `forceRegenerate?: boolean`

Success response:

- `result: object | string`
- `cached: boolean` (`true` when served from in-memory or database cache)
- `source?: "memory" | "database"` (present when `cached: true`)
- `documentId?: string` (present when persisted in Convex)

Error response shape:

- `{ code, message, details?, requestId }` with status `400 | 401 | 429 | 500 | 503 | 504`

### `POST /api/generate-cover-letter`

Generates and saves a cover letter.

Body fields:

- `resumeText: string` (required)
- `jobDescription: string` (required)
- `tone?: "professional" | "friendly" | "enthusiastic"`
- `length?: "concise" | "standard" | "detailed"`
- `companyName?: string`
- `hiringManagerName?: string`
- `achievements?: string`
- `resumeName?: string`

Success response:

- `result: string`
- `wordCount: number`
- `tone: "professional" | "friendly" | "enthusiastic"`
- `length: "concise" | "standard" | "detailed"`
- `documentId?: string`

Error response shape:

- `{ code, message, details?, requestId }` with status `400 | 401 | 429 | 500 | 503 | 504`

### Other API routes

- `POST /api/parse-pdf`
- `GET|PUT|DELETE /api/drafts`
- `GET /api/search-history`
- `GET /api/history/[id]`
- `DELETE /api/history/[id]`
- `GET /api/user-stats`
- `GET|DELETE /api/user-data`
- `GET /api/health`

`/api/search-history` and `/api/user-stats` are now session-authenticated and do not accept `userId` query params.

### `GET /api/history/[id]`

Query:

- `type=analysis | cover-letter` (optional; if omitted route attempts both for backward compatibility)

Success response:

- `{ item: { id, type, result, createdAt, ...optionalFields } }`
- `type` is one of `"analysis"` or `"cover-letter"`

Error response shape:

- `{ code, message, details?, requestId }` with status `400 | 401 | 403 | 404 | 500`

## Project Layout

```text
src/app/
  api/
  dashboard/
    analysis/
    cover-letter/
    history/
    upload/
  handler/[...stack]/
  page.tsx

convex/
  schema.ts
  functions.ts
```

## Notes

- History/detail access is protected by user ownership checks.
- Convex query IDs are table-specific; analysis and cover-letter IDs are handled separately.
- In production, configure Upstash Redis rate limiting (`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`).
- In-memory rate limiting fallback is intended for local/test only. Production fallback requires `ALLOW_IN_MEMORY_RATE_LIMIT=true`.
- See `docs/observability.md`, `docs/performance.md`, and `docs/privacy-controls.md` for operational guidance and user-data controls.

## Testing

Run tests:

```bash
bun run test
```

Useful patterns in this codebase:

- Convex client mocking: use a constructor-compatible mock for `ConvexHttpClient` because production code uses `new ConvexHttpClient(...)`.
- Stack auth mocking: mock `stackServerApp.getUser` (or `getAuthenticatedUser`) explicitly in route/unit tests to control auth states.
- Dashboard slug flow tests: seed `sessionStorage` with pending payloads and assert `/dashboard/*/new` redirects to `/dashboard/*/:id`.
- History route tests: pass `type=analysis` / `type=cover-letter` and assert ownership/auth error statuses.

## License

Private and proprietary.
