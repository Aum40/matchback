# MATCHBACK

**Swipe smart. Apply with confidence.**

MATCHBACK is an AI-assisted job discovery app for students, recent graduates and early-career professionals. You swipe through jobs, see an explainable match score for each one, and get help tailoring your resume before you apply. The goal is better applications, not just more of them.

> All jobs and companies in this repo are **demo data**. A match score describes how well a profile fits a job. It does **not** predict whether an employer will respond.

- **api/**: NestJS 11 + Prisma 7 + PostgreSQL. It owns the deterministic match score and the AI calls, and falls back to rule-based text when there is no API key.
- **web/**: Next.js 16 + next-auth v5 + Tailwind/shadcn. It is mobile-first.
> **In progress:** two-sided matching — recruiters swipe candidates per job, and a match needs both sides to say LIKE. See [docs/two-sided-plan.md](docs/two-sided-plan.md) for the plan and team file ownership, and [docs/api-contract.md](docs/api-contract.md) for the contract.

- [AGENTS.md](AGENTS.md) holds the rules for humans and AI agents. [docs/architecture.md](docs/architecture.md) covers the modules, data flow and the scoring formula.

| Route | What it does | Status |
|---|---|---|
| `/` | Landing page, plus sample jobs fetched from the API | ✅ |
| `/login`, `/signup` | Email/password login (Google login is optional) | ✅ |
| `/discover` | Swipe deck: drag, buttons or ← / → keys | ✅ |
| `/jobs/[id]` | Job detail, match analysis, AI explanation and resume coach | ✅ (AI needs a key) |
| `/profile` | Skills, education, experience, projects and preferences | ✅ |
| `/saved` | Jobs you swiped right on; mark them as applied | ✅ |
| `/applications` | Status, notes and employer feedback, all entered by you | ✅ |
| `/admin` | Admin user management (from the starter) | ✅ |

## Requirements

- **Node 24.15 or later** (24.x). In the repo root, `nvm use` reads `.nvmrc`. Installs fail on other versions.
- **pnpm 11.8.0**: run `corepack enable`.
- **PostgreSQL 15 or later**: local, Docker (`docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:17`), Neon or Supabase.

## Setup

### 1. API

```bash
cd api
cp .env.example .env
```

Fill in `api/.env`:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Postgres URL (the database is created by `migrate dev`) |
| `ACCESS_TOKEN_SECRET` | A random string of 32+ characters: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `SEED_DEMO_PASSWORD` | Password for the demo candidate (`demo@matchback.dev`) — 8+ characters with upper, lower, a number and a symbol |
| `SEED_ADMIN_PASSWORD` | Optional: creates an admin account |
| `ANTHROPIC_API_KEY` | Optional: enables AI explanations and the resume coach. Without it you get rule-based suggestions. |
| `GOOGLE_CLIENT_ID` | Optional: Google login |

```bash
pnpm install              # also generates the Prisma client
pnpm prisma migrate dev   # creates the tables
pnpm db:seed              # 30 skills, 15 demo jobs, demo + admin accounts
pnpm start:dev            # http://localhost:8000/health → {"status":"ok"}
```

### 2. Web

```bash
cd web
cp .env.example .env      # set AUTH_SECRET: pnpm dlx auth secret
pnpm install
pnpm dev                  # http://localhost:3000
```

Log in as `demo@matchback.dev` with your `SEED_DEMO_PASSWORD`. The demo profile is set up on purpose to show all three skill states (matched, not enough information, gap). Open **Frontend Developer (Next.js)** to see this, then add TypeScript and Next.js on `/profile` and watch the score change.

> Running a production build locally (`pnpm build && pnpm start`)? Set `AUTH_URL=http://localhost:3000` in `web/.env`. Without it, login silently bounces back to `/login`.

## Everyday commands

Always use pnpm, never `npx`. Run commands inside `api/` or `web/`.

| | api | web |
|---|---|---|
| Dev | `pnpm start:dev` | `pnpm dev` |
| Lint | `pnpm lint` | `pnpm lint` |
| Test | `pnpm test` · `pnpm test:e2e` (no DB needed) | `pnpm test` |
| Build | `pnpm build` | `pnpm build` |
| New migration | `pnpm prisma migrate dev --name <change>` | — |
| Re-seed / reset the demo | `pnpm db:seed` | — |
| Browse the DB | `pnpm prisma studio` | — |

## Team setup

1. One person creates the GitHub repo and invites teammates under **Settings → Collaborators**.
2. Each teammate clones it and follows **Setup**. Each person needs their own Postgres database and `.env` files, which are never committed.
3. Work on branches and open PRs into `main`. CI (lint, test, build, plus a migration check on a throwaway Postgres) must pass before merging.
4. After pulling a schema change, run `pnpm install && pnpm prisma migrate dev` in `api/`.

## Deploying

- **API:** run `pnpm build && pnpm prisma migrate deploy && pnpm db:seed`, then `pnpm start:prod`. Set:
  - `NODE_ENV=production` and the Brevo mail settings (`BREVO_API_KEY` and `MAIL_FROM`, required in production)
  - `TRUST_PROXY` and `INTERNAL_API_SECRET`
  - optionally `ANTHROPIC_API_KEY`
- **Web:** set `AUTH_URL` to the public URL, and set `INTERNAL_API_SECRET` to the same value as the API.
