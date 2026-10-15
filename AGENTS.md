# MATCHBACK agent guide

> **Swipe smart. Match better.**

This is the canonical source of product and engineering rules for MATCHBACK. Read it before changing the repository. `api/CLAUDE.md`, `api/AGENTS.md`, `web/CLAUDE.md`, and `web/AGENTS.md` are stubs that import this file; add shared rules here, not to the stubs.

## 1. Product specification

MATCHBACK is a two-sided, AI-assisted "Tinder for Jobs" for university students, recent graduates, early-career professionals, and recruiters.

**Problem we solve:** early-career job seekers apply to many jobs, hear nothing back, and can't tell whether their skills fit or how to improve their resume. **Principle: help candidates make better applications, not just more applications.**

- Candidates discover jobs and swipe left to PASS or right to LIKE.
- Recruiters choose one of their jobs and swipe left to PASS or right to LIKE candidate cards.
- A **mutual match** exists only when both sides LIKE the same candidate/job pair.
- The deterministic compatibility score describes profile fit. It is never a mutual match, a hiring probability, or a promise of an employer response.
- Candidate likes do not submit job applications. The existing application tracker remains self-reported by the candidate.
- UI copy must never say "chance", "probability", or "likelihood of getting hired", and must never show the score as a percentage (`%`).
- Seeded jobs and companies are fictional demo data. Seeded company names end in `(demo)`. They must never be presented as real vacancies, and the UI must show a `Demo data` label. Recruiter-created records are recruiter-owned data, not seeded demo data; if fictional records are created for the hackathon walkthrough, they must be explicitly marked as demo records too.

The hackathon deadline is **16 October 2026 at 14:00 ICT**. A small, working end-to-end demo is more important than extra features.

### Submission

Judges score exactly the submitted version and require a public repository, a deployed demo website with demo-account access, and a viewable pitch deck. If anything changes after submission, submit again before the deadline. List only partner tools actually used. This repository started from a pre-existing starter template; report that honestly.

- Test every submitted link in a private/incognito window.
- The pitch deck's Google Drive sharing must be set to *Anyone with the link can view*.
- U-Bot (https://u.bot) is an end-user chat app with no API for third-party apps (per the official `ubot-user-guide.pdf`), so it can't be integrated into the product. If the team uses u.bot as a tool (drafting, U-Code prototypes), list U-Bot in the submission tech stack and say exactly what it was used for. Never claim an in-app integration.

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

`main` currently implements email/password and optional Google auth, public health/jobs/skills endpoints, candidate profiles, candidate job discovery/swipes, deterministic match analysis, AI/fallback explanation, Resume Coach, saved jobs, self-reported applications, and admin user management. The data layer for the two-sided product is in place: the `RECRUITER` role (chosen at sign-up via `accountType`), `Company`, job ownership (`Job.companyId`), job `status` (only `PUBLISHED` is visible to candidates), and the `CandidateInteraction` and `Match` tables, with `@Roles(Role.USER)` on candidate routes. The API also implements company profiles, recruiter job management, the per-job candidate deck, recruiter swipes, mutual-match creation in both swipe directions (`MatchesService.syncMatch`), and `GET /matches`. It does not yet implement the recruiter and matches web pages, or MATCHBACK Bot. Those are planned changes and must be labeled as planned until they land.

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

- **Toolchain enforcement:** `engineStrict: true` lives in each app's `pnpm-workspace.yaml`, because pnpm 11 ignores `engine-strict` in `.npmrc`. Installing or running scripts on the wrong Node version **fails rather than warns**. Use `nvm use` (reads `.nvmrc`); don't bypass it.
- The committed `pnpm-lock.yaml` files are the real version pins. `next`, `react`, `react-dom` and `next-auth` are pinned exactly. next-auth v5 is beta, so don't bump it casually.

### Repo map

```
api/
  prisma/schema.prisma           data model (source of truth); migrations/ are committed, never edit an applied one
  prisma/seed-data.ts, seed.ts   fictional demo data with stable ids; idempotent seed
  src/config/env.validation.ts   every env var, validated with zod at boot
  src/matching/match-score.ts    deterministic score (pure function, tested)
  src/infrastructure/ai/         AiService + fallback + output schemas (the only AI client)
  src/auth/ users/ admin/        login, tokens, guards, admin
  src/candidates/ jobs/ resume/ applications/   candidate side
  src/companies/ recruiter/ matches/ assistant/ (planned) recruiter side, mutual matches, bot
  src/common/                    decorators (@Public @Roles @CurrentUser @Trim @NormalizeEmail @StrongPassword), throttle presets, PrismaExceptionFilter
web/
  src/lib/api/                   apiFetch + ApiError + one *.api.ts per API area + api.type.ts
  src/lib/actions/               Server Actions (all mutations)
  src/lib/auth.ts, proxy.ts      next-auth config; access-token refresh
  src/app/(auth)/ (app)/         login/signup; logged-in pages (recruiter area planned under (app)/recruiter)
docs/                            api-contract, team-ownership, two-sided-plan, architecture, deploy
render.yaml                      Render Blueprint for the API (see docs/deploy.md)
```

## 5. Architecture boundaries

- The browser never calls the API directly. Next.js Server Components read through `web/src/lib/api/*.api.ts`; mutations go through Server Actions in `web/src/lib/actions/`; `apiFetch` adds the bearer token.
- CORS is off on purpose. When a request made with a `token` gets `401` (or `403 ACCOUNT_SUSPENDED`), `apiFetch` redirects to `/session-expired`, which revokes the refresh token and signs out. Don't catch that redirect.
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
- Server Actions re-validate their input with zod; anything from the browser is untrusted.
- Page guards (`auth()` in layouts) only hide pages. The API is the real authority — never skip a server-side check because the UI hides a button.
- Never expose the access token to client components. `/api/auth/session` strips it; don't add `useSession` code that depends on it.
- Validate every env var with zod at boot (`api/src/config/env.validation.ts`, `web/src/lib/env.ts`). Optional values use `optionalString`, so a blank `KEY=` line counts as unset.
- `web/AGENTS.md` contains a block between `BEGIN:nextjs-agent-rules` and `END:nextjs-agent-rules` that `next dev` rewrites. Never edit inside it.
- The score is deterministic profile fit from 0 to 100. AI explains the score and recommends evidence-based improvements; it never calculates, changes, or presents the score as hiring probability. A score is never a mutual match. Unconfirmed skills use only `MENTIONED_IN_PROFILE` or `NO_SKILLS_LISTED`; these reason codes remain distinct from confirmed `missingSkills`.

## 7. Data and matching rules

- Change Prisma schema only through `pnpm prisma migrate dev --name <change>` and commit the migration. Never use `db push` for committed work or edit an applied migration.
- CI applies every migration to an empty Postgres and fails if the result drifts from `schema.prisma`.
- The Prisma client is generated into `api/src/database/generated/` (gitignored) by `postinstall`. If types are missing after a pull, run `pnpm prisma generate`.
- New demo data goes in `prisma/seed-data.ts`. `src/database/seed-data.spec.ts` checks it (ids exist, companies marked `(demo)`, and the demo profile shows all three skill states).
- Stable seed ids remain slugs such as `typescript` and `job-001`. Seed data must be idempotent and fictional.
- `User` is soft-deleted; filter `deletedAt: null` and use `PUBLIC_USER_SELECT`, never a raw user row.
- The current score is deterministic and pure: `score = round(70 * requiredRatio + 15 * niceToHaveRatio + 15 * preferenceFit)`, clamped to 0-100. Only listed candidate skills count; matched, unconfirmed, and missing skills remain distinct. Unknown preferences count as a neutral 0.5. When the formula changes, update `match-score.spec.ts` and `docs/architecture.md` in the same PR.
- A candidate LIKE currently creates or preserves an `INTERESTED` self-tracker entry; it does not submit an application and must not be described as one.
- `Job.status` is `DRAFT`, `PUBLISHED` or `CLOSED` (migration `two_sided_matching` backfilled pre-existing rows to `PUBLISHED`); recruiter-created jobs start as `DRAFT`; only `PUBLISHED` jobs appear in candidate discovery; recruiters may manage their own jobs in every status. `isDemo` labels fictional data and never controls visibility.

## 8. Workflow and definition of done

- Read the relevant code and tests before editing. Stay within [docs/team-ownership.md](docs/team-ownership.md); ask the owner before crossing a boundary.
- **Prefer the smallest complete solution.** Don't add dependencies, abstractions or rewrites unless the task needs them. If a new dependency is necessary, say why, and put it in its own small PR.
- Preserve working behavior and provide loading, empty, and error states for every new UI state. Every swipe has a button and keyboard alternative.
- Keep UI copy short, plain, and in English. Use theme tokens; do not rely on color alone. Non-obvious code comments are written in Thai to match the repository.
- Use PascalCase React components, plural kebab-case module directories, and DTO file names matching their class names.
- After code changes, run lint, test, and build for every touched app; API changes also run `pnpm test:e2e`. **Never claim tests or builds passed unless you ran them in this session.** Report failures honestly, with the output.
- **Testing expectations:**
  - API: unit-test pure logic (scoring, fallbacks, seed data) and guards. `test/app.e2e-spec.ts` covers HTTP wiring with a mocked Prisma (no database needed). Add e2e cases for ownership (404), roles (403) and the double-LIKE → single-match path.
  - Web: Vitest for schemas, formatters and interactive components (e.g. `SwipeDeck.test.tsx`).
  - Tests must never call a real AI API. Mock the AI client.
- AI-generated text in the UI always shows its source: AI-generated (check it against your real experience) or rule-based fallback.
- **Definition of done** also requires:
  - schema changes have a committed migration and the seed still runs;
  - the product principles in section 1 still hold (no hiring promises, no invented facts, demo data labeled);
  - known limitations are written down.
- Update docs when behavior, score rules, security, schema, or API contracts change. Never hide unfinished work behind a finished-looking UI.
- Never commit `.env`, credentials, secrets, or real personal data. New environment variables require validation and an `.env.example` entry.
- Work on feature branches and use pull requests. Never push to `main` or bypass branch protection.

### Commands

**Use pnpm for everything — never `npx` or `npm run`.** `npx` can resolve a different Prisma/Nest version than the lockfile. Use `pnpm <script>`, `pnpm exec <bin>`, `pnpm prisma …`, and `pnpm dlx <pkg>` for one-off tools (e.g. `pnpm dlx shadcn@latest add dialog`).

| Task | API | Web |
|---|---|---|
| Install | `pnpm install` | `pnpm install` |
| Dev | `pnpm start:dev` | `pnpm dev` |
| Lint | `pnpm lint:check` | `pnpm lint` |
| Test | `pnpm test` / `pnpm test:e2e` | `pnpm test` |
| Build | `pnpm build` | `pnpm build` |
| Seed | `pnpm db:seed` (idempotent; resets the demo users' swipes) | - |
| New migration | `pnpm prisma migrate dev --name <change>` (Developer 3 only) | - |
| Reset DB | `pnpm prisma migrate reset` (drops data, re-seeds) | - |
| Regenerate client | `pnpm prisma generate` | - |

## 9. Documentation map

- `README.md`: setup, user-facing overview, and implemented/planned status.
- `docs/architecture.md`: current system and proposed two-sided architecture.
- `docs/api-contract.md`: shared request/response contract; update deliberately and keep web types aligned when implementation lands.
- `docs/team-ownership.md`: four developer ownership boundaries and integration points.
- `docs/two-sided-plan.md`: implementation order, deployment notes, proposed schema details, and risks.

## 10. Git and team workflow

- `main` is protected: a PR is required, CI must be green, and agents must not push directly to `main` or bypass branch protection.
- Schema and migration work comes from Developer 3 and merges first. Other developers do not edit `api/prisma/migrations/**`.
- After pulling a schema change, run `pnpm install && pnpm prisma migrate dev` in `api/`.
- Branches: one per developer, as listed in [docs/team-ownership.md](docs/team-ownership.md) (`feature/candidate-ui`, `feature/recruiter-ui`, `feature/mutual-match`, `feature/ai-bot`).
- Commit or push only when asked. Never merge a PR without the team agreeing.
- Commit `pnpm-lock.yaml` with any `package.json` change; CI installs with `--frozen-lockfile`.
