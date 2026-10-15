# MATCHBACK agent guide

> **Swipe smart. Match better.**

This is the canonical source of product and engineering rules for MATCHBACK. Read it before changing the repository. `api/CLAUDE.md`, `api/AGENTS.md`, `web/CLAUDE.md`, and `web/AGENTS.md` are stubs that import this file; add shared rules here, not to the stubs.

## 1. Product specification

MATCHBACK is a two-sided, AI-assisted "Tinder for Jobs" for university students, recent graduates, early-career professionals, and recruiters.

- Candidates discover jobs and swipe left to PASS or right to LIKE.
- Recruiters choose one of their jobs and swipe left to PASS or right to LIKE candidate cards.
- A **mutual match** exists only when both sides LIKE the same candidate/job pair.
- The deterministic compatibility score describes profile fit. It is never a mutual match, a hiring probability, or a promise of an employer response.
- Candidate likes do not submit job applications. The existing application tracker remains self-reported by the candidate.
- Seeded jobs and companies are fictional demo data. They must never be presented as real vacancies, and the UI must show a `Demo data` label. Recruiter-created records are recruiter-owned data, not seeded demo data; if fictional records are created for the hackathon walkthrough, they must be explicitly marked as demo records too.

The hackathon deadline is **16 October 2026 at 14:00 ICT**. A small, working end-to-end demo is more important than extra features.

### Submission

Judges score exactly the submitted version and require a public repository, a deployed demo website with demo-account access, and a viewable pitch deck. If anything changes after submission, submit again before the deadline. List only partner tools actually used. This repository started from a pre-existing starter template; report that honestly.

### Candidate experience

The candidate MVP includes authentication, profile editing, skills, education, experience, projects, a desktop-first fully responsive job swipe deck, deterministic compatibility analysis, AI explanation, Resume Coach, saved jobs, self-reported application tracking, and a mutual matches page.

### Design requirements

- Desktop is the primary design target. Tablet and mobile layouts remain usable and responsive.
- Swipe cards are text-first. Do not add candidate profile photos, company logos, image uploads, avatar uploads, or image-based matching.
- Support mouse dragging and touch swiping. Keep visible Like/Pass buttons and keyboard-accessible alternatives.
- Use text, labels, and icons in addition to color; every page and interaction has loading, empty, error, and permission states.

### Recruiter experience

The recruiter MVP includes recruiter authentication, one company profile per recruiter, job creation and management, a per-job candidate swipe deck, and a recruiter mutual matches page. Recruiters may access and swipe only on jobs owned by their company.

### Mutual matching rules

For `(candidateId, jobId)`, the backend creates a match only when both records exist:

1. The candidate has a `JobInteraction` with `direction = LIKE`.
2. An authorized recruiter of the job's company has a `CandidateInteraction` with `direction = LIKE`.

Matches are created only inside the two swipe services. Clients cannot create, delete, or un-match them. Persist each swipe, enforce one match per candidate/job pair, and use the write-then-read algorithm plus a database uniqueness constraint so simultaneous swipes are safe and idempotent. A later SKIP does not remove an existing match.

Both swipe endpoints return `matchCreated`, `isMatched`, and `matchId`. `matchCreated` is true only when this request inserts a new match row. `isMatched` is true whenever the mutual match already exists, including a retry or a later SKIP. `matchId` is non-null whenever `isMatched` is true. Duplicate swipes use idempotent upserts and never create duplicate interactions or matches. The UI shows "It's a Match!" only when `matchCreated` is true; a retry with `isMatched` true refreshes the match instead of replaying the creation celebration.

Before a match, a recruiter receives only a `CandidateCard`: first name, profile text, listed skills, and deterministic fit summary. Do not reveal email, full name, or whether the candidate liked the job. Contact details may be returned only after a mutual match.

### AI requirements

- Compatibility is calculated by deterministic server code; AI may explain it but never score or re-score it.
- Use only candidate-provided facts. Never invent skills, experience, achievements, employers, numbers, or qualifications.
- Missing profile information is not a skill gap. Label it as "not enough information" or unconfirmed.
- Resume Coach may suggest clearer wording, relevant evidence, skills, or projects, but must not fabricate achievements or experience.
- MATCHBACK Bot is a candidate-only contextual career assistant for job fit, requirements, skill gaps, resume bullets, interview preparation, and career guidance. It is stateless: the web sends the conversation history, optionally with a job id.
- MATCHBACK Bot is candidate-facing in the hackathon MVP. Recruiter Bot access is out of scope unless a future API contract explicitly adds it.
- The NestJS API calls Google Gemini for explanations, skill-gap recommendations, Resume Coach, and the candidate-only MATCHBACK Bot. Gemini is called only after an explicit user action, is throttled, and receives the minimum profile/job data needed. The Gemini API key is stored only in a server-side environment variable and is never exposed to frontend code.
- Compatibility scoring remains deterministic server code on a 0-100 scale. Gemini may explain the score and recommend evidence-based improvements, but it never calculates or changes the score. The score is not hiring probability and is not a mutual match.
- AI output is validated against the known candidate profile and job facts. Never invent skills, experience, achievements, employers, numbers, or qualifications.
- No API key, timeout, API error, refusal, or invalid output may break the request. Return the deterministic fallback with `source: "fallback"`.
- MATCHBACK Bot requests are limited to 20 messages, 2,000 characters per message, and 20,000 total characters, with a 1,200-token output cap, one model call per request, throttling, and no conversation persistence.
- MATCHBACK does not use U-Bot. The MATCHBACK Bot is a separate candidate-only feature backed by Gemini through `AiService`.

## 2. Scope

### MVP priorities

1. Preserve the current candidate demo path: login -> discover -> job detail -> saved -> applications.
2. Add the smallest complete recruiter path: recruiter login -> company -> job -> candidate deck -> mutual matches.
3. Make mutual matching real, authorized, persisted, race-safe, and visible only after backend confirmation.
4. Keep compatibility explanations and Resume Coach useful, evidence-based, and safe. Add the Bot after the core swipe path works.

### Out of scope

- Direct candidate/recruiter human chat; the Bot is the only chat experience.
- Unmatching, blocking, or moderation workflows beyond existing account suspension.
- Multiple companies per recruiter, recruiter teams, or complex permissions.
- Job scraping, external job feeds, or employer integrations.
- Blockchain, payments, complex analytics dashboards, resume PDF parsing, email/push notification infrastructure, custom ML training, and a second auth system.
- U-Bot is not used in MATCHBACK; the candidate-only MATCHBACK Bot uses the documented Gemini-backed `AiService` path.

## 3. Current implementation status

`main` currently implements email/password and optional Google auth, public health/jobs/skills endpoints, candidate profiles, candidate job discovery/swipes, deterministic match analysis, AI/fallback explanation, Resume Coach, saved jobs, self-reported applications, and admin user management. It does not yet implement recruiter roles, companies, recruiter-owned jobs, recruiter swipes, explicit job publication states, mutual-match persistence/API, matches pages, or MATCHBACK Bot. Those are planned changes and must be labeled as planned until they land.

## 4. Technical stack

Use the versions declared by the repository manifests; do not add a second stack.

| Layer | Repository choice |
|---|---|
| Web | Next.js 16.3.8, React 19.2.4, TypeScript, Tailwind CSS 4, shadcn/Base UI |
| API | NestJS 11.2.x, REST, class-validator DTOs |
| Database | PostgreSQL, Prisma 7.9.x with `@prisma/adapter-pg` |
| Auth | next-auth 5.0.0-beta.32 on the web; JWT access tokens and rotating refresh tokens in the API |
| AI | Google Gemini API, isolated behind `api/src/infrastructure/ai/`, with deterministic fallback |
| Tests | Jest + supertest for API; Vitest + Testing Library for web |
| Package manager | pnpm 11.8.0 |
| Runtime | Node 24.x, `>=24.15 <25` |

API and web are independent projects with independent lockfiles. Run commands inside `api/` or `web/`; there is no root package.

## 5. Architecture boundaries

- The browser never calls the API directly. Next.js Server Components read through `web/src/lib/api/*.api.ts`; mutations go through Server Actions in `web/src/lib/actions/`; `apiFetch` adds the bearer token.
- The API owns authorization, scoring, skill classification, application rules, match creation, and the data sent to AI. The web does not recompute scores or infer matches.
- Controllers handle HTTP only. Business logic belongs in services; pure scoring and fallback logic must have no Nest or Prisma imports.
- Only `AiService` may call the Gemini client. Keep the Gemini API key server-side; frontend code must never import the client or read the key.
- Web response types are handwritten in `web/src/lib/api/api.type.ts`; do not import API source files into the web.
- [docs/team-ownership.md](docs/team-ownership.md) is authoritative for file ownership. [docs/api-contract.md](docs/api-contract.md) is authoritative for HTTP types and endpoint behavior. [docs/two-sided-plan.md](docs/two-sided-plan.md) contains implementation order and risk notes and must not contradict either file.

## 6. Security and API rules

- `USER` means candidate and is retained for compatibility with existing data and tokens. `RECRUITER` is the recruiter role. `ADMIN` is never self-assigned at sign-up.
- Every non-public route requires a bearer access token. Guards run in order: throttler -> `AuthGuard` -> `RolesGuard`.
- Use `@CurrentUser('sub')`; never accept the acting user id from a body. Scope user-owned queries by `userId` and return 404 for another user's resource.
- Recruiter routes must load the recruiter's company from the database and verify `job.companyId` against it. An unauthorized job must look like `JOB_NOT_FOUND` (404), not reveal ownership. Recruiter job management may access DRAFT, PUBLISHED, and CLOSED jobs; candidate decks and recruiter swipes require PUBLISHED and return `409 JOB_NOT_PUBLISHED` otherwise.
- Use global `ValidationPipe({ whitelist: true, transform: true })`. DTOs validate every body and query; trim free text, normalize emails, and transform numeric inputs.
- Errors use `{ statusCode, message, code? }`. Clients branch on stable `code`, never message text. Do not expose Prisma details.
- Never return password hashes, refresh-token data, deleted users, or internal ids to AI. Send no name/email/user id to AI prompts unless a future contract explicitly requires it.
- Candidate privacy before a mutual match is mandatory. Do not expose a recruiter's candidate deck decision or a candidate's job decision to the other side.
- AI endpoints are POST requests with the AI throttle and run only from explicit user actions.
- The score is deterministic profile fit from 0 to 100. AI explains the score and recommends evidence-based improvements; it never calculates, changes, or presents the score as hiring probability. A score is never a mutual match. Unconfirmed skills use only `MENTIONED_IN_PROFILE` or `NO_SKILLS_LISTED`; these reason codes remain distinct from confirmed `missingSkills`.

## 7. Data and matching rules

- Change Prisma schema only through `pnpm prisma migrate dev --name <change>` and commit the migration. Never use `db push` for committed work or edit an applied migration.
- Stable seed ids remain slugs such as `typescript` and `job-001`. Seed data must be idempotent and fictional.
- `User` is soft-deleted; filter `deletedAt: null` and use `PUBLIC_USER_SELECT`, never a raw user row.
- The current score is deterministic and pure: `score = round(70 * requiredRatio + 15 * niceToHaveRatio + 15 * preferenceFit)`, clamped to 0-100. Only listed candidate skills count; matched, unconfirmed, and missing skills remain distinct.
- A candidate LIKE currently creates or preserves an `INTERESTED` self-tracker entry; it does not submit an application and must not be described as one.
- Current `Job` rows have no publication field. The proposed recruiter model adds `status` with `DRAFT`, `PUBLISHED`, and `CLOSED`: existing seeded rows are backfilled/treated as `PUBLISHED`; recruiter-created jobs start as `DRAFT`; only `PUBLISHED` jobs appear in candidate discovery; recruiters may manage their own jobs in every status. `isDemo` labels fictional data and never controls visibility.

## 8. Workflow and definition of done

- Read the relevant code and tests before editing. Stay within [docs/team-ownership.md](docs/team-ownership.md); ask the owner before crossing a boundary.
- Preserve working behavior and provide loading, empty, and error states for every new UI state. Every swipe has a button and keyboard alternative.
- Keep UI copy short, plain, and in English. Use theme tokens; do not rely on color alone. Non-obvious code comments are written in Thai to match the repository.
- Use PascalCase React components, plural kebab-case module directories, and DTO file names matching their class names.
- After code changes, run lint, test, and build for every touched app; API changes also run `pnpm test:e2e`. Report failures honestly.
- Update docs when behavior, score rules, security, schema, or API contracts change. Never hide unfinished work behind a finished-looking UI.
- Never commit `.env`, credentials, secrets, or real personal data. New environment variables require validation and an `.env.example` entry.
- Work on feature branches and use pull requests. Never push to `main` or bypass branch protection.

### Commands

| Task | API | Web |
|---|---|---|
| Install | `pnpm install` | `pnpm install` |
| Dev | `pnpm start:dev` | `pnpm dev` |
| Lint | `pnpm lint:check` | `pnpm lint` |
| Test | `pnpm test` / `pnpm test:e2e` | `pnpm test` |
| Build | `pnpm build` | `pnpm build` |
| Seed | `pnpm db:seed` | - |

## 9. Documentation map

- `README.md`: setup, user-facing overview, and implemented/planned status.
- `docs/architecture.md`: current system and proposed two-sided architecture.
- `docs/api-contract.md`: shared request/response contract; update deliberately and keep web types aligned when implementation lands.
- `docs/team-ownership.md`: four developer ownership boundaries and integration points.
- `docs/two-sided-plan.md`: implementation order, deployment notes, proposed schema details, and risks.

## 10. Git and team workflow

- `main` is protected: a PR is required, CI must be green, and agents must not push directly to `main` or bypass branch protection.
- Schema and migration work comes from Developer 3 and merges first. Other developers do not edit `api/prisma/migrations/**`.
- Commit `pnpm-lock.yaml` with any `package.json` change; CI installs with `--frozen-lockfile`.
