# MATCHBACK architecture

## Overview

```
Browser ──(cookie: next-auth session)──▶ Next.js web (App Router)
                                           │  Server Components read via lib/api/*.api.ts
                                           │  Server Actions mutate via lib/actions/*
                                           │  apiFetch + Bearer access token
                                           ▼
                                        NestJS API ──▶ PostgreSQL (Prisma)
                                           │
                                           └──▶ Claude API (only from AiService, optional)
```

- The browser never calls the API directly. The web server holds the API tokens inside the encrypted next-auth cookie. `web/src/proxy.ts` refreshes the access token before it expires.
- Every non-public API route goes through three global guards: rate limit → `AuthGuard` → `RolesGuard`.

## API modules

| Module | Endpoints | Responsibility |
|---|---|---|
| `auth`, `users`, `admin` | `/auth/*`, `GET /users/me`, `/admin/users` | Login, tokens and guards (from the starter) |
| `candidates` | `GET/PUT /candidates/me` | Candidate profile and listed skills. Builds the match inputs. |
| `jobs` | `GET /jobs`, `GET /jobs/:id`, `GET /skills` (public); `GET /jobs/discover`, `POST /jobs/:id/swipe`, `DELETE /jobs/swipes` | Job catalog, the personalized swipe feed, and swipe persistence |
| `matching` | `GET /jobs/:id/match`, `POST /jobs/:id/match/explanation` | The deterministic score and its explanation |
| `resume` | `POST /resume/coach` | Resume suggestions for one job |
| `applications` | `GET /applications?status=`, `PATCH/DELETE /applications/:id` | Saved jobs and self-reported application status |
| `infrastructure/ai` | — | `AiService`: Claude call + zod schema + deterministic fallback |

### Errors

Errors have the shape `{ statusCode, message, code? }`.
- **Domain errors:** a service throws a Nest exception with a stable `code`, e.g. `JOB_NOT_FOUND`, `UNKNOWN_SKILL`, `APPLICATION_NOT_FOUND`, `ACCOUNT_SUSPENDED`.
- **Leftover Prisma errors:** `PrismaExceptionFilter` maps them (P2025→404, P2002→409, P2003→400). Anything else becomes a generic 500, and the details go only to the log.
- **Validation errors:** 400, from `ValidationPipe`.

## Data model

```
User 1─1 CandidateProfile        headline, education, experience, projects,
 │                               desiredRoles[], preferredSalaryMin, preferredWorkArrangement
 ├─* CandidateSkill ─* Skill     skills the candidate confirms (these count for the score)
 ├─* JobInteraction ─* Job       LIKE / SKIP (one per user+job; removes the job from Discover)
 └─* Application ─* Job          INTERESTED → APPLIED → INTERVIEWING → REJECTED / OFFER,
                                 notes, employerFeedback (all entered by the user)
Job *─* Skill via JobSkill(required: boolean)
```

- `Skill.id` and `Job.id` are stable slugs (`typescript`, `job-001`), seeded from `api/prisma/seed-data.ts`.
- `Job.isDemo` marks fictional data, and the UI labels it.

## Main flows

### Discover
1. `/discover` (Server Component) calls `GET /jobs/discover`.
2. The API loads the profile, takes the jobs this user hasn't swiped, runs `calculateMatch()` for each, and sorts by score.
3. `SwipeDeck` (client) shows one card at a time. You can swipe by dragging, with the buttons, or with ← / →.
4. Each swipe calls the `swipeAction` Server Action, which calls `POST /jobs/:id/swipe`.
   - The card is removed optimistically and restored if the call fails.
   - `LIKE` also creates an `Application` with status `INTERESTED` (if one doesn't already exist).

### Job detail and AI
1. `/jobs/[id]` calls `GET /jobs/:id/match`, which returns the deterministic result. No AI runs on page load.
2. "Explain my match" calls `POST /jobs/:id/match/explanation`, and "Get resume suggestions" calls `POST /resume/coach`.
   - Both build one `MatchContext`: the job facts, the candidate's facts (no name or email), and the computed match.
   - `AiService` asks Claude for structured output that is validated with zod.
   - With no key, a timeout, an error, a refusal or unparsable output, it returns `ai.fallback.ts` output instead, with `source: "fallback"`.

### Profile
`PUT /candidates/me` replaces the profile and its skill list in one transaction. Scores are always computed fresh, so a profile edit changes every score on the next load.

## Match score

Implemented in `api/src/matching/match-score.ts` and tested in `match-score.spec.ts`.

```
score = round( 70 × requiredRatio + 15 × niceToHaveRatio + 15 × preferenceFit )   clamped to 0–100

requiredRatio   = required skills the candidate LISTED / required skills of the job   (1 if the job lists none)
niceToHaveRatio = same, for nice-to-have skills
preferenceFit   = average of
  workArrangement: same = 1 · either side HYBRID = 0.5 · opposite = 0 · not set = 0.5
  salary:          job's top of range ≥ candidate minimum = 1 · otherwise 0 · either unknown = 0.5
  role:            best share of a desired role's words found in the job title
                   (ignores junior/senior/intern) · no desired roles = 0.5
```

### Skill classification

| Bucket | Rule | Counts toward score? | Shown as |
|---|---|---|---|
| `matchedSkills` | Skill is in the candidate's list | yes | ✓ green |
| `unconfirmedSkills` · `MENTIONED_IN_PROFILE` | Not listed, but the name appears as a whole word in experience / projects / education | no | ? amber, "not enough information" |
| `unconfirmedSkills` · `NO_SKILLS_LISTED` | The candidate listed no skills at all | no | ? amber |
| `missingSkills` | Not listed and not mentioned, and the candidate did list some skills | no | ✕ red, "skill gap" |

### Why this design
- **Deterministic:** it's testable, explainable, and stable across reloads. AI is used only to explain the score and suggest improvements, never to produce it.
- **Unconfirmed skills don't score.** Confirming them in the profile raises the score immediately. This nudges candidates to state what they really have, instead of the system guessing.
- **The score describes fit, not hiring odds.** UI labels are "Strong fit", "Partial fit" and "Stretch". There are no percentages.

## Known limitations / next steps

- Skill matching is exact (by skill id). There are no synonyms or skill levels yet, e.g. "JS" vs "JavaScript".
- Profile mention detection is a simple whole-word match on the skill name.
- AI responses are not cached, so every button press is a new paid call (rate-limited to 10/min per IP).
- The resume coach works only from profile text. There is no resume upload or parsing.
- The application tracker is entirely self-reported. No employer integration exists by design.
- Job data is demo-only. There is no ingestion pipeline.
