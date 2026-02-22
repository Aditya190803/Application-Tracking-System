# Application Tracking System

AI-powered resume analysis and cover-letter generation built with Next.js, Stack Auth, Convex, and Google Gemini.

## Features

- Resume analysis with match scoring, strengths, weaknesses, skills match, and recommendations
- Cover-letter generation with configurable tone and length
- Tailored LaTeX resume generation using selectable templates
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
RESUME_ROUTE_TIMEOUT_MS="45000"
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