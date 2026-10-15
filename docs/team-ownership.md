# MATCHBACK team ownership

Four developers implement the two-sided MVP in parallel. These boundaries are intended to minimize merge conflicts. Shared behavior is integrated through [docs/api-contract.md](api-contract.md), not by importing code across `api/` and `web/`.

## Developer 1 - Candidate frontend

**Branch:** `feature/candidate-ui`

**Owns:**

- Candidate job swipe deck, card stack, drag/rotation/LIKE-NOPE overlays, buttons, and keyboard alternatives.
- Candidate mutual-match celebration modal, shown only when the API returns `matchCreated: true`.
- Candidate matches page and candidate-side navigation/loading/empty/error states.
- Candidate-facing API adapters, Server Actions, response types, and tests for those UI flows.

**Primary files:**

- `web/src/app/(app)/discover/**`
- `web/src/app/(app)/matches/**` (new)
- `web/src/components/features/jobs/**`
- `web/src/components/features/match/**`
- `web/src/lib/api/jobs.api.ts`, `web/src/lib/api/matches.api.ts` (new), and related `api.type.ts` additions
- `web/src/lib/actions/jobs.action.ts`, `web/src/lib/actions/matches.action.ts` (new)

**Must not own:** recruiter routes/components, Prisma/schema/migrations, or API business logic. Coordinate with Developer 3 before changing the candidate swipe response shape.

## Developer 2 - Recruiter frontend

**Branch:** `feature/recruiter-ui`

**Owns:**

- Recruiter company profile form.
- Recruiter job create/edit/list UI and job selection.
- Per-job recruiter candidate swipe deck and privacy-safe candidate card presentation.
- Recruiter matches page and recruiter navigation/loading/empty/error states.
- Recruiter-facing API adapters, Server Actions, response types, and UI tests.

**Primary files:**

- `web/src/app/(app)/recruiter/**` (new)
- `web/src/components/features/recruiter/**` (new)
- `web/src/lib/api/companies.api.ts`, `web/src/lib/api/recruiter.api.ts` (new)
- `web/src/lib/actions/company.action.ts`, `web/src/lib/actions/recruiter.action.ts` (new)
- Recruiter-only additions to `web/src/lib/api/api.type.ts`

**Must not own:** candidate deck internals, Prisma/schema/migrations, or API authorization. The recruiter UI must not render email/full name or candidate swipe decisions before a `MutualMatch` response.

## Developer 3 - Backend and database

**Branch:** `feature/mutual-match`

**Owns:**

- NestJS recruiter/company/jobs/candidate-deck/matches APIs.
- Prisma role, company ownership, recruiter interaction, and match data model.
- Migrations, constraints, seed data, role authorization, ownership checks, swipe persistence, and race-safe match creation.
- Existing candidate swipe response extension and API e2e/unit coverage.
- Contract changes in `docs/api-contract.md` when implementation requires them.

**Primary files:**

- `api/prisma/schema.prisma`, `api/prisma/migrations/**`, `api/prisma/seed*.ts`
- `api/src/companies/**`, `api/src/recruiter/**`, `api/src/matches/**` (new)
- `api/src/auth/**` role/register changes
- `api/src/jobs/**` swipe/ownership changes
- `api/src/common/**` authorization/validation additions
- `api/test/**` and relevant API specs

**Integration rules:** schema/migration PRs merge first; recruiter ownership is always loaded from the database; `CandidateCard` never reveals the candidate's LIKE; match creation happens only inside swipe services; no client-created match endpoint.

## Developer 4 - AI and Bot

**Branch:** `feature/ai-bot`

**Owns:**

- AI compatibility explanations and deterministic fallback behavior.
- Resume Coach prompts, schemas, fallback output, and tests.
- MATCHBACK Bot API/service, safe context construction, history validation, throttling, and fallback.
- AI-facing UI panel/floating Bot component and its Server Action/API adapter, coordinated with both frontend owners.

**Primary files:**

- `api/src/infrastructure/ai/**`
- `api/src/assistant/**` (new)
- `api/src/matching/**` only for AI context/explanation behavior
- `api/src/resume/**` only for Resume Coach behavior
- `web/src/components/features/assistant/**` (new)
- `web/src/lib/api/assistant.api.ts` and `web/src/lib/actions/assistant.action.ts` (new)

**Must not own:** deterministic score formula, recruiter authorization, match persistence, or database migrations. AI explains the score but never computes or changes it.

## Shared interfaces and integration points

| Interface | Owner | Consumers |
|---|---|---|
| `SwipeDirection`, `SwipeResult`, `matchCreated`, `MutualMatch` | Developer 3 / `docs/api-contract.md` | Both frontend developers; match modal and pages |
| `CandidateCard` privacy shape | Developer 3 | Recruiter frontend; API tests |
| Candidate/recruiter role and auth session shape | Developer 3 | All web auth/layout work |
| `MatchSummary` and deterministic score buckets | Developer 3 | Both decks, job detail, AI context |
| `MatchContext`, AI source, explanation/coach schemas | Developer 4 | Candidate UI, Bot UI, API fallbacks |
| Server-only `apiFetch` and Server Actions | Existing web architecture; frontend owner of each area | All web features |

### Coordination rules

1. Read `docs/api-contract.md` before adding an adapter or controller.
2. A contract change is announced and reflected in web handwritten types; web types must not import API source.
3. Developer 3 lands schema/migrations before code that consumes new generated Prisma types.
4. Developer 1 and Developer 2 share swipe interaction expectations but keep candidate and recruiter route/component ownership separate.
5. Developer 4 may reuse the existing `AiService` and safe context builder but may not introduce a second AI client or expose `ANTHROPIC_API_KEY` to `web/`.
6. Every feature includes loading, empty, error, validation, and permission states, and does not claim planned behavior is live.

## Merge order for the MVP

1. Developer 3: role/company/schema/migration/API contract and seed data.
2. Developer 4: shared AI/Bot contract and service additions that do not depend on UI.
3. Developer 1 and Developer 2: their web flows against the merged contract.
4. Integration: run API lint/test/e2e/build and web lint/test/build, verify the demo path, and review privacy/copy rules.

`main` is protected. Use pull requests; do not push directly or merge around CI.
