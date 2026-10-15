# MATCHBACK API contract (two-sided)

> **Status:** agreed contract for parallel development. Endpoints marked **NEW** don't exist yet. Endpoints marked **EXISTING** are live on `main`.
> **Owner:** Developer 3 (backend). Any change to this file goes in its own small PR, announced to the whole team.
> `web/src/lib/api/api.type.ts` mirrors the response types below. Keep them in sync in the same PR.

## Conventions (unchanged)

- **Base URL:** `API_URL` (web server only — the browser never calls the API).
- **Auth:** every endpoint needs `Authorization: Bearer <accessToken>` unless marked **public**.
- **Roles** come from the access token. `USER` = candidate (the name is kept to avoid a data migration), `RECRUITER` = **NEW**, `ADMIN`.
- **Errors:** `{ statusCode, message, code? }`. Branch on `code`, never on `message`.
  - A resource that exists but belongs to someone else returns **404**, not 403, so ids can't be probed.
  - Calling an endpoint for the wrong role returns **403** (RolesGuard).
- **Swipe direction enum:** `"LIKE" | "SKIP"` (UI labels: LIKE / NOPE).
- **Ids:**
  - Jobs: string (`job-001` for seeded jobs; uuid for recruiter-created jobs).
  - Users, companies, matches, applications: uuid.

## Shared types

```ts
type Role = "USER" | "RECRUITER" | "ADMIN";          // USER = candidate
type SwipeDirection = "LIKE" | "SKIP";

/** What a candidate exposes to recruiters BEFORE a mutual match — no email, no name surname. */
type CandidateCard = {
  candidateId: string;            // user id
  displayName: string;            // first name only (e.g. "Ann")
  headline: string | null;
  education: string | null;
  experience: string | null;
  projects: string | null;
  skills: { id: string; name: string }[];
  match: MatchSummary;            // deterministic, same formula as candidate side
};

type MatchSummary = {
  score: number;                  // 0–100, profile fit — NOT a hiring probability
  matchedSkillIds: string[];
  unconfirmedSkillIds: string[];
  missingSkillIds: string[];
};

/** A real mutual match: both sides said LIKE. Never derived from a score. */
type MutualMatch = {
  id: string;
  createdAt: string;
  job: Job;                       // existing Job type (+ companyId)
  candidate: {                    // contact details are revealed only after the match
    candidateId: string;
    name: string;
    email: string;
    headline: string | null;
  };
};

/** Returned by BOTH swipe endpoints. `match` is non-null only when this swipe completed a mutual match. */
type SwipeResult = {
  direction: SwipeDirection;
  match: { id: string; createdAt: string } | null;
};

type Company = {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
};
```

## Auth

| Method | Path | Who | Change |
|---|---|---|---|
| POST | `/auth/register` | public | **CHANGED:** optional `accountType: "CANDIDATE" \| "RECRUITER"` (default `CANDIDATE`). `ADMIN` can never be self-assigned. CANDIDATE maps to role `USER`. |
| POST | `/auth/login`, `/auth/google`, `/auth/refresh`, `/auth/logout` | public | EXISTING, unchanged. `user.role` may now be `RECRUITER`. Google sign-up always creates a candidate. |

## Candidate side

All of these get `@Roles(Role.USER)` (**CHANGED**: today they accept any logged-in role).

| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| GET | `/jobs/discover` | — | `DiscoverJob[]` | EXISTING. Only jobs that are `isOpen` (NEW field, default true). |
| POST | `/jobs/:id/swipe` | `{ direction }` | `SwipeResult` | **CHANGED:** adds `match`. A LIKE still creates an `INTERESTED` application (existing behavior). |
| GET | `/jobs/:jobId/match` | — | `JobMatchResponse` | EXISTING |
| POST | `/jobs/:jobId/match/explanation` | — | `MatchExplanation` | EXISTING (AI or fallback) |
| POST | `/resume/coach` | `{ jobId }` | `ResumeCoaching` | EXISTING |
| GET/PUT | `/candidates/me` | profile | `CandidateProfile` | EXISTING |
| GET/PATCH/DELETE | `/applications[/:id]` | — | `Application` | EXISTING |
| DELETE | `/jobs/swipes` | — | `{ cleared }` | EXISTING. **Must not delete mutual matches.** |

## Recruiter side (all NEW, `@Roles(Role.RECRUITER)`)

| Method | Path | Body | Response | Errors |
|---|---|---|---|---|
| GET | `/companies/me` | — | `Company \| null` | — |
| PUT | `/companies/me` | `{ name, description?, website? }` | `Company` | Creates the company on first call and links the recruiter to it |
| GET | `/recruiter/jobs` | — | `(Job & { isOpen: boolean; likeCount: number; matchCount: number })[]` | `COMPANY_REQUIRED` (409) if no company |
| POST | `/recruiter/jobs` | `CreateJobDto`* | `Job` | `COMPANY_REQUIRED` (409) |
| PATCH | `/recruiter/jobs/:jobId` | partial `CreateJobDto` + `isOpen?` | `Job` | `JOB_NOT_FOUND` (404) if not this company's job |
| GET | `/recruiter/jobs/:jobId/candidates` | — | `CandidateCard[]` (not yet swiped for this job, best match first) | `JOB_NOT_FOUND` (404) |
| POST | `/recruiter/jobs/:jobId/candidates/:candidateId/swipe` | `{ direction }` | `SwipeResult` | `JOB_NOT_FOUND`, `CANDIDATE_NOT_FOUND` (404) |
| GET | `/recruiter/jobs/:jobId/matches` | — | `MutualMatch[]` | `JOB_NOT_FOUND` (404) |

\* `CreateJobDto`: `title`, `location`, `workArrangement`, `employmentType`, `salaryMin?`, `salaryMax?`, `description`, `skills: { id: string; required: boolean }[]` (1–15 items, ids must exist → `UNKNOWN_SKILL` 400).
- `isDemo` is always `false` for recruiter-created jobs.
- `company` (display string) is filled from the company name.

**Deck rules** (`GET /recruiter/jobs/:jobId/candidates`):
- Show only candidates who have a profile with at least one skill.
- Exclude candidates this job has already swiped (either direction).
- **Never reveal whether the candidate liked the job.** The deck order is by match score only.

## Matches (NEW)

| Method | Path | Who | Response |
|---|---|---|---|
| GET | `/matches` | USER or RECRUITER | `MutualMatch[]`. A candidate gets their matches; a recruiter gets matches for their company's jobs. |
| GET | `/matches/:id` | USER or RECRUITER | `MutualMatch`. 404 unless the caller is the candidate or a recruiter of the job's company. |

**No endpoint creates a match.** Matches are created only as a side effect of a swipe (see Mutual match rules).

## Assistant — MATCHBACK Bot (NEW)

| Method | Path | Who | Body | Response |
|---|---|---|---|---|
| POST | `/assistant/messages` | USER (RECRUITER later if time allows) | `{ messages: { role: "user" \| "assistant"; content: string }[] (1–20, each ≤ 2000 chars), jobId?: string }` | `{ reply: string; source: "ai" \| "fallback" }` |

- The conversation is stateless on the server: the web sends the history each time.
- If `jobId` is given, the bot gets the same `MatchContext` as the explanation endpoint.
- It reuses `AiService` rules: never invent experience, never claim hiring odds.
- Throttled with `@AiThrottle()`.
- **U-Bot:** not integrated. There is no verified documentation or credentials. Do not add calls to any U-Bot endpoint until the team has verified official docs and access.

## Mutual match rules (normative)

1. A match exists for `(candidateId, jobId)` **only if** both are true:
   - a `JobInteraction` LIKE from the candidate for that job, and
   - a `CandidateInteraction` LIKE for that candidate on that job, made by a recruiter of the job's company.
2. **One match per pair:** `@@unique([candidateId, jobId])`.
3. **Creation algorithm** (same for both swipe endpoints):
   1. Commit the swipe (upsert the interaction).
   2. **After** that commit, read the other side's interaction.
   3. If both are LIKE, `match.createMany({ data: [...], skipDuplicates: true })`, then read the match back and return it.

   Why this is race-safe without SERIALIZABLE: each request reads only after its own write is committed, so whichever check runs last sees both LIKEs. The unique constraint absorbs the case where both checks see both likes.
4. Changing a LIKE to SKIP later does **not** delete an existing match (no un-matching in MVP).
5. The UI shows "It's a Match!" **only** when `SwipeResult.match !== null`. A high score is not a match.
