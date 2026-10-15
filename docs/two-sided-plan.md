# Two-sided MATCHBACK — implementation plan

> Goal: turn MATCHBACK from candidate-only into a two-sided "Tinder for Jobs". Candidates swipe jobs, recruiters swipe candidates per job, and a **mutual match** is created only when both say LIKE.
> **Deadline:** U-Hackathon 2026, **16 Oct 2026 14:00 (Thailand)**. A working end-to-end demo beats feature count.
> **Contracts:** [api-contract.md](api-contract.md). Rules for every agent: [../AGENTS.md](../AGENTS.md).

## 1. What exists today (`main` @ `a036315`) — reuse, don't rebuild

| Area | Where | Reuse for |
|---|---|---|
| Auth: email/password + Google, JWT + rotating refresh, `AuthGuard` → `RolesGuard` | `api/src/auth`, `web/src/lib/auth.ts`, `web/src/proxy.ts` | Recruiter login: add the `RECRUITER` role and `@Roles` |
| Candidate swipe deck: drag, buttons, ← → keys, optimistic + rollback, LIKE/NOPE overlays | `web/src/components/features/jobs/SwipeDeck.tsx` | Generalize into a shared swipe stack for the recruiter deck (Dev 1) |
| Candidate swipes `JobInteraction(userId, jobId, LIKE/SKIP)` | `api/src/jobs/jobs.service.ts` `swipe()` | The candidate half of a mutual match, as-is |
| Deterministic score `calculateMatch(candidate, job)` with matched / unconfirmed / missing skills | `api/src/matching/match-score.ts` (+ 13 tests) | The recruiter deck's score too: same function, same inputs |
| AI explanation + resume coach with fallback | `api/src/infrastructure/ai/*`, `web/src/components/features/match/AiPanels.tsx` | The bot reuses `AiService` + the rules prompt |
| Profile (skills, text, preferences) | `api/src/candidates/*`, `/profile` | The data on `CandidateCard` |
| Saved jobs + self-reported application tracker | `api/src/applications/*`, `/saved`, `/applications` | Unchanged |
| Seed: 30 skills, 15 demo jobs (fictional companies), demo candidate, admin | `api/prisma/seed*.ts` | Add companies, a demo recruiter, a second candidate |
| CI: lint, test, e2e, build; migrations applied to an empty Postgres + drift check | `.github/workflows/ci.yml` | Unchanged. Every PR must be green. |
| `main` branch protection: PR required, CI required, up-to-date required, no bypass | GitHub settings | — |

**Not present yet:** recruiter role, companies, job ownership, recruiter swipes, mutual matches, a match modal, a matches page, the bot.

## 2. Proposed Prisma changes (Developer 3 — NOT applied yet)

One migration: `pnpm prisma migrate dev --name two_sided_matching`. All changes are additive, and existing rows keep working.

```prisma
enum Role {
  USER        // = candidate (kept to avoid migrating data and tokens)
  RECRUITER   // NEW
  ADMIN
}

model User {
  // ...existing fields
  /// NEW: recruiters belong to exactly one company. Always null for candidates.
  companyId            String?               @map("company_id") @db.Uuid
  company              Company?              @relation(fields: [companyId], references: [id], onDelete: SetNull)
  recruiterSwipes      CandidateInteraction[] @relation("RecruiterSwipes")
  receivedSwipes       CandidateInteraction[] @relation("CandidateSwiped")
  matches              Match[]
}

/// NEW
model Company {
  id          String   @id @default(uuid()) @db.Uuid
  name        String
  description String?
  website     String?
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(3)

  recruiters User[]
  jobs       Job[]

  @@map("companies")
}

model Job {
  // ...existing fields (keep `company` String as the display name — candidate UI reads it)
  /// NEW: owner. null = legacy row. The seed assigns every demo job to a demo company.
  companyId String?  @map("company_id") @db.Uuid
  /// relation is named `owner` because `company` is already the display-name string column
  owner     Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)
  /// NEW: closed jobs leave both decks
  isOpen    Boolean  @default(true) @map("is_open")

  candidateInteractions CandidateInteraction[]
  matches               Match[]
}

/// NEW: recruiter's decision on one candidate for one job. One decision per (job, candidate), whichever recruiter of the company made it.
model CandidateInteraction {
  jobId       String         @map("job_id")
  candidateId String         @map("candidate_id") @db.Uuid
  recruiterId String         @map("recruiter_id") @db.Uuid
  direction   SwipeDirection
  createdAt   DateTime       @default(now()) @map("created_at") @db.Timestamptz(3)

  job       Job  @relation(fields: [jobId], references: [id], onDelete: Cascade)
  candidate User @relation("CandidateSwiped", fields: [candidateId], references: [id], onDelete: Cascade)
  recruiter User @relation("RecruiterSwipes", fields: [recruiterId], references: [id], onDelete: Cascade)

  @@id([jobId, candidateId])
  @@map("candidate_interactions")
}

/// NEW: created only by the swipe services, never by a client request
model Match {
  id          String   @id @default(uuid()) @db.Uuid
  jobId       String   @map("job_id")
  candidateId String   @map("candidate_id") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(3)

  job       Job  @relation(fields: [jobId], references: [id], onDelete: Cascade)
  candidate User @relation(fields: [candidateId], references: [id], onDelete: Cascade)

  @@unique([candidateId, jobId])
  @@index([jobId])
  @@map("matches")
}
```

**Reused, not duplicated:** the candidate side stays in the existing `JobInteraction` table. There is no new candidate-swipe table.

**Seed additions** (stable ids; must stay idempotent):
- One `Company` per demo company name, linked to its demo jobs.
- A demo recruiter (`SEED_RECRUITER_EMAIL` / `SEED_RECRUITER_PASSWORD`) in the company that owns `job-001` and `job-002`.
- A second demo candidate who has **already liked `job-001`**. When the recruiter likes them in the demo, a real match is created on stage.

## 3. Authentication and authorization requirements

| Rule | How |
|---|---|
| Role is chosen at sign-up: candidate or recruiter. Never admin. | `RegisterDto.accountType` with `@IsIn(['CANDIDATE','RECRUITER'])` → maps to `USER`/`RECRUITER`. Google sign-up → `USER`. |
| Candidate-only endpoints | Add `@Roles(Role.USER)` to `jobs` discover/swipe, `candidates`, `applications`, `resume`, `matching`, `assistant` |
| Recruiter-only endpoints | `@Roles(Role.RECRUITER)` on the `companies` and `recruiter` controllers |
| **Job ownership** on every recruiter job route | `job.companyId === caller.companyId` (load `companyId` from the DB, not from the token). Mismatch → 404 `JOB_NOT_FOUND`. |
| Recruiter without a company | 409 `COMPANY_REQUIRED` on job routes. The web sends them to `/recruiter/company`. |
| Candidate privacy before a match | `CandidateCard` has no email, no surname and no user metadata. Contact details only in `MutualMatch`. |
| Don't leak likes | The recruiter deck never says whether a candidate liked the job |
| No client-created matches | No POST `/matches`. Matches are created only inside the two swipe services. |
| Web route guards | `(app)/recruiter/layout.tsx` redirects non-recruiters. Candidate pages redirect recruiters to `/recruiter`. These only hide pages; the API is the authority. |
| Role changes | The role is in the access token. A role change takes effect on the next refresh (≤ 15 min) or a re-login. |

## 4. File ownership (4 developers in parallel)

Each developer works **only** in their own files. A change in someone else's file goes through that owner: ask in chat or leave a PR comment. Shared files have one owner, and others propose diffs.

### Developer 1 — Candidate UI · `feature/candidate-ui`
- `web/src/app/(app)/discover/**`, `jobs/[id]/**`, `profile/**`, `saved/**`, `applications/**`, `matches/**` (NEW, candidate view)
- `web/src/components/features/jobs/**`, `profile/**`, `applications/**`
- **NEW shared components Dev 1 builds first** (Dev 2 consumes them):
  - `web/src/components/features/swipe/SwipeStack.tsx` — generic stack extracted from `SwipeDeck`: `items`, `renderCard(item)`, `onDecide(item, direction) → Promise<SwipeResult | {error}>`, LIKE/NOPE overlays, exit animation, keyboard.
  - `web/src/components/features/match/MatchModal.tsx` — "It's a Match!" dialog that takes a `MutualMatch`
- `web/src/app/(app)/layout.tsx`, `web/src/components/layout/AppHeader.tsx` (role-aware nav)
- `web/src/lib/actions/jobs.action.ts`, `profile.action.ts`, `applications.action.ts`
- `web/src/lib/api/jobs.api.ts`, `candidates.api.ts`, `applications.api.ts`, `matches.api.ts` (NEW)

### Developer 2 — Recruiter UI · `feature/recruiter-ui`
- `web/src/app/(app)/recruiter/**` (NEW): `layout.tsx` (role guard + sub-nav), `page.tsx` (job list), `company/`, `jobs/new/`, `jobs/[jobId]/` (candidate deck), `jobs/[jobId]/matches/`
- `web/src/components/features/recruiter/**` (NEW): `CandidateCard.tsx`, `JobForm.tsx`, `CompanyForm.tsx`
- `web/src/lib/actions/recruiter.action.ts`, `web/src/lib/api/recruiter.api.ts` (NEW)
- `web/src/app/(auth)/signup/**` + `components/features/auth/SignupForm.tsx` (account type picker)
- Builds the deck from Dev 1's `SwipeStack` + `MatchModal`. Until they land, use a local placeholder, never a copy-pasted fork.

### Developer 3 — Backend & DB · `feature/mutual-match`
- `api/prisma/schema.prisma`, `api/prisma/migrations/**`, `api/prisma/seed.ts`, `api/prisma/seed-data.ts` — **the only person who creates migrations**
- `api/src/companies/**`, `api/src/recruiter/**`, `api/src/matches/**` (NEW)
- `api/src/jobs/**` (swipe → `SwipeResult`, `isOpen` filter), `api/src/auth/dto/register.dto.ts` + the role mapping in `auth.service.ts`
- `@Roles` additions on existing controllers
- `api/src/app.module.ts` (each new module adds only its own import line)
- `docs/api-contract.md` and `web/src/lib/api/api.type.ts` (contract types)
- `test/app.e2e-spec.ts`: ownership, role and mutual-match e2e cases

### Developer 4 — AI & Bot · `feature/ai-bot`
- `api/src/infrastructure/ai/**`, `api/src/matching/**` (score + explanation), `api/src/resume/**`, `api/src/assistant/**` (NEW)
- `web/src/components/features/match/AiPanels.tsx`, `web/src/components/features/assistant/**` (NEW floating bot)
- `web/src/lib/actions/assistant.action.ts`, `web/src/lib/api/assistant.api.ts` (NEW)
- Mounting the bot: one line in `(app)/layout.tsx`. Ask Dev 1 to add it, or add it in a PR that touches only that line.
- If the score formula changes: update `match-score.spec.ts` and `docs/architecture.md` in the same PR. Dev 3's recruiter deck imports `calculateMatch` read-only.

### Shared / protected (announce before touching)

| File | Rule |
|---|---|
| `api/prisma/schema.prisma` + migrations | Dev 3 only. Its own PR, merged first. Everyone then runs `pnpm install && pnpm prisma migrate dev`. |
| `web/src/lib/api/api.type.ts`, `docs/api-contract.md` | Dev 3 owns. Contract changes go in a small PR with a team announcement. |
| `api/src/app.module.ts` | Add only your own import line. Don't reorder it. |
| `web/src/app/(app)/layout.tsx`, `AppHeader.tsx`, `globals.css` | Dev 1 owns |
| `package.json` / `pnpm-lock.yaml` (either app) | Dependency changes go in their own small PR. Avoid new dependencies. |
| `AGENTS.md`, `docs/*.md` | Change only with team agreement |

## 5. Implementation order (critical path first)

1. **Dev 3 — PR 1 (target: first ~2–3 h):** schema + migration + seed (companies, demo recruiter, second candidate) + `RECRUITER` role in `RegisterDto` + `@Roles` on candidate routes. Merge fast; everyone rebases.
2. **In parallel, from the contract (no waiting):**
   - Dev 1: `SwipeStack` + `MatchModal` extraction (PR early so Dev 2 can use them), then `/matches`.
   - Dev 2: recruiter pages against `recruiter.api.ts` with typed stubs. Swap to real calls when Dev 3 PR 2 lands.
   - Dev 4: `/assistant/messages` + the floating bot, then compatibility-explanation improvements.
3. **Dev 3 — PR 2:** recruiter endpoints + mutual-match creation in both swipes + `/matches`, with e2e tests for ownership (404), role (403) and the double-LIKE → single match path.
4. **Deployment (today, in parallel):** Dev 3 deploys API + DB, Dev 1 deploys the web (section 5b). The team lead registers on the Hub.
5. **Integration (last ~4 h before the deadline):** walk the demo script end to end on a fresh `migrate reset` DB. Freeze features 2 h before 14:00.

**Demo script:**
1. As the candidate: log in → Discover → like `job-001` → no match yet (the recruiter hasn't liked).
2. As the recruiter: open `job-001` deck → like that candidate → **It's a Match!**
3. Both `/matches` pages show the match. Ask the bot "How do I prepare for this interview?"

## 5b. Deployment and submission (required by the official participant guide)

Judges must be able to open a **deployed demo website** and use the real product. **Step-by-step guide: [deploy.md](deploy.md)** (with [`render.yaml`](../render.yaml)). A localhost demo does not count. **Deploy the current `main` today** so hosting problems show up early, then let every merge redeploy.

| Piece | Suggested host | Owner | Notes |
|---|---|---|---|
| Postgres | Neon (free) | Dev 3 | `DATABASE_URL` for the API. The deploy runs `pnpm prisma migrate deploy && pnpm db:seed`. |
| API | Render or Railway (Root Directory `api`) | Dev 3 | Build: `pnpm install --frozen-lockfile && pnpm build`. Start: `pnpm prisma migrate deploy && pnpm start:prod`. See the API settings below. |
| Web | Vercel (Root Directory `web`) | Dev 1 | Set the Node version to 24 in project settings. See the web env vars below. |
| Pitch deck | Google Drive | whole team | Sharing: *Anyone with the link can view* |
| Hub registration | hub.team1.network | team lead | **Register on 15 Oct, as early as possible.** You can't submit until the organisers approve. Everyone's profile needs their full English name. |

**API host settings:**
- Set `NODE_VERSION=24.20.0` (the engines check rejects older versions).
- `NODE_ENV=production` **requires** `BREVO_API_KEY` + `MAIL_FROM`. Get a free Brevo key and verified sender early, or the API won't boot.
- Also set `FRONTEND_URL`, `ACCESS_TOKEN_SECRET`, `TRUST_PROXY`, `INTERNAL_API_SECRET`, `ANTHROPIC_API_KEY`, and the `SEED_*` demo passwords.

**Web env vars:** `API_URL` (the API's public URL), `AUTH_SECRET`, `AUTH_URL` (the Vercel URL — login silently fails without it), `INTERNAL_API_SECRET` (same value as the API).

**Judge access (must-have, Dev 1):** add "Try as candidate" / "Try as recruiter" buttons on `/login`.
- They sign in with the seeded demo accounts. The credentials come from **server-side web env vars**; never hardcode them in the repo or ship them to the browser.
- The demo accounts only hold demo data, and `pnpm db:seed` resets them. Fallback if there's no time: put the demo logins in the submission description.

**Submission checklist** (from the guide):
- [ ] Profiles show full names in English; registration approved (the Submit button is visible)
- [ ] Name, short description (≤ 280 chars, lead with the problem), full description
- [ ] Public repo link
- [ ] Demo website + deck links tested in a private window
- [ ] Screenshots
- [ ] Tech stack lists the partner tools **actually used**
- [ ] "Pre-existing idea or codebase" **ticked** (we started from a starter template)
- [ ] **Submit early (a first version on the 16th morning), then re-submit** after each change before 14:00. Judges see only the submitted version.

## 6. Must not break

- Login / refresh / logout, `AuthGuard` checks (suspended → 403, deleted → 401), `/admin`.
- `calculateMatch` behavior and its 13 tests. The candidate deck order and score display.
- AI fallback: with no `ANTHROPIC_API_KEY`, every AI endpoint still answers with `source: "fallback"`.
- `/discover` swipe → `INTERESTED` application → `/saved` → "I applied" → `/applications`.
- Seed idempotency, and `pnpm db:seed` resetting the demo state.
- CI green: lint, test, e2e, build, migration drift check.

## 7. Risks and blockers

| Risk | Mitigation |
|---|---|
| **Node ≥ 24.15 required** (`engineStrict`) — installs fail on older Node | Everyone runs `nvm install 24 && nvm use` before starting |
| Schema PR lands late and blocks Dev 2 | Contract + typed stubs let Dev 2 build first. Dev 3's PR 1 is the top priority. |
| Migration conflicts | Only Dev 3 runs `migrate dev`. Others never commit `prisma/migrations`. |
| Branch protection "require up to date" with 4 people merging forces many rebases close to the deadline | Keep PRs small. Consider turning off "Require branches to be up to date" in the last hours (CI stays required). |
| Shared-file merge conflicts (`app.module.ts`, `(app)/layout.tsx`, `api.type.ts`) | Ownership table above; one-line additions only |
| Recruiter sees candidate data | `CandidateCard` excludes email/surname. Only candidates with a profile appear. Say in the demo that this is opt-in by having a profile. |
| A race when both sides like at the same moment | Write-then-read algorithm + unique constraint (contract §Mutual match rules). Covered by an e2e test. |
| "Match" confused with a high score | The modal fires only on `SwipeResult.match`. Copy keeps "match score" (fit) separate from "It's a Match!" (mutual). |
| AI cost/latency during the live demo | Bot + explanations are throttled and fall back to rule-based text. Test once with the real key before the demo. |
| **U-Bot** official integration requested | **Resolved — not possible.** The official `ubot-user-guide.pdf` describes an end-user chat app (u.bot) with no API for other apps. The MATCHBACK Bot uses Claude via `AiService`. If the team uses u.bot as a tool, list it in the submission tech stack honestly. |
| Hub registration not approved in time | Register **on 15 Oct** as early as possible. Contact the organisers if it's still pending close to the deadline. |
| No deployed demo, or the deploy breaks at the last minute | Deploy `main` today. Every merge redeploys. Freeze features at ~12:00 on 16 Oct and test all links in a private window. |
| API won't boot in production | `NODE_ENV=production` requires Brevo mail env vars, and Node 24.15+ must be configured on the host. Both are covered in section 5b. |
| Free-tier API sleeps, so the first judge request is slow | `apiFetch` already retries for ~60 s. Open the site yourself right before judging to wake it. |
| `Job.company` (string) and `Company.name` drift | The seed and the recruiter job create both set them together. Remove the string after the hackathon. |

## 8. Verify the starter before starting

In `api/` (needs Postgres):

```bash
pnpm install && pnpm prisma migrate dev && pnpm db:seed
pnpm lint:check && pnpm test && pnpm test:e2e && pnpm build
pnpm start:dev
```

In `web/`:

```bash
pnpm install && pnpm lint && pnpm test && pnpm build
pnpm dev
```

Smoke: `curl localhost:8000/health` → `{"status":"ok"}`, then log in as `demo@matchback.dev` and swipe.
