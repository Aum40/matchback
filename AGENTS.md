# MATCHBACK — Agent Guide

> **Swipe smart. Apply with confidence.**
> Read this whole file before starting any task. It is the single source of rules for this repo. `api/` and `web/` contain thin `CLAUDE.md` / `AGENTS.md` stubs that only `@`-import this file. Add rules here, never to the stubs.

## 1. Product

MATCHBACK is a **two-sided "Tinder for Jobs"** with AI assistance.
- Candidates swipe on job postings.
- Recruiters swipe on candidates for a specific job.
- A **mutual match** happens only when both sides say LIKE.

It is being built for the **AI Track of U-Hackathon 2026**. **Deadline: 16 Oct 2026, 14:00 (Thailand).**

### Submission (team1 Ecosystem Hub — official participant guide)

Judges score **exactly the submitted version**, and they open three links. All three must work for anyone, in a private window:
1. the **public GitHub repo**
2. a **deployed demo website** that shows the real product, not just a landing page. Judges must be able to log in with demo accounts without signing up — see the deployment section in [docs/two-sided-plan.md](docs/two-sided-plan.md).
3. the **pitch deck** as a Google Drive link set to *Anyone with the link can view*.

Also:
- Changed something after submitting? **Submit again** before the deadline.
- The tech stack must list every partner tool **actually used**: U-Bot, Tokenomist, ElevenLabs, Avalanche. Never list one we didn't use.
- This repo started from a **pre-existing starter template**, so tick *"pre-existing idea or codebase"* when submitting. Be honest.

> **The two-sided scope is being built now.** Before writing code, read [docs/two-sided-plan.md](docs/two-sided-plan.md) (schema, authorization, **file ownership per developer**, implementation order) and [docs/api-contract.md](docs/api-contract.md) (the shared API contract). Sections below marked *(planned)* aren't on `main` yet.

**Who it's for:** university students, recent graduates and early-career professionals. They apply to many jobs, hear nothing back, and don't know whether their skills fit or how to improve their resume.

**Recruiters** create a company and job postings, then swipe on candidates for each job.

**What it does:**
- Swipe discovery on both sides, plus real mutual matches
- An explainable match score
- AI resume suggestions
- MATCHBACK Bot, a career assistant *(planned)*
- An application tracker

### Product principles (non-negotiable)

1. **Better applications, not more applications.** Every feature should help a candidate apply *well*, not *more*.
2. **Never promise or imply employer responses or hiring.** Copy must not say "chance", "probability", "likelihood of getting hired", or show the score as a `%`. The score describes *profile fit*.
3. **Never invent candidate facts.** AI must not add skills, experience, numbers or achievements that aren't in the profile.
4. **Missing information is not a skill gap.** If the profile doesn't say, we say "not enough information", not "you lack X".
5. **The tracker is self-reported.** Users update the status themselves. Nothing may suggest that employers update it.
6. **A "match" means mutual.** "It's a Match!" appears only when the API returns a created mutual match (`SwipeResult.match`). A high score is never a match, and the score is never called a match result.
7. **Candidate privacy before a match.** Recruiters see a `CandidateCard` (first name, profile text, skills, score). Email and full name are shown only after a mutual match. The recruiter deck never reveals whether a candidate liked the job.
8. **Demo data is labeled.** Every job is fictional (`Job.isDemo = true`, company names end in `(demo)`), and the UI shows a "Demo data" badge.

## 2. Hackathon scope

**In scope (MVP):**
- **Candidate:** profile, job swipe deck, explainable match, resume coach, saved jobs, application tracking, the matches page.
- **Recruiter** *(planned)*: company profile, create/manage jobs, a per-job candidate swipe deck, the matches page.
- **Mutual matching** *(planned)*: created only inside the two swipe endpoints, with a match celebration modal.
- **MATCHBACK Bot** *(planned)*: a floating AI career assistant (explain fit, job requirements, skill gaps, resume bullets, interview prep).

**Out of scope — do not build:**
- chat between users (the bot is the only chat)
- un-matching or blocking
- multi-company recruiters or team management
- **U-Bot integration inside the app.** Verified against the official `ubot-user-guide.pdf`: U-Bot (https://u.bot) is an end-user chat app (Casual / Professional / U-Code modes) with **no API for third-party apps**, so MATCHBACK cannot call it.
  - The in-app assistant is **MATCHBACK Bot on Claude**. Never call it U-Bot, invent a U-Bot endpoint, or claim an integration.
  - The team *may* use u.bot as a tool (drafting, U-Code prototypes). If it does, list U-Bot in the submission tech stack and say exactly what it was used for.
- job scraping or real job feeds
- custom ML training
- email or push notification infrastructure
- payments
- a second auth system

Login (email/password and optional Google) already exists. The only planned change is the `RECRUITER` role chosen at sign-up; don't build anything else in auth.

**Priorities:** a working end-to-end demo beats more features. Prefer the smallest complete solution. When unsure whether something is in scope, ask.

## 3. How to work in this repo

1. **Read this file first, then inspect the code you're about to change** (and its tests) before editing. Follow the patterns already there.
2. **Stay in the files your role owns** (file ownership table in [docs/two-sided-plan.md](docs/two-sided-plan.md#4-file-ownership-4-developers-in-parallel)). Need a change in someone else's file? Ask the owner. Don't edit across the boundary.
3. **Build against [docs/api-contract.md](docs/api-contract.md).** If the contract is wrong, change it in its own small PR (owner: Dev 3) and tell the team. Never let code and contract drift.
4. Work **incrementally**. Keep every step runnable and **preserve working functionality**. Don't break the existing demo path (login → discover → job detail → saved → applications). Also check the must-not-break list in the plan.
5. **Don't add dependencies, abstractions or rewrites** unless the task needs them. If a new dependency is necessary, say why.
6. After every change, **run the checks for each app you touched** (section 12). **Never claim tests or builds passed unless you ran them in this session**. Report failures honestly, with the output.
7. **Document unfinished work and known limitations** in the PR description or the final message. Never hide a stub behind UI that looks finished.

## 4. Tech stack

| Layer | Choice |
|---|---|
| API | NestJS 11, REST, class-validator DTOs |
| DB | PostgreSQL + Prisma 7 (`@prisma/adapter-pg`) |
| Web | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn (Base UI) |
| Auth | next-auth v5 (web) + JWT access token and rotating refresh token (API) |
| Forms | react-hook-form + zod |
| AI | Claude API via `@anthropic-ai/sdk`, isolated in `api/src/infrastructure/ai/`, with a deterministic fallback |
| Tests | API: Jest + supertest e2e. Web: Vitest + Testing Library |

**Toolchain:** Node **24.x (>= 24.15)** and **pnpm 11.8.0**, pinned in `.nvmrc`, `packageManager`, and `engines`. `engineStrict: true` lives in each app's `pnpm-workspace.yaml`, so the wrong Node version fails install and scripts. Run `nvm use`; don't override it.

**Version decisions:**
- **PostgreSQL rather than SQLite:** it was already wired up in the starter, and CI tests migrations against it.
- **No pnpm workspace / `packages/shared`:** the API and web are independent projects with their own lockfiles. The web keeps hand-written response types in `web/src/lib/api/api.type.ts`, with comments pointing at their API source.
- `next`, `react`, `next-auth` are pinned exactly. next-auth v5 is beta, so don't bump it casually.

## 5. Repo map

```
api/
  prisma/schema.prisma         data model (source of truth)
  prisma/migrations/           committed migrations — never edit an applied one
  prisma/seed-data.ts          demo skills, jobs and demo profile (stable ids)
  prisma/seed.ts               seeds catalog + admin + demo candidate
  src/matching/match-score.ts  ★ deterministic match score (pure function)
  src/matching/                GET /jobs/:id/match, POST …/explanation
  src/infrastructure/ai/       AiService (Claude) + ai.fallback.ts + schemas
  src/candidates/              GET/PUT /candidates/me (profile + skills)
  src/jobs/                    GET /jobs, /jobs/:id, /jobs/discover, POST /jobs/:id/swipe, GET /skills
  src/resume/                  POST /resume/coach
  src/applications/            GET/PATCH/DELETE /applications
  src/auth/ users/ admin/      from the starter: login, guards, admin
  src/companies/ recruiter/    (planned) company profile, recruiter jobs + candidate deck
  src/matches/                 (planned) mutual matches (read-only API)
  src/assistant/               (planned) MATCHBACK Bot
  src/common/                  decorators, throttle presets, PrismaExceptionFilter
web/
  src/app/page.tsx             landing (public, shows sample jobs)
  src/app/(app)/discover       swipe deck
  src/app/(app)/jobs/[id]      job detail + match analysis + AI panels
  src/app/(app)/profile        candidate profile form
  src/app/(app)/saved          INTERESTED applications
  src/app/(app)/applications   applied/interviewing/… tracking
  src/app/(app)/matches        (planned) candidate's mutual matches
  src/app/(app)/recruiter/**   (planned) recruiter area: company, jobs, candidate deck, matches
  src/components/features/     jobs/ match/ profile/ applications/ auth/
  src/lib/api/                 apiFetch + one *.api.ts per API area + api.type.ts
  src/lib/actions/             Server Actions (all mutations)
docs/architecture.md           modules, data flow, match formula (current state)
docs/api-contract.md           ★ shared API contract for the two-sided build
docs/two-sided-plan.md         ★ schema proposal, authz, file ownership, order, risks
```

## 6. Commands

**Use pnpm for everything — never `npx` or `npm run`.** Run commands inside `api/` or `web/`; there is no root package. For one-off tools use `pnpm dlx` (e.g. `pnpm dlx shadcn@latest add dialog`).

| | `api/` | `web/` |
|---|---|---|
| install | `pnpm install` (also runs `prisma generate`) | `pnpm install` |
| dev | `pnpm start:dev` → :8000 | `pnpm dev` → :3000 |
| lint | `pnpm lint` (fix) / `pnpm lint:check` (CI) | `pnpm lint` |
| test | `pnpm test` / `pnpm test:e2e` (no DB needed) | `pnpm test` |
| build | `pnpm build` | `pnpm build` |
| migrate | `pnpm prisma migrate dev --name <change>` | — |
| seed | `pnpm db:seed` (idempotent; resets the demo user's swipes) | — |
| reset DB | `pnpm prisma migrate reset` (drops data, re-seeds) | — |

## 7. Architecture boundaries

- **The browser never calls the API.** Server Components read data through `web/src/lib/api/*.api.ts`. Every mutation goes through a Server Action in `web/src/lib/actions/`. Both paths use `apiFetch`, which adds the bearer token and handles 401s. CORS is off on purpose.
- **The API owns all business logic.** That includes scoring, deciding gaps, what AI sees, and application rules. The web only displays and collects input. Don't recompute scores in the web.
- **Controllers handle HTTP only.** Logic lives in services. Pure logic, like scoring, lives in plain functions with no Nest or Prisma imports.
- **AI is behind `AiService`.** Nothing else imports `@anthropic-ai/sdk`.
- The web keeps its own response types and must not import API source files.

## 8. Code conventions

- Naming:
  - Module dirs: kebab-case plural (`src/applications/`).
  - Classes: `ApplicationsService` / `ApplicationsController`.
  - DTO files: `update-application.dto.ts` → `UpdateApplicationDto`.
  - Paths: kebab-case plural nouns.
  - React components: PascalCase files.
- Comment the **non-obvious** (why a check exists, what breaks without it) **in Thai**, matching existing code. Don't narrate what the code says.
- Keep UI copy in English, short and plain. Avoid hype.
- **UI:**
  - Mobile-first.
  - Use theme tokens from `globals.css` (`success`, `warning`, `destructive` for matched / unconfirmed / gap). No hardcoded colors.
  - Every state needs text or an icon, not color alone.
  - Every swipe has a button and keyboard alternative.
  - Every page has loading, empty and error states.

## 9. API design and validation

- Global `ValidationPipe({ whitelist: true, transform: true })`: every body and query is a DTO class. Use `@Trim()` on free text, `@NormalizeEmail()` on emails, and `@Type(() => Number)` on numeric query params.
- **Errors:** `{ statusCode, message, code? }`. Throw Nest exceptions with a stable `code` the web can branch on, e.g. `new NotFoundException({ message, code: 'JOB_NOT_FOUND' })`. The web reads it from `ApiError.code`; branch on `code`, never on `message`. `PrismaExceptionFilter` maps leftover Prisma errors (P2025→404, P2002→409, P2003→400) and hides DB details.
- **Roles:**
  - `USER` = **candidate** (the name is kept on purpose: renaming would migrate data and every token), `RECRUITER` *(planned)*, `ADMIN`.
  - Candidate-only routes get `@Roles(Role.USER)`, recruiter routes `@Roles(Role.RECRUITER)`.
  - `ADMIN` can never be chosen at sign-up.
- **Recruiter ownership** *(planned)*: every recruiter job route checks `job.companyId === caller's companyId`, loaded from the DB rather than trusted from the token. A mismatch returns 404 `JOB_NOT_FOUND`.
- **Auth:** every route needs a bearer token unless it is marked `@Public()`. Guards run in order: throttler → `AuthGuard` (deleted or old session → 401, suspended → 403 `ACCOUNT_SUSPENDED`) → `RolesGuard` (`@Roles(Role.ADMIN)`).
- **Ownership:** get the user with `@CurrentUser('sub')`, never from the body. Scope every user-owned query by `userId` in the `where` clause. For another user's id, return 404, not 403.
- Public endpoints today: `GET /health`, `/jobs`, `/jobs/:id`, `/skills`, and the `/auth/*` routes.
- AI endpoints are `POST` with `@AiThrottle()`, because each call costs money.

## 10. Database and Prisma

- Change the schema with `pnpm prisma migrate dev --name <change>`. Commit the migration folder together with `schema.prisma`. Never use `db push` for committed work, and never edit an applied migration. CI applies all migrations to an empty Postgres and fails if they drift from the schema.
- Naming:
  - Models: PascalCase singular.
  - Tables: snake_case plural via `@@map`.
  - Columns: snake_case via `@map`.
  - Enums: SCREAMING_SNAKE members.
- **Stable ids for reference and demo data:** `Skill.id` is a slug (`typescript`), `Job.id` is `job-001`…. Seed with `upsert` so it can re-run safely. Add new demo data to `prisma/seed-data.ts`; `src/database/seed-data.spec.ts` checks it.
- `User` is soft-deleted (`deletedAt`). Filter `deletedAt: null`, and never return a raw `User` row; use `PUBLIC_USER_SELECT`.
- The generated client lives in `src/database/generated/` (gitignored). If types are missing after a pull, run `pnpm prisma generate`.

## 11. Matching and AI rules

### Match score (`api/src/matching/match-score.ts`)

- **Deterministic and pure.** Same input gives the same output, with no I/O and no AI. It is covered by `match-score.spec.ts`. **Update the tests and `docs/architecture.md` in the same change whenever the formula changes.**
- **Formula:** `score = 70 × required + 15 × niceToHave + 15 × preferences`, rounded and clamped to 0–100.
  - The skill ratios count only skills the candidate *listed*.
  - Preferences average three parts (work arrangement, salary, role). Unknown values count 0.5 (neutral).
- **Skill buckets**, which must stay distinct:
  - `matchedSkills` — listed in the profile.
  - `unconfirmedSkills` — missing information. Reason `MENTIONED_IN_PROFILE` (the name appears in experience or projects text) or `NO_SKILLS_LISTED` (the profile lists no skills at all). These don't count toward the score and aren't called gaps.
  - `missingSkills` — confirmed gaps.
- Never present the score as a probability of being hired.

### Mutual match *(planned — normative rules in [docs/api-contract.md](docs/api-contract.md#mutual-match-rules-normative))*

- A match for `(candidate, job)` exists only when the candidate LIKEd the job (`JobInteraction`) **and** a recruiter of that job's company LIKEd the candidate for that job (`CandidateInteraction`).
- **Clients can never create a match.** There is no POST `/matches`. Matches are created only inside the two swipe services, using the **write-then-read** algorithm:
  1. Commit the swipe.
  2. Read the other side.
  3. `createMany({ skipDuplicates: true })` on `@@unique([candidateId, jobId])`.

  This is race-safe without SERIALIZABLE. Keep it, and keep its e2e test.
- Both swipe endpoints return `SwipeResult` with `match` non-null only when this swipe created or completed the match. The web shows the match modal only then.
- A match is not removed when a side later changes LIKE to SKIP, and resetting swipes doesn't delete matches.

### MATCHBACK Bot *(planned)*

- `POST /assistant/messages`. The server is stateless: the web sends the history (≤ 20 messages).
- It goes through `AiService` with the same rules prompt (never invent facts, never claim hiring odds) and the same fallback when there is no key or AI errors.
- An optional `jobId` gives the bot the same `MatchContext` as the explanation endpoint (no email/name).
- It is **not U-Bot.** U-Bot has no API (see section 2). Don't name it or describe it as the official hackathon U-Bot.

### AI (`api/src/infrastructure/ai/`)

- **AI explains and suggests. It never scores, re-scores, or invents.** The rules prompt in `ai.service.ts` enforces this. Keep it.
- **The API key is server-side only** (`ANTHROPIC_API_KEY` in `api/.env`). It never goes in `web/` or a `NEXT_PUBLIC_*` variable.
- **No key, timeout, API error, refusal or unparsable output → deterministic fallback** (`ai.fallback.ts`) with `source: "fallback"`. AI failure must never fail the request or the page. The UI shows the source: "AI-generated — check it" vs "Rule-based suggestions".
- Output is validated with zod (`ai.types.ts`). The AI and fallback responses share one shape; change both together.
- Send the minimum data: no name, email, or user id in prompts.
- AI runs **only on user action** (a button), never on page load or in lists. Model: `AI_MODEL` (default `claude-opus-5-5`). The server-side `fallbacks: "default"` beta handles model refusals.

## 12. Testing and Definition of Done

**Expectations:**
- **API:**
  - Unit-test pure logic (scoring, fallbacks, seed data) and guards.
  - Use `test/app.e2e-spec.ts` for HTTP wiring. It mocks Prisma, so no DB is needed.
  - Mock the Anthropic client in tests; tests must never call the real API.
- **Web:** Vitest for schemas, formatters and interactive components (e.g. `SwipeDeck.test.tsx`).

**A feature is done when:**
1. It works end to end on the demo path, with loading, empty and error states.
2. `lint` + `test` + `build` pass in every app touched (API: also `test:e2e`), and you ran them.
3. Schema changes have a committed migration, and the seed still runs.
4. New env vars are in `env.validation.ts` / `lib/env.ts` **and** `.env.example` with a comment.
5. The product principles (section 1) still hold: no hiring promises, no invented facts, demo data labeled.
6. Docs are updated if behavior or the formula changed (README, `docs/architecture.md`, this file).
7. Known limitations are written down, not hidden.

## 13. Security and environment

- Never commit `.env` files, API keys, secrets, or real personal data. Commit only `.env.example`, with blank secrets.
- Validate every env var with zod at boot (`api/src/config/env.validation.ts`, `web/src/lib/env.ts`). Optional values use `optionalString`, so a blank `KEY=` line counts as unset.
- Server Actions re-validate input with zod; anything from the browser is untrusted.
- Page guards (`auth()` in layouts) only hide pages; the API is the real authority.
- Never expose the access token to client components.
- `web/AGENTS.md` contains a block that `next dev` rewrites (`BEGIN/END:nextjs-agent-rules`). Never edit inside it.

## 14. Git and team workflow

- **Branches** (one per developer, see the plan): `feature/candidate-ui` (Dev 1), `feature/recruiter-ui` (Dev 2), `feature/mutual-match` (Dev 3), `feature/ai-bot` (Dev 4). Short-lived sub-branches off these are fine.
- `main` is protected: a PR is required, CI (`api (NestJS)` + `web (Next.js)`) must be green, and the branch must be up to date. No one can bypass this. Agents must never try to push to `main`. Commit or push only when asked. Never merge a PR without the team agreeing.
- **Schema/migration PRs come from Dev 3 only, and merge first.** After pulling one, run `pnpm install && pnpm prisma migrate dev` in `api/`.
- Commit `pnpm-lock.yaml` with any `package.json` change; CI installs with `--frozen-lockfile`.
- CI (`.github/workflows/ci.yml`) must be green before merging.
