# MATCHBACK team ownership

This file is authoritative for ownership during the two-sided MVP. The four developer branches are:

- Developer 1: feature/candidate-ui
- Developer 2: feature/recruiter-ui
- Developer 3: feature/mutual-match
- Developer 4: feature/ai-bot

Each file has one owner. Other developers submit a proposed diff to the owner instead of editing the file directly. The API contract and generated/runtime boundaries are enforced through [docs/api-contract.md](api-contract.md).

## Developer 1 - Candidate frontend

Branch: feature/candidate-ui

Owns:

- Candidate discover deck, job detail, profile, saved jobs, application tracker, and candidate matches page.
- Desktop-first responsive swipe UX: mouse dragging, touch swiping, Like/Pass buttons, keyboard alternatives, rotation, overlays, loading, empty, error, and permission states.
- Text-first cards. No candidate photos, company logos, or image uploads.
- Shared SwipeStack and MatchModal components, built first for Developer 2 to consume.
- Candidate web API adapters and Server Actions, except the shared response-type file owned by Developer 3.
- Shared authenticated app layout, AppHeader, and globals.css.

Primary files:

- web/src/app/(app)/discover/**
- web/src/app/(app)/jobs/[id]/**
- web/src/app/(app)/profile/**
- web/src/app/(app)/saved/**
- web/src/app/(app)/applications/**
- web/src/app/(app)/matches/** (new)
- web/src/components/features/jobs/**
- web/src/components/features/profile/**
- web/src/components/features/applications/**
- web/src/components/features/match/MatchModal.tsx (shared, owned by Developer 1)
- web/src/components/features/swipe/SwipeStack.tsx (shared, owned by Developer 1)
- web/src/components/layout/AppHeader.tsx
- web/src/app/(app)/layout.tsx
- web/src/app/globals.css
- web/src/lib/api/jobs.api.ts
- web/src/lib/api/candidates.api.ts
- web/src/lib/api/applications.api.ts
- web/src/lib/api/matches.api.ts (new)
- web/src/lib/actions/jobs.action.ts
- web/src/lib/actions/profile.action.ts
- web/src/lib/actions/applications.action.ts
- web/src/lib/actions/matches.action.ts (new)

Developer 1 does not edit recruiter components, API business logic, Prisma files, or web/src/lib/api/api.type.ts.

## Developer 2 - Recruiter frontend

Branch: feature/recruiter-ui

Owns:

- Recruiter company page, job list, job editor, job status controls, selected-job flow, candidate deck, and recruiter matches page.
- Recruiter route guards and recruiter navigation inside recruiter-owned route files.
- Recruiter account-type selection in the existing sign-up UI.
- CandidateCard presentation using only the privacy-safe contract.
- Recruiter API adapters, Server Actions, and UI tests, using Developer 1's shared SwipeStack and MatchModal.

Primary files:

- web/src/app/(app)/recruiter/** (new)
- web/src/components/features/recruiter/** (new)
- web/src/app/(auth)/signup/**, including components/features/auth/SignupForm.tsx
- web/src/lib/api/companies.api.ts (new)
- web/src/lib/api/recruiter.api.ts (new)
- web/src/lib/actions/company.action.ts (new)
- web/src/lib/actions/recruiter.action.ts (new)

Developer 2 does not edit the shared api.type.ts file, shared app layout, candidate deck internals, API authorization, or Prisma files. The signup UI may send accountType, but Developer 3 owns the API DTO and role mapping.

## Developer 3 - Backend, database, and API contract

Branch: feature/mutual-match

Owns:

- NestJS recruiter/company/job-management/candidate-deck/matches APIs.
- Auth role registration changes and role guards.
- Candidate and recruiter swipe persistence, match creation, retry semantics, and race-safety.
- Prisma schema, migration, seed data, ownership constraints, and database tests.
- Existing candidate endpoint role restrictions and proposed publication-state behavior.
- The authoritative HTTP contract and shared web response types.

Primary files:

- api/prisma/schema.prisma
- api/prisma/migrations/**
- api/prisma/seed.ts and api/prisma/seed-data.ts
- api/src/companies/** (new)
- api/src/recruiter/** (new)
- api/src/matches/** (new)
- api/src/jobs/**
- api/src/auth/dto/register.dto.ts and the role mapping in auth.service.ts
- api/src/auth/**
- api/src/common/** for authorization/validation
- api/src/app.module.ts
- api/test/**
- docs/api-contract.md
- web/src/lib/api/api.type.ts

Developer 3 is the only developer who creates migrations or changes the shared contract types. Recruiter ownership is loaded from the database. No client-created match endpoint is permitted.

## Developer 4 - AI and MATCHBACK Bot

Branch: feature/ai-bot

Owns:

- Deterministic compatibility explanation behavior and fallback output.
- Resume Coach prompts, schemas, fallback output, and tests.
- MATCHBACK Bot API/service, safe context construction, history limits, token/cost safeguards, throttling, and graceful fallback.
- Existing AI UI in AiPanels.tsx and the new floating Bot UI.
- AI API adapter and Server Action.

Primary files:

- api/src/infrastructure/ai/**
- api/src/matching/** only for explanation/context behavior; the deterministic score formula remains a protected shared behavior
- api/src/resume/**
- api/src/assistant/** (new)
- web/src/components/features/match/AiPanels.tsx
- web/src/components/features/assistant/** (new)
- web/src/lib/api/assistant.api.ts (new)
- web/src/lib/actions/assistant.action.ts (new)

Developer 4 does not edit the deterministic score formula, recruiter authorization, match persistence, schema/migrations, shared layout, or MatchModal. To mount the Bot in the shared app layout, Developer 4 submits a one-line change to Developer 1, who applies it.

## Single-owner shared-file matrix

| Shared file or boundary | Sole owner | Integration rule |
|---|---|---|
| api/prisma/schema.prisma and api/prisma/migrations/** | Developer 3 | Merge schema PR first; everyone regenerates Prisma client afterward |
| api/src/app.module.ts | Developer 3 | New module imports are proposed to Developer 3; preserve import order |
| web/src/lib/api/api.type.ts | Developer 3 | Frontend developers propose type additions; no direct edits |
| docs/api-contract.md | Developer 3 | Contract changes are announced and reflected in api.type.ts |
| web/src/app/(app)/layout.tsx | Developer 1 | Developer 4 requests the Bot mount; Developer 1 applies it |
| web/src/components/layout/AppHeader.tsx | Developer 1 | Role-aware navigation changes go through Developer 1 |
| web/src/app/globals.css | Developer 1 | Shared responsive/theme tokens go through Developer 1 |
| web/src/app/(auth)/signup/** and SignupForm.tsx | Developer 2 | Developer 3 supplies the request contract; Developer 2 owns the form |
| web/src/components/features/swipe/SwipeStack.tsx | Developer 1 | Developer 2 consumes it; never fork it |
| web/src/components/features/match/MatchModal.tsx | Developer 1 | Both sides pass a backend-confirmed matchId |
| web/src/components/features/match/AiPanels.tsx | Developer 4 | Candidate job detail consumes its public props |
| AGENTS.md, README.md, docs/architecture.md, docs/team-ownership.md, docs/two-sided-plan.md | Technical Lead | Developers propose documentation changes; the Technical Lead reconciles them |

This matrix supersedes conflicting ownership statements elsewhere. [docs/two-sided-plan.md](two-sided-plan.md) describes sequencing and risks only and must not redefine ownership.

## Cross-team integration rules

1. Read docs/api-contract.md before adding a controller, API adapter, Server Action, or response type.
2. The browser uses Server Components and Server Actions; it never imports API source or calls the API directly.
3. Developer 3 lands schema/migrations and the API contract before generated Prisma consumers merge.
4. Candidate and recruiter decks both use the same SwipeStack and the same SwipeResult semantics.
5. MatchModal opens only for matchCreated true. isMatched true with matchCreated false means an existing match should be refreshed, not celebrated as newly created.
6. Developer 4 never introduces a second AI client. All AI calls remain behind AiService, with server-only credentials and deterministic fallback.
7. SignupForm may collect CANDIDATE or RECRUITER, but ADMIN is never selectable. Google sign-up remains a candidate.
8. Every new page and interaction includes loading, empty, error, validation, and permission states.
9. All swipe cards remain text-first and support mouse, touch, button, and keyboard operation.
10. Contract or shared-file changes are reviewed by the sole owner before merge.

## Merge order

1. Developer 3: role, company ownership, job status, schema/migration/seed, endpoint contract, and API tests.
2. Developer 1: SwipeStack, MatchModal, shared layout ownership, and candidate flows.
3. Developer 2: signup account type and recruiter pages against the merged contract.
4. Developer 4: AI/Bot service and UI, requesting the one-line layout mount from Developer 1.
5. Integration: run API lint/test/e2e/build and web lint/test/build, then verify the fresh-database demo path and privacy/copy rules.

No developer pushes to main or bypasses branch protection.
