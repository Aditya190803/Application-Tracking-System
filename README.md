# Application Tracking System

AI-powered resume analysis and cover-letter generation built with Next.js, Stack Auth, Convex, and AI Gateway.

## Features

- Application tracker with status pipeline, recruiter contacts, notes, follow-up queue, and CSV export
- Interview preparation per application: AI questions, truthful STAR outlines, editable saved answer notes, and conflict protection
- Resume analysis with match scoring, strengths, weaknesses, skills match, and recommendations
- Cover-letter generation with configurable tone and length
- AI resume creation from career notes or saved resumes, with seven LaTeX templates
- PDF resume upload and parsing
- Searchable history for analyses and cover letters
- Career page trackers with role/location filters, manual scans, and optional email alerts
- Auth-protected dashboard flows
- Rate limiting (Upstash Redis in production, in-memory fallback for local/test only)

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript 5
- Tailwind CSS 4
- Convex (data storage and queries)
- Stack Auth
- [AI Gateway](https://ai-gateway.adityamer.dev/docs) (OpenAI-compatible API)
- Radix UI + Lucide icons
- Vitest + Testing Library

## Getting Started

### Prerequisites

- Node.js 20.19+ (or 22.12+)
- Vite+ (`vp`) and the declared pnpm version
- An AI Gateway API key
- A Convex project URL
- Stack Auth project credentials

### Installation

1. Clone and install dependencies

```bash
git clone https://github.com/Aditya190803/application-tracking-system.git
cd application-tracking-system
vp install
```

2. Create local env file

```bash
cp .env.example .env.local
```

3. Set required variables in `.env.local`

```env
# AI Gateway
AI_GATEWAY_API_KEY=""

# Convex
NEXT_PUBLIC_CONVEX_URL=""

# Stack Auth
NEXT_PUBLIC_STACK_PROJECT_ID=""
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=""
STACK_SECRET_SERVER_KEY=""

# Optional
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AI_GATEWAY_BASE_URL="https://ai-gateway.adityamer.dev/v1"
MODEL_NAME="claude-sonnet-5"
AI_TIMEOUT_MS="30000"
PDF_PARSE_TIMEOUT_MS="12000"
COVER_LETTER_ROUTE_TIMEOUT_MS="35000"
RESUME_ROUTE_TIMEOUT_MS="45000"
LATEX_RENDER_API_BASE="https://latexonline.cc"
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
# Only set true for local emergency fallback; keep false/empty in production
ALLOW_IN_MEMORY_RATE_LIMIT=""

# Job alerts (see "Career page watchlist" below)
RESEND_API_KEY=""
EMAIL_FROM=""
CRON_SECRET=""

# Axiom (production logging)
AXIOM_TOKEN=""
AXIOM_DATASET=""
AXIOM_SERVICE="ats"
LOG_OBS_ERROR_DETAILS=""
```

Create a managed key from the [gateway dashboard](https://ai-gateway.adityamer.dev/admin/dashboard), then set `AI_GATEWAY_API_KEY` on the server. The app calls `/v1/chat/completions` with bearer authentication; dependency health checks call `/v1/models` on the same base URL. `MODEL_NAME` defaults to `claude-sonnet-5`, the gateway docs' example; select a model your key can reach with `GET /v1/models`. Provider and vendor prefixes (for example `anti/gemini-3-flash`) pass through unchanged.

When migrating, replace `OPENCODE_API_KEY` and `OPENCODE_BASE_URL` in local and deployment environments with the gateway variables. Remove an old `MODEL_NAME=big-pickle` unless your gateway key explicitly exposes that model. The old OpenCode settings are no longer read. Keep keys server-only; never use a `NEXT_PUBLIC_` variable for them.

Use a chat-capable provider/model for this app. A connected Codex subscription seat serves only `/v1/responses`, which this chat integration does not call. See the [gateway API docs](https://ai-gateway.adityamer.dev/docs) for key ownership, model routing, and provider failover.

4. Start Convex dev backend and Next.js app

```bash
vp exec convex dev
vp run dev
```

App runs at `http://localhost:3000`.

## Application tracker

Open `/dashboard/applications` to record opportunities from Saved through Applied, Screening,
Interviewing, Offer, Accepted, Rejected, or Withdrawn. Use list or pipeline view, search by company,
role, location, contact, or notes, and filter by stage. Applied dates are filled in when you move
a saved role to Applied; all dates can be edited.

Set a follow-up date to add an active opportunity to the due queue. Due dates use your local
calendar day and include overdue follow-ups. Marking a follow-up Done clears its date;
accepted, rejected, and withdrawn applications are excluded from the due queue. These are
in-app reminders, with no automatic reminder email. The dashboard shows application progress
and links to follow-ups due.

The watchlist's **Track application** link prefills the company, role, location, and posting URL.
Saving the same watchlist listing twice reuses the existing record without replacing its notes.
Manually entered applications may share a role or company, allowing repeat applications.

**Export CSV** downloads the records matching the current search and filters, including notes and
contacts. Spreadsheet formulas in user-entered cells are escaped. Applications are stored in
Convex and scoped to the signed-in account, with a maximum of 1,000 records per account.
Run `vp exec convex dev` to publish the updated schema and functions locally, or deploy them
through your existing Convex deployment process before using the tracker in production.

## Resume maker

Open `/dashboard/resume-builder` and choose a saved resume, **Write Your Content**, or a
previous match analysis. Career notes can include contact details, experience, dates, skills,
projects, education, and achievements. A job description is optional: omit it for a general
resume or include it for a tailored version. AI is instructed to use only supplied facts.

Choose among seven built-in formats: Jake's Resume, Deedy Modern, SB2Nov ATS, Executive Serif,
Modern Sidebar, Graduate Focus, and Compact Technical. Modern Sidebar uses two columns and is
best for direct sharing; the other formats use a single reading column. You can also upload a
custom LaTeX template. Edit the generated source, preview the PDF, download PDF/LaTeX, and save
versions to your history. AI requires `AI_GATEWAY_API_KEY`; PDF previews use `LATEX_RENDER_API_BASE`
(default: `https://latexonline.cc`).

## Career page watchlist

Users add company career page URLs at `/dashboard/watchlist`. Each page is scraped on a
schedule, and any posting that was not present on the previous scan is emailed to them with a
link that opens `/dashboard/analysis` with the job description already filled in. Each tracker
can save comma-separated role keywords, locations, and excluded title terms. A title must match
any role keyword and its location must match any location term; empty groups allow all. Excluded
title terms take priority. Matching is case-insensitive. **Settings** edits these preferences
and the email switch; **Scan now** checks immediately, and **Pause** suspends scheduled scans.
Recent jobs show matching roles by default, with **Show all roles** available. In-app listings
remain available with email disabled. Failed or unconfigured email delivery keeps pending roles
eligible for retry while they remain on the career page.

**How pages are read.** `src/lib/job-sources/` detects the applicant tracking system behind a
URL and calls its public JSON API — Greenhouse, Lever, Ashby, Workable, SmartRecruiters and
Recruitee are supported. Anything else falls back to parsing the HTML: JSON-LD `JobPosting`
blocks first, then anchors that look like postings. If that produces no roles and
`FIRECRAWL_API_BASE_URL` is configured, the scraper requests rendered HTML through Firecrawl's
`/v2/scrape` endpoint and parses it again. Set `FIRECRAWL_API_KEY` if the service requires a key.
For example, use `https://firecrawl.adityamer.dev` when access to that service is available, or
`https://api.firecrawl.dev`. Login walls and unsupported boards may still report an error.

**First scan never notifies.** Adding a watch runs a baseline scrape inline that records what is
currently posted, so only roles that appear afterwards trigger an alert.

**Outbound requests are guarded.** URLs come from user input, so `src/lib/safe-fetch.ts` checks
scheme, port and resolved IP — including on every redirect hop — before any request, which keeps
the scraper away from internal services and the cloud metadata endpoint.

### Setup

1. Create a [Resend](https://resend.com) API key and verify a sending domain.
2. Set `RESEND_API_KEY` and `EMAIL_FROM` (e.g. `ATS Job Alerts <alerts@yourdomain.com>`).
   Without both, scans still run and store new listings; they are mailed on the first run after
   the keys are added.
3. Set `CRON_SECRET` to a long random string. `/api/cron/scan-watchlist` rejects every request
   unless it carries `Authorization: Bearer $CRON_SECRET`, and stays closed when the variable is
   unset. Vercel sends this header automatically for cron invocations.
4. Set `NEXT_PUBLIC_APP_URL` to the deployed origin — it is the base for the links in the email.
5. Deploy. `vercel.json` registers the cron at 07:00 UTC daily. Hobby projects are limited to
   daily cron runs; on Pro you can raise it (e.g. `0 */6 * * *`). The endpoint scans the 20 least
   recently checked watches per run and skips anything scanned in the last hour, so a larger
   backlog drains across runs.

Trigger a run manually with:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/scan-watchlist
```

## Observability (Axiom)

Server routes emit structured JSON logs (`[obs]` prefix) via `src/lib/observability.ts`.

1. Create an [Axiom](https://axiom.co) dataset (e.g. `ats-prod`).
2. Create an API token with ingest permission.
3. Set on Vercel (and in `.env.local` for dev ingest):
   - `AXIOM_TOKEN` — bearer token (never commit)
   - `AXIOM_DATASET` — e.g. `ats-prod`
   - `AXIOM_EDGE` — optional, e.g. `us-east-1.aws.edge.axiom.co` (matches your ingest URL region)
4. Optional: add the **Vercel → Axiom** integration for raw platform logs in addition to direct ingest.

**Useful Axiom queries**

```apl
['your-dataset']
| where event == "pdf.parse_failed" or event == "pdf.parse_no_text"
| sort by _time desc
```

```apl
['your-dataset']
| where requestId == "paste-ref-from-user"
```

PDF upload failures include `requestId` in the API error; the upload UI shows it as `(ref: …)` so users can share it with support.

Set `LOG_OBS_ERROR_DETAILS=true` temporarily to include sanitized `errorMessage` on failure events (never resume or job description content).

## Interview preparation

Open **Applications**, then **Prepare for interview** on a tracked role. Choose a saved resume or paste career details and add the job description. Generated questions and answer notes are saved in Convex with the application; removing the application also removes its preparation. Save answer edits explicitly. Regeneration asks before replacing questions and clearing answers. A stale save from another tab returns a conflict so existing work is preserved. Interview records are accessed through the application tracker, rather than the analysis history.

Generation uses the existing AI Gateway configuration, validates the AI response, limits each user to six generation requests per minute, and retries once with a 30-second timeout per attempt. Identical inputs reuse saved preparation; forced regeneration replaces it. Concurrent requests are coalesced within one process, and database revision checks protect saves across instances. Pasted inputs are not saved as drafts; questions and explicitly saved answers persist.

## Production readiness

Run `vp run config:check` before deployment. It loads local environment files when present, checks required configuration and public HTTPS URLs, and prints variable names only. Passing this check confirms configuration shape, not successful authentication with each provider.

1. Configure AI Gateway, Stack Auth, and the production Convex URL and server key using `.env.example`.
2. Deploy the schema and functions to the intended Convex deployment through its CLI before shipping the frontend. Development deployment: `vp exec convex dev --once`; production deployment: use the project's configured Convex deployment workflow.
3. Set `RESEND_API_KEY` and `EMAIL_FROM` with a verified sender; set `CRON_SECRET` for the existing bounded watchlist cron. Confirm `vercel.json` is active on the hosting platform.
4. Configure both Upstash variables and a public HTTPS `NEXT_PUBLIC_APP_URL`. Keep `ALLOW_IN_MEMORY_RATE_LIMIT` unset in production.
5. Run `vp check`, `vp run lint`, `vp run typecheck`, `vp run test`, and `vp run build`. Check `/api/health`; rejected AI probes now report degraded status.
6. With a signed-in test account, create an application, generate interview preparation, save answers, reload, and verify a stale tab cannot overwrite them. Exercise a manual watchlist scan and pending-alert retry in the configured deployment.

Do not treat local test results as proof that external credentials or cron delivery work. Missing provider credentials require setup by the account owner.
