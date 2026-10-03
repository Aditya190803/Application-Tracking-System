# Application Tracking System

This is a job seeker's resume preparation and job discovery app built with Next.js App Router, React, TypeScript, Tailwind CSS, Stack Auth, and Convex. Vite+ manages tooling; Next.js serves and builds the application.

## Major Features

| Feature         | Entry point                                      | Main responsibilities                                                                                                                  |
| --------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard       | `src/app/dashboard/page.tsx`                     | Resume, analysis, and cover-letter counts, average match score, and quick actions.                                                     |
| Resume library  | `src/app/dashboard/upload/`                      | PDF upload, text extraction, stored resumes, selection, and deletion.                                                                  |
| Applications    | `src/app/dashboard/applications/`                | Persistent application pipeline, contacts, notes, follow-up queue, filtered CSV export, and watchlist imports.                         |
| Interview prep  | `src/app/dashboard/applications/[id]/interview/` | AI practice questions, STAR outlines, saved answer notes, explicit regeneration, and revision conflict protection on each application. |
| Resume analysis | `src/app/dashboard/analysis/`                    | Job match scoring, skills extraction, strengths, weaknesses, recommendations, and saved results.                                       |
| Cover letters   | `src/app/dashboard/cover-letter/`                | Generation with tone and length preferences, draft restoration, saved letters, and document export.                                    |
| Resume builder  | `src/app/dashboard/resume-builder/`              | AI resumes from notes or saved content, optional job tailoring, seven LaTeX templates, editing, PDF rendering, and saved versions.     |
| History         | `src/app/dashboard/history/`                     | Search and filtering across saved analyses, cover letters, and tailored resumes.                                                       |
| Job alerts      | `src/app/dashboard/watchlist/`                   | Career-page trackers, role/location/exclusion filters, editable email preferences, manual scans, and pending-alert retries.            |
| Authentication  | `src/stack/server.ts`, `src/app/handler/`        | Stack Auth sessions and account flows.                                                                                                 |
| Public pages    | `src/app/`                                       | Landing page, how it works, contact, privacy, and terms.                                                                               |

Treat this table as the existing product scope. When adding a feature, connect its navigation, authenticated API, storage, loading/error/empty states, and relevant history or dashboard integration.

## Development Commands

Use `package.json` and the lockfile as the command and dependency sources of truth. This repository declares pnpm and uses `pnpm-lock.yaml`.

| Task                                 | Command                |
| ------------------------------------ | ---------------------- |
| Install dependencies                 | `vp install`           |
| Start Next.js                        | `vp run dev`           |
| Start the Convex development backend | `vp exec convex dev`   |
| Build Next.js                        | `vp run build`         |
| Serve the production build           | `vp run start`         |
| Format and lint checks               | `vp check`             |
| Strict lint script                   | `vp run lint`          |
| TypeScript checks                    | `vp run typecheck`     |
| Tests, single run                    | `vp run test`          |
| Tests with coverage                  | `vp run test:coverage` |

**Project-specific override:** use `vp run dev` and `vp run build` for this app. The generic Vite+ commands described below invoke Vite rather than the Next.js scripts. `vite.config.ts` currently disables lint type checking, so run the explicit typecheck script as well as `vp check` for code changes. Test configuration lives in `vitest.config.ts`, and tests live under `test/`.

For environment setup, read `.env.example`. For deployment, career-page providers, email/cron setup, or observability, read the relevant section of `README.md`. Some README and CI commands still reference Bun; reconcile toolchain changes with `package.json` and the current lockfile.

## Architecture and Conventions

- Pages and API route handlers live in `src/app/`; reusable UI lives in `src/components/`, with primitives in `src/components/ui/`. Reuse the Tailwind tokens in `src/app/globals.css` and the existing toast and navigation components.
- Keep interactive browser state in client components; keep credentials, AI calls, PDF parsing, and database access on the server. The `@/` import alias resolves to `src/`.
- Validate API inputs with the contracts in `src/lib/contracts/api.ts`. Follow the route's existing response contract; shared error helpers in `src/lib/api-response.ts` include a code, message, and request ID.
- Resolve the authenticated user through `src/lib/auth.ts` and scope every user-owned read or write to that user. Preserve rate limiting on expensive routes and existing ownership checks in Convex domain modules.
- Convex tables and indexes live in `convex/schema.ts`; domain operations live in `convex/*.ts`. Server adapters in `src/lib/convex-server.ts` call `functions:*` paths, so preserve or update the compatibility exports in `convex/functions.ts` when adding operations. Regenerate Convex artifacts through its CLI when required.
- Shared API and domain types live in `src/types/`. Update the request contract, server adapter, stored data, and consuming UI together when changing a payload.

## Feature Rules and Operational Limits

- **AI generation:** `src/lib/gemini.ts` uses the server-only AI Gateway transport in `src/lib/ai-gateway.ts`. Use `AI_GATEWAY_API_KEY`, `AI_GATEWAY_BASE_URL`, and `MODEL_NAME` from `.env.example`; the `gemini.ts` filename is historical. The gateway base includes `/v1` and the app uses chat completions, so choose a chat-capable model reachable by the managed key. Preserve timeouts, retries, normalized results, user-scoped caches, and regeneration behavior when changing generation flows.
- **Drafts and duplicate requests:** inspect `src/hooks/useGenerationFlow.ts`, `src/lib/server-drafts.ts`, and `src/lib/idempotency.ts` before changing restoration or retry behavior. Server drafts and idempotency responses are currently process-local stores, so they are not durable across restarts or shared between instances.
- **Document output:** use the existing PDF parsing, LaTeX generation/rendering, and cover-letter export helpers. Keep upload limits, parsing timeouts, render failures, and downloadable output consistent with the existing flows.
- **Job discovery:** provider adapters live in `src/lib/job-sources/`. Use `src/lib/safe-fetch.ts` for user-supplied URLs and redirects. The initial scan records a baseline without alerting; later scans deduplicate postings and send new-role alerts. Preserve pending notifications when email delivery fails or is unconfigured.
- **Scheduled scans:** `/api/cron/scan-watchlist` requires `CRON_SECRET` and scans a bounded batch. Scheduling lives in `vercel.json`. Keep authentication and batching intact when changing the scan flow.
- **Configuration and logs:** keep secrets server-only and document new variables in `.env.example`. Use the observability helpers for route events and request IDs; keep resume text, job descriptions, and credentials out of logs. Production rate limiting uses Upstash; the memory fallback is local unless explicitly enabled.

## Completing a Change

1. Inspect the current working tree and relevant feature files before editing; preserve existing work.
2. Implement the feature through its existing UI, route, and storage patterns. Include accessible controls and useful loading, error, and empty states.
3. For code changes, run the checks above and the relevant tests; use coverage or a production build when the affected behavior requires them. For documentation-only changes, check formatting and confirm referenced paths and commands against the repository.
4. Report the result, checks performed, and any failures or required environment setup. Update this feature map when adding a major capability.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->
