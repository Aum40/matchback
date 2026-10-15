# MATCHBACK

**Swipe smart. Match better.**

MATCHBACK is a two-sided, AI-assisted Tinder for Jobs. Candidates swipe on jobs; recruiters choose a specific company job and swipe on candidate cards. A real mutual match exists only when both sides LIKE the same candidate/job pair.

The compatibility score is deterministic and explainable profile fit. AI explains the score and suggests improvements but never calculates or changes it. It is not a hiring probability, a promise of an employer response, or a mutual match. Candidate likes do not submit job applications.

All seeded jobs and companies are fictional demo data. The web labels them `Demo data`.

The UI is desktop-first and fully responsive. Tablet and mobile layouts remain usable. Swipe cards are text-first: MATCHBACK does not support candidate profile photos, company logos, image uploads, or image-based matching. Mouse dragging, touch swiping, Like/Pass buttons, and keyboard alternatives are supported.

## Product status

The repository is being prepared for the U-Hackathon 2026 AI Track, with a deadline of **16 October 2026 at 14:00 ICT**. The current `main` branch is the candidate-side foundation; the two-sided target is documented before parallel implementation begins.

### Implemented on `main`

- Email/password authentication and optional Google login.
- Candidate profile with skills, education, experience, projects, and preferences.
- Public demo job and skill catalog.
- Candidate job discovery with drag, buttons, and keyboard swipes.
- Deterministic 0-100 compatibility score with matched, unconfirmed, and missing skill explanations.
- AI or deterministic-fallback match explanation.
- AI or deterministic-fallback Resume Coach.
- Saved jobs and a self-reported application tracker.
- Admin user management from the starter project.

### Planned for the two-sided MVP

- Candidate and recruiter role selection at sign-up.
- Recruiter company profile and one-company ownership model.
- Recruiter job creation and management.
- Per-job recruiter candidate deck with privacy-safe `CandidateCard` data.
- Persisted recruiter swipes and real mutual matches.
- Candidate and recruiter matches pages plus a backend-confirmed match celebration modal.
- MATCHBACK Bot: a contextual AI career assistant with a deterministic fallback.

Planned features must remain labeled as planned until their API, UI, tests, and demo path are working. Official U-Bot integration is optional and blocked until official documentation, authorization, an endpoint, and credentials are verified. MATCHBACK Bot is not the official U-Bot.

## User experiences

### Candidate

1. Sign in and complete a profile.
2. Review job cards and inspect fit evidence.
3. Swipe left to PASS or right to LIKE. A LIKE only records interest; it does not submit an application.
4. Open job detail for the deterministic analysis, optional explanation, and Resume Coach.
5. Track any application status yourself.
6. See a mutual match only when an authorized recruiter also LIKEs the same job.

### Recruiter

1. Sign in with the recruiter role.
2. Create or edit the recruiter's company profile.
3. Create and manage jobs belonging to that company.
4. Select one job before browsing candidates.
5. Swipe left to PASS or right to LIKE a privacy-safe candidate card for that job.
6. See mutual matches for the recruiter's own jobs. Email and full name are revealed only after a mutual match.

Human-to-human candidate/recruiter chat is out of scope. The MATCHBACK Bot is the only chat experience.

### Job visibility

The current `main` schema has no publication-state field, so its seeded demo jobs are treated as visible sample jobs. The proposed recruiter model adds `status: DRAFT | PUBLISHED | CLOSED`:

- Recruiter-created jobs start as `DRAFT` and are not shown to candidates.
- Only `PUBLISHED` jobs appear in candidate discovery and public job browsing.
- `CLOSED` jobs are hidden from candidate discovery but remain manageable by their owning recruiter.
- Existing seeded jobs are backfilled or treated as `PUBLISHED` for compatibility.
- `isDemo` identifies fictional demo data; it does not control visibility. Seeded demo jobs must never be presented as real vacancies.

## Repository structure

```text
api/                         NestJS REST API, Prisma schema, scoring, AI service
web/                         Next.js App Router UI and server-side API calls
docs/architecture.md         Current and proposed architecture
docs/api-contract.md         Shared live/proposed HTTP contract
docs/team-ownership.md       Four-developer ownership and integration points
docs/two-sided-plan.md       Proposed schema, sequence, and risk notes
```

## Stack and requirements

- Node `>=24.15 <25` and pnpm `11.8.0`.
- Web: Next.js `16.3.8`, React `19.2.4`, TypeScript, Tailwind CSS 4, and shadcn/Base UI.
- API: NestJS `11.2.x`, Prisma `7.9.x`, PostgreSQL, REST, and class-validator DTOs.
- AI: `@anthropic-ai/sdk` behind the API's `AiService`; no API key is exposed to the web.

Use `nvm use` before installing. API and web are independent projects with their own lockfiles; run commands inside the relevant directory. Always use pnpm.

## Setup

### API

```bash
cd api
cp .env.example .env
pnpm install
pnpm prisma migrate dev
pnpm db:seed
pnpm start:dev
```

The API runs at `http://localhost:8000`; health is `GET /health`.

Required local configuration includes `DATABASE_URL`, `ACCESS_TOKEN_SECRET`, and `SEED_DEMO_PASSWORD`. `ANTHROPIC_API_KEY` is optional; without it, explanations and Resume Coach use rule-based fallback output. Google and mail configuration are optional according to `api/.env.example`.

### Web

```bash
cd web
cp .env.example .env
pnpm install
pnpm dev
```

The web runs at `http://localhost:3000`. Set the API URL and auth settings described in `web/.env.example`.

Log in with the seeded demo candidate account configured by `SEED_DEMO_PASSWORD`. The seed is designed to show matched, unconfirmed, and missing skill states.

## Commands

| | API | Web |
|---|---|---|
| Development | `pnpm start:dev` | `pnpm dev` |
| Lint | `pnpm lint:check` | `pnpm lint` |
| Tests | `pnpm test` and `pnpm test:e2e` | `pnpm test` |
| Build | `pnpm build` | `pnpm build` |
| Database seed | `pnpm db:seed` | - |
| New migration | `pnpm prisma migrate dev --name <change>` | - |

## Team workflow

Work on feature branches and open pull requests into protected `main`. CI must pass before merging. Schema and migration changes land through Developer 3 first. See [docs/team-ownership.md](docs/team-ownership.md) for file boundaries and [docs/api-contract.md](docs/api-contract.md) for the shared integration contract.

Never commit `.env` files, API keys, secrets, or real personal data. Do not push directly to `main`.
