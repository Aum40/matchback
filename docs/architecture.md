# MATCHBACK architecture

> This document separates the candidate-side system implemented on `main` from the two-sided architecture proposed for the MVP. Proposed modules and fields are design targets, not evidence that the feature already exists.

## Product boundary

MATCHBACK has two actors and one shared pairing rule:

- A candidate discovers jobs and records a LIKE or SKIP.
- A recruiter selects an owned job and records a LIKE or SKIP for a candidate.
- A mutual match for `(candidateId, jobId)` exists only when both sides LIKE that same pair.
- A compatibility score is profile fit calculated by deterministic code; it is not a match and is never a hiring prediction.

The demo uses fictional seeded jobs and companies. Candidate applications remain self-reported; a swipe or a mutual match does not submit an external application or imply an employer response. The UI is desktop-first and fully responsive, with usable tablet/mobile layouts. Cards are text-first and have no candidate photos, company logos, or image uploads.

## Current system on `main`

```text
Browser
  | next-auth session cookie
  v
Next.js App Router
  | Server Components -> web/src/lib/api/*.api.ts
  | Server Actions -> web/src/lib/actions/*
  | apiFetch adds bearer access token on the server
  v
NestJS REST API
  | global throttler -> AuthGuard -> RolesGuard
  v
PostgreSQL through Prisma 7
  |
  +--> AiService --> Claude API (optional; server-side only)
                  \-> deterministic fallback on missing key/failure
```

The browser never calls the API directly. CORS is intentionally off because the Next.js server performs API calls. The API owns business logic, authorization, score calculation, profile privacy, application rules, and AI context construction.

### Implemented API modules

| Module | Live responsibility |
|---|---|
| `auth`, `users`, `admin` | Email/password and optional Google auth, access/refresh sessions, account guards, admin user management |
| `candidates` | `GET/PUT /candidates/me` and profile/skill persistence |
| `jobs` | Public job catalog, public job detail, public skills catalog, candidate discovery, candidate job swipes, swipe reset |
| `matching` | Deterministic job fit and explicit-action AI explanation |
| `resume` | Explicit-action Resume Coach request |
| `applications` | Candidate-owned saved jobs and self-reported status/notes |
| `infrastructure/ai` | Claude client, structured-output validation, prompt rules, deterministic fallback |

### Implemented web routes

`/`, `/login`, `/signup`, `/discover`, `/jobs/[id]`, `/profile`, `/saved`, `/applications`, and `/admin` exist today. Recruiter routes and the matches page are proposed.

## Candidate flow (implemented)

1. The candidate signs in. The web stores session state in next-auth; the API issues a short-lived access token and rotating refresh token.
2. `/discover` calls `GET /jobs/discover` through a Server Component. The API removes jobs already swiped by this user, computes the deterministic score for each remaining job, and sorts by score.
3. `SwipeDeck` supports desktop mouse dragging, touch swiping, LIKE/NOPE buttons, and left/right keyboard input. A Server Action calls `POST /jobs/:id/swipe` and optimistically removes the card.
4. A candidate LIKE records `JobInteraction(LIKE)` and creates an `INTERESTED` application row if needed. It does not submit an application.
5. Job detail calls `GET /jobs/:jobId/match` without invoking AI. The user may explicitly request an explanation or Resume Coach response.
6. The candidate may update the tracker themselves. No employer system updates it.

## Recruiter flow (proposed)

1. A recruiter registers or signs in with role `RECRUITER`.
2. The recruiter creates or edits one company profile. The API stores the company relationship; the client never supplies an authority-bearing company id.
3. The recruiter lists, creates, or edits only jobs where the database says `job.companyId === recruiter.companyId`.
4. The recruiter selects one `PUBLISHED` job. `GET /recruiter/jobs/:jobId/candidates` returns privacy-safe `CandidateCard` records, excluding candidates already swiped for that job and never revealing the candidate's job interaction. Draft and closed jobs remain visible/manageable in the recruiter's own job list but do not open a candidate deck; deck and recruiter-swipe requests return `409 JOB_NOT_PUBLISHED`.
5. A swipe writes one `CandidateInteraction` per `(jobId, candidateId)`. The recruiter identity is stored for audit, but another recruiter of the same company cannot create a second decision for the same pair.
6. A recruiter matches page lists only mutual matches for the recruiter's company.

## Mutual matching flow (proposed)

```text
Candidate LIKEs job
        |
        v
JobInteraction(candidateId, jobId, LIKE)
        |
        +-- if recruiter LIKE already exists --> create/read Match

Recruiter LIKEs candidate for selected job
        |
        v
CandidateInteraction(jobId, candidateId, recruiterId, LIKE)
        |
        +-- if candidate LIKE already exists --> create/read Match
```

Both swipe services use the same write-then-read sequence:

1. Commit the current swipe with an upsert.
2. After that write is committed, read the other side's LIKE.
3. If both sides LIKE, call `createMany({ skipDuplicates: true })` for the unique `(candidateId, jobId)` pair, then read the match.
4. Return `matchCreated: true` only when this request inserted a new match row. Return `isMatched: true` and `matchId` whenever the match exists, including a retry or later SKIP; otherwise return `isMatched: false` and `matchId: null`.

This avoids a SERIALIZABLE transaction while the database uniqueness constraint absorbs the race where both requests try to create the same match. The service uses the `createMany` result to set `matchCreated`; a duplicate insert is not reported as a new match. Changing a LIKE to SKIP later does not delete a match. There is no `POST /matches`.

Client retry behavior: after a successful `matchCreated: true`, show the celebration and use `matchId` to load the full match. If a request times out, retrying the same swipe is safe; a response with `matchCreated: false`, `isMatched: true`, and a `matchId` means the match already exists, so refresh the match instead of replaying the creation celebration.

## Proposed data model

The current Prisma schema remains unchanged in this documentation branch. The following additions are proposed for the two-sided implementation and require a Prisma migration owned by Developer 3.

```text
User (existing)
  role: USER | ADMIN                    -> add RECRUITER
  companyId: nullable UUID              -> proposed one-company recruiter ownership
       |
       +--> Company (proposed)
       |      id, name, description, website
       |      recruiters, jobs
       |
       +--> CandidateProfile (existing, candidate only)
       +--> CandidateSkill (existing)
       +--> JobInteraction (existing candidate decision)
       +--> CandidateInteraction (proposed recruiter decision)
       +--> Match (proposed mutual result)

Job (existing)
  id, title, company display name, location, work arrangement,
  employment type, salary range, description, isDemo
  companyId: nullable UUID                  -> proposed owner relation
  status: DRAFT | PUBLISHED | CLOSED        -> proposed publication state
       |
       +--> JobSkill (existing)
       +--> JobInteraction (existing)
       +--> CandidateInteraction (proposed)
       +--> Match (proposed)
       +--> Application (existing candidate tracker)
```

Proposed constraints and visibility mapping:

- `CandidateInteraction` has one decision per `(jobId, candidateId)`, with `recruiterId` referencing an authorized recruiter of that job's company.
- `Match` has `@@unique([candidateId, jobId])` and stores `createdAt`.
- The current schema has no publication field. Add `status` through a future migration; existing seeded jobs are backfilled/treated as `PUBLISHED`, recruiter-created jobs start as `DRAFT`, and only `PUBLISHED` jobs appear in candidate discovery/public browsing. `CLOSED` jobs remain manageable by their owner.
- `isDemo` labels fictional seed data and is not a visibility flag. Recruiter-created records are not seeded demo data; any fictional hackathon records must be labeled explicitly.
- Existing stable seed ids remain slugs such as `job-001` and `typescript`; recruiter-created ids may be UUIDs.

## Security and authorization

- `USER` is the existing candidate role name. `RECRUITER` is proposed; `ADMIN` cannot be selected at sign-up.
- Every non-public endpoint requires a bearer token. Global guards run throttling, authentication, then role authorization.
- User ownership comes from `@CurrentUser('sub')`, never from the request body. Queries are scoped by `userId`.
- Recruiter ownership is resolved from the database. A job owned by another company returns `404 JOB_NOT_FOUND`, preventing company/job enumeration. Wrong-role access returns 403.
- Before a mutual match, `CandidateCard` contains first name, profile text, listed skills, and fit summary only. It excludes email, surname/full name, and the candidate's LIKE/SKIP decision.
- After a mutual match, the match endpoint may return the contact details defined by the contract to the candidate and authorized recruiter only.
- Soft-deleted users are excluded. Never serialize raw Prisma `User` rows or secrets.
- DTO validation uses the global whitelist/transform pipe. Errors use `{ statusCode, message, code? }`; clients branch on stable codes.
- AI prompts omit name, email, and user id and contain only the minimum profile and job facts needed for the requested explanation.

## Compatibility score

Implemented in `api/src/matching/match-score.ts` as a pure function. The score is not AI-generated:

```text
score = round(70 * requiredRatio + 15 * niceToHaveRatio + 15 * preferenceFit)
score is clamped to 0-100
```

Only skills the candidate explicitly listed count in the skill ratios. Preferences average work arrangement, salary, and role fit; unknown values are neutral (`0.5`). Skill buckets are deliberately separate:

| Bucket | Meaning | Counts? |
|---|---|---:|
| `matchedSkills` | Listed by the candidate | Yes |
| `unconfirmedSkills` | Not listed, but mentioned in profile text, or no skills were listed | No |
| `missingSkills` | Not listed or mentioned when the candidate has a skill list | No |

AI may explain the deterministic result and provide evidence-based recommendations, but it must not calculate, alter, or present it as a hiring probability. The score is never a mutual match. The UI may use labels such as Strong fit, Partial fit, and Stretch; it must not show the score as a percentage.

## AI and MATCHBACK Bot architecture

### Implemented AI path

`MatchingService` builds a `MatchContext` containing job facts, candidate facts without identity fields, and the already-calculated match. `AiService` sends that context to Claude only after an explicit explanation or Resume Coach action. Structured output is validated with zod. Missing keys, timeouts, errors, refusals, and unparsable output use `ai.fallback.ts` with `source: "fallback"`.

The prompt rules prohibit invented candidate facts, re-scoring, and hiring promises. AI responses are suggestions and explanations, not authoritative decisions.

### Proposed Bot path

The hackathon MVP exposes the Bot to candidate (`USER`) accounts only. Recruiter Bot access is out of scope and requires a future contract decision.

```text
Web Bot panel
  -> Server Action / apiFetch
  -> POST /assistant/messages
  -> validate <=20-message history and optional jobId
  -> build the same safe MatchContext when jobId exists
  -> AiService Bot task + rules prompt
  -> Claude structured/text response or deterministic fallback
```

The server is stateless. The web sends the conversation history on every request. The request is limited to 20 messages, 2,000 characters per message, and 20,000 total characters. The endpoint is throttled, does not persist chat, and never becomes official U-Bot integration. The service caps generated output, avoids sending duplicate context, and uses the deterministic fallback without failing the page when AI is unavailable.

## Known limitations

- Recruiter, company, recruiter-swipe, mutual-match, matches-page, and Bot modules are not on `main` yet.
- Current skill matching uses exact stable skill ids; it has no synonym or skill-level model.
- Mention detection is a simple whole-word check in profile text.
- There is no resume upload or PDF parsing.
- AI responses are not cached; explicit calls are rate-limited.
- Jobs are demo-only; there is no scraping or external feed.
