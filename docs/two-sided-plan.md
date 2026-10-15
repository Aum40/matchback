# Two-sided MATCHBACK implementation plan

> This is the implementation sequence and risk register for the final product specification. [docs/team-ownership.md](team-ownership.md) is authoritative for ownership. [docs/api-contract.md](api-contract.md) is authoritative for HTTP behavior and shared types.
>
> Deadline: U-Hackathon 2026, 16 October 2026 at 14:00 ICT. A working end-to-end demo beats feature count.

## 1. Current main: reuse, do not rebuild

Implemented on main:

- Email/password and optional Google authentication with JWT access and rotating refresh tokens.
- Candidate profile and skills at GET/PUT /candidates/me.
- Public GET /health, GET /jobs, GET /jobs/:id, and GET /skills.
- Candidate discovery, deterministic match analysis, candidate swipes, and swipe reset.
- AI/fallback match explanation and Resume Coach.
- Saved jobs and the self-reported application tracker.
- Admin user listing and account status management.
- Desktop-first implementation target will apply to new and revised UI; existing layouts must remain usable on tablet/mobile.

Not present yet:

- RECRUITER role selection at sign-up.
- Company ownership and recruiter job management.
- Explicit DRAFT/PUBLISHED/CLOSED job visibility.
- Recruiter candidate deck and recruiter swipes.
- Mutual-match persistence and read-only matches API.
- Candidate/recruiter matches pages and match celebration modal.
- Candidate-facing MATCHBACK Bot; recruiter Bot access is out of scope for the MVP.

## 2. Proposed database changes: Developer 3 only

The current Prisma schema is unchanged on this documentation branch. The following are proposed and require a migration. No other developer creates or edits migrations.

~~~prisma
enum Role {
  USER        // existing candidate role name
  RECRUITER   // proposed
  ADMIN
}

enum JobStatus {
  DRAFT
  PUBLISHED
  CLOSED
}

model User {
  // existing fields
  companyId String? @map("company_id") @db.Uuid // proposed; null for candidates
  company Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)

  recruiterSwipes CandidateInteraction[] @relation("RecruiterSwipes")
  receivedSwipes CandidateInteraction[] @relation("CandidateSwiped")
  matches Match[]
}

model Company {
  id String @id @default(uuid()) @db.Uuid
  name String
  description String?
  website String?
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)

  recruiters User[]
  jobs Job[]

  @@map("companies")
}

model Job {
  // existing fields remain, including company display string and isDemo
  companyId String? @map("company_id") @db.Uuid // proposed owner relation
  owner Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)
  status JobStatus @default(DRAFT) // proposed publication state

  candidateInteractions CandidateInteraction[]
  matches Match[]
}

model CandidateInteraction {
  jobId String @map("job_id")
  candidateId String @map("candidate_id") @db.Uuid
  recruiterId String @map("recruiter_id") @db.Uuid
  direction SwipeDirection
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)

  job Job @relation(fields: [jobId], references: [id], onDelete: Cascade)
  candidate User @relation("CandidateSwiped", fields: [candidateId], references: [id], onDelete: Cascade)
  recruiter User @relation("RecruiterSwipes", fields: [recruiterId], references: [id], onDelete: Cascade)

  @@id([jobId, candidateId])
  @@map("candidate_interactions")
}

model Match {
  id String @id @default(uuid()) @db.Uuid
  jobId String @map("job_id")
  candidateId String @map("candidate_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)

  job Job @relation(fields: [jobId], references: [id], onDelete: Cascade)
  candidate User @relation(fields: [candidateId], references: [id], onDelete: Cascade)

  @@unique([candidateId, jobId])
  @@index([jobId])
  @@map("matches")
}
~~~

Schema mapping:

- The current Job model has no publication field. Existing seeded rows are backfilled or treated as PUBLISHED so the candidate demo remains intact.
- Recruiter-created jobs start as DRAFT. Only PUBLISHED jobs enter candidate discovery and public browsing. CLOSED jobs are hidden from candidates but remain manageable by their owner. Recruiter candidate decks and recruiter swipes require PUBLISHED; draft/closed requests return `409 JOB_NOT_PUBLISHED`.
- isDemo remains the fictional-data label and is not a visibility flag.
- The existing JobInteraction table remains the candidate-side decision table; no duplicate candidate-swipe table is added.
- CandidateInteraction has one decision per job/candidate pair, regardless of which authorized recruiter of the company made it.
- Match is created only by swipe services and is unique per candidate/job pair.

## 3. Authorization and privacy

- Register accountType accepts CANDIDATE or RECRUITER; ADMIN is never selectable. Google sign-up remains USER.
- Candidate routes require USER. Recruiter company/job/deck routes require RECRUITER. Admin routes remain ADMIN-only.
- Recruiter ownership is loaded from the database. A job outside the recruiter's company returns 404 JOB_NOT_FOUND.
- Recruiter without a company receives 409 COMPANY_REQUIRED for job routes.
- GET /users/me is the recruiter identity endpoint. There is no separate recruiter profile model.
- CandidateCard exposes first name, profile text, listed skills, and deterministic fit only. It has no photo, logo, email, surname/full name, or candidate LIKE/SKIP decision.
- There is no direct human chat, unmatching, blocking, team management, job scraping, real job feed, payments, resume PDF parsing, or official U-Bot integration.

## 4. Mutual-match sequence and retries

Both swipe services follow the same algorithm:

1. Commit the current interaction with an upsert.
2. Read the other side after the write commits.
3. If both sides LIKE, call createMany({ skipDuplicates: true }) for the unique candidate/job pair.
4. Use the inserted count to set matchCreated. Read the match id for isMatched and matchId.

Response semantics:

- matchCreated true only when this request inserts a new Match row.
- isMatched true whenever a Match row exists.
- matchId is non-null whenever isMatched is true.
- A retry may return matchCreated false with isMatched true and the existing matchId.
- A later SKIP never deletes an existing Match.
- Duplicate swipes are idempotent and cannot duplicate interactions, applications, or matches.
- The UI celebrates only matchCreated true. A retry refreshes the existing match instead of replaying creation.

There is no POST /matches. Race safety comes from the committed write, the read-after-write check, and the unique database constraint.

## 5. Ownership

See [docs/team-ownership.md](team-ownership.md). It is the only ownership source of truth and explicitly assigns:

- Developer 1: candidate pages, SwipeStack, MatchModal, shared app layouts.
- Developer 2: recruiter pages and SignupForm.tsx.
- Developer 3: API, Prisma, migrations, shared api.type.ts, and api-contract.md.
- Developer 4: AI, Resume Coach, AiPanels.tsx, and MATCHBACK Bot.

## 6. Critical implementation order

1. Developer 3: role, company, JobStatus schema/migration/seed, role guards, contract, and API tests.
2. Developer 1: shared SwipeStack/MatchModal and candidate matches flow.
3. Developer 2: account-type picker and recruiter flows against the contract.
4. Developer 4: Bot service/UI, Resume Coach and explanation safeguards; request the shared layout mount through Developer 1.
5. Integration: fresh database reset, candidate and recruiter demo flows, retry/match race tests, privacy review, and full CI checks.

## 7. Demo script

1. Candidate signs in, opens a fictional job labeled Demo data, and LIKEs job-001. No mutual match exists yet.
2. Recruiter signs in, opens a PUBLISHED owned job, and LIKEs the same candidate for job-001.
3. The API returns matchCreated true, isMatched true, and matchId. Both sides can open the mutual match.
4. Retry the same swipe to demonstrate idempotency: matchCreated is false, isMatched remains true, and the same matchId is returned.
5. Ask MATCHBACK Bot for evidence-based interview preparation. If AI is unavailable, show the deterministic fallback.

## 8. Must not break

- Login, refresh, logout, suspension, deletion handling, and admin status management.
- calculateMatch behavior and its tests.
- Candidate discover ordering and score display.
- AI fallback responses with source: fallback.
- Discover LIKE -> INTERESTED -> saved -> self-reported applications.
- Seed idempotency and the demo data label.
- No photo/logo/image-upload scope.
- CI: API lint/test/e2e/build, web lint/test/build, and migration drift checks after the schema PR.

## 9. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Schema work arrives late | Developer 3 lands the migration and contract first; frontend developers use typed contract fixtures |
| Shared-file conflicts | docs/team-ownership.md assigns one owner to every shared file |
| Match retry or race produces duplicate celebration | matchCreated is based on inserted count; isMatched/matchId support safe refresh |
| Recruiter privacy leak | CandidateCard excludes contact data and candidate decision; e2e ownership/privacy tests |
| AI latency/cost | Explicit-action calls, 20-message/20,000-character Bot cap, 1,200-token output cap, AI throttle, deterministic fallback |
| Demo data mistaken for vacancies | Seeded records always carry isDemo and Demo data UI copy; no real feed |
| Desktop implementation breaks smaller screens | Desktop-first layout is tested at desktop, tablet, and mobile breakpoints |
| Scope exceeds deadline | Ship the candidate path and one recruiter/mutual-match happy path before optional polish |

## 10. Verification gate

Before parallel implementation is considered ready:

~~~text
api: pnpm lint:check && pnpm test && pnpm test:e2e && pnpm build
web: pnpm lint && pnpm test && pnpm build
manual: fresh database -> candidate LIKE -> recruiter LIKE -> one match -> retry -> matches pages
manual: draft/ published/ closed visibility and recruiter ownership
manual: desktop, tablet, mobile; mouse, touch, buttons, keyboard
manual: no photos/logos/uploads; Demo data labels; no hiring-probability copy
~~~

No feature is complete until its status is reflected as IMPLEMENTED in docs/api-contract.md and the current demo path still works.
