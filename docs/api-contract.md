# MATCHBACK API contract

> Shared contract for parallel development. `EXISTING` means the endpoint is on `main` today. `PROPOSED` means it must not be represented as implemented until its API, tests, and web flow land. Developer 3 owns contract changes and database-facing implementation.

## Conventions

- Base URL is the server-only `API_URL`; the browser never calls the API directly.
- Every endpoint requires `Authorization: Bearer <accessToken>` unless marked public.
- `USER` is the existing candidate role. `RECRUITER` and the two-sided endpoints are proposed. `ADMIN` is reserved for administration and cannot be selected at sign-up.
- Errors use `{ statusCode: number, message: string, code?: string }`. Clients branch on `code`, never on message text.
- A resource owned by another user/company returns 404. A valid token with the wrong role returns 403.
- `SwipeDirection` is `"LIKE" | "SKIP"`; the UI may label these LIKE and NOPE.
- Job ids are stable strings for seeded demo jobs (`job-001`) and may be UUIDs for recruiter-created jobs. User, company, and match ids are UUIDs.
- JSON uses the API's camelCase response names. Validation uses the Nest global `ValidationPipe({ whitelist: true, transform: true })`.

## Shared response types

```ts
type Role = "USER" | "RECRUITER" | "ADMIN";
type SwipeDirection = "LIKE" | "SKIP";
type AiSource = "ai" | "fallback";

type MatchSummary = {
  score: number;                 // 0-100 profile fit, never a hiring probability
  matchedSkillIds: string[];
  unconfirmedSkillIds: string[];
  missingSkillIds: string[];
};

type CandidateCard = {
  candidateId: string;
  displayName: string;           // first name only before a match
  headline: string | null;
  education: string | null;
  experience: string | null;
  projects: string | null;
  skills: { id: string; name: string }[];
  match: MatchSummary;
};

type MutualMatch = {
  id: string;
  createdAt: string;
  job: Job;
  candidate: {
    candidateId: string;
    name: string;
    email: string;
    headline: string | null;
  };
};

type SwipeResult = {
  jobId: string;
  direction: SwipeDirection;
  matchCreated: boolean;
  match: { id: string; createdAt: string } | null;
  application?: { id: string; status: ApplicationStatus } | null;
};
```

`matchCreated` is true only when this swipe creates/completes the real mutual match. It is false for an ordinary LIKE, an ordinary SKIP, and a repeated/idempotent swipe after the match already exists. `match` is non-null only for the request that creates/completes the match. The API never returns a match from a score alone.

## Authentication and roles

### `POST /auth/register` - EXISTING, candidate only today; recruiter role PROPOSED

Current `main` request:

```json
{ "name": "Ann Example", "email": "ann@example.com", "password": "StrongPass1!" }
```

Proposed additive request:

```json
{
  "name": "Ann Example",
  "email": "ann@example.com",
  "password": "StrongPass1!",
  "accountType": "CANDIDATE"
}
```

`accountType` is optional and defaults to `CANDIDATE`; `CANDIDATE` maps to `USER`, `RECRUITER` maps to `RECRUITER`, and `ADMIN` is rejected. Response is the existing login session shape:

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "user": { "id": "uuid", "email": "ann@example.com", "name": "Ann Example", "role": "USER", "status": "ACTIVE", "createdAt": "..." }
}
```

Validation: 400 for invalid name/email/password/account type; 409 `EMAIL_TAKEN` for a duplicate email. The server normalizes email, trims name, and never accepts a role field from the client.

### `POST /auth/login`, `/auth/google`, `/auth/refresh`, `/auth/logout` - EXISTING

These keep the current request/response and throttling behavior. Login/refresh returns the role from the database, so a future role change is reflected in a new access token. Suspended accounts return 403 `ACCOUNT_SUSPENDED`; invalid credentials/session return 401 with stable error handling.

### `GET /users/me` - EXISTING

Authenticated `USER`, `RECRUITER`, or `ADMIN`; returns the public user record without password, token, or session internals.

## Candidate profile and jobs

All candidate endpoints below use `@Roles(Role.USER)` when role enforcement lands. Until then, the current `main` accepts any authenticated user; this is an implementation gap, not permission to expose recruiter data.

### `GET /candidates/me` - EXISTING

Returns the authenticated candidate's profile, listed skills, completeness, and update timestamp. No user id is supplied by the client.

### `PUT /candidates/me` - EXISTING

Replaces profile fields omitted by the form with empty/null values according to the current DTO contract.

```json
{
  "headline": "Junior frontend developer",
  "education": "BSc Computer Science",
  "experience": "Built a campus event portal.",
  "projects": "Created a TypeScript project.",
  "desiredRoles": ["Frontend Developer"],
  "preferredSalaryMin": 25000,
  "preferredWorkArrangement": "HYBRID",
  "skillIds": ["typescript", "react"]
}
```

Strings are trimmed and length-limited; salary is a non-negative integer or null; work arrangement is `ONSITE | HYBRID | REMOTE`; skill ids must exist. Invalid input returns 400. The operation is transactional so the profile and skill list stay together.

### `GET /jobs` and `GET /jobs/:id` - EXISTING, public

Return public `Job` records. Every demo job has `isDemo: true`; the web labels it. The current schema has no `companyId` or `isOpen`; those are proposed additive fields.

### `GET /jobs/discover` - EXISTING, candidate flow

Returns jobs not yet swiped by the authenticated user, sorted by deterministic fit score. Proposed behavior additionally filters `isOpen = true` and requires candidate role.

### `POST /jobs/:jobId/swipe` - EXISTING, response extension PROPOSED

Request:

```json
{ "direction": "LIKE" }
```

Current response includes `{ "jobId": "job-001", "direction": "LIKE", "application": { "id": "uuid", "status": "INTERESTED" } }` for LIKE and a null application for SKIP. The proposed response adds `matchCreated` and `match` as defined by `SwipeResult`.

Rules: the job must exist; the candidate's interaction is upserted; LIKE creates/preserves `INTERESTED` but never submits an application. The future mutual-match check runs after the swipe commit and never trusts a client-supplied candidate id.

### `DELETE /jobs/swipes` - EXISTING

Deletes the authenticated candidate's `JobInteraction` rows and returns `{ "cleared": 3 }`. It must not delete applications or mutual matches.

## Compatibility and Resume Coach

### `GET /jobs/:jobId/match` - EXISTING

Authenticated candidate; returns:

```json
{
  "job": { "id": "job-001", "title": "Frontend Developer", "isDemo": true },
  "match": {
    "score": 78,
    "breakdown": { "required": 70, "niceToHave": 0, "preferences": 8 },
    "matchedSkills": [{ "id": "react", "name": "React", "required": true }],
    "unconfirmedSkills": [{ "id": "typescript", "name": "TypeScript", "required": false, "reason": "MENTIONED_IN_PROFILE" }],
    "missingSkills": [],
    "preferenceFit": { "workArrangement": 1, "salary": 0.5, "role": 0.1 }
  },
  "aiEnabled": false
}
```

The score is deterministic and computed by the API. It is profile fit, not a percentage or hiring probability. `unconfirmedSkills` mean insufficient profile information, not confirmed gaps.

### `POST /jobs/:jobId/match/explanation` - EXISTING

Authenticated candidate, AI throttle, no request body. Returns:

```json
{
  "summary": "...",
  "strengths": ["..."],
  "gaps": ["..."],
  "nextSteps": ["..."],
  "source": "ai"
}
```

The server sends safe `MatchContext` to `AiService`. AI explains the computed result and does not recalculate it. `source` is `fallback` when no key, timeout, API error, refusal, or invalid output occurs. The request still succeeds.

### `POST /resume/coach` - EXISTING

Authenticated candidate, AI throttle.

```json
{ "jobId": "job-001" }
```

Returns `{ emphasize, bulletSuggestions, highlight, cautions, source }`. Suggestions use only facts already in the candidate profile and must not invent achievements, numbers, skills, or experience. Unknown job ids return 404 `JOB_NOT_FOUND`; invalid input returns 400.

## Recruiter profile, companies, and jobs - PROPOSED

The MVP has no separate recruiter profile model. The recruiter profile is the authenticated public `User` plus its one `Company` relation. A recruiter cannot choose a company id in a request.

### `GET /companies/me`

Role: `RECRUITER`. Returns `Company | null` for the caller's company.

### `PUT /companies/me`

Role: `RECRUITER`. Creates the company on first call, otherwise replaces editable fields and keeps the caller linked to it.

```json
{ "name": "North Star Labs (demo)", "description": "...", "website": "https://example.test" }
```

Returns `Company`. Validate non-empty name, trimmed bounded text, and a valid optional URL. A recruiter may belong to only one company in the MVP.

### `GET /recruiter/jobs`

Role: `RECRUITER`. Requires a company; otherwise 409 `COMPANY_REQUIRED`. Returns only the caller's jobs with `isOpen`, `likeCount`, and `matchCount`.

### `POST /recruiter/jobs`

Role: `RECRUITER`; requires a company. Request:

```json
{
  "title": "Frontend Developer",
  "location": "Bangkok",
  "workArrangement": "HYBRID",
  "employmentType": "FULL_TIME",
  "salaryMin": 30000,
  "salaryMax": 45000,
  "description": "Build accessible web products.",
  "skills": [
    { "id": "typescript", "required": true },
    { "id": "react", "required": false }
  ]
}
```

Validate 1-15 existing skills, salary ordering, enums, bounded trimmed text, and `UNKNOWN_SKILL` 400. Set `companyId` from the caller's database relation, `company` from the company name, and `isDemo = false`; never accept those authority fields from the body.

### `PATCH /recruiter/jobs/:jobId`

Role: `RECRUITER`. Accepts a partial create payload plus `isOpen`. A job outside the caller's company returns 404 `JOB_NOT_FOUND`; it never reveals whether the id exists.

## Recruiter candidate deck and swipes - PROPOSED

### `GET /recruiter/jobs/:jobId/candidates`

Role: `RECRUITER`. The job must belong to the caller's company and be open. Returns `CandidateCard[]`, best deterministic score first, only for candidates with at least one profile skill and no existing `CandidateInteraction` for that job. It never reveals the candidate's `JobInteraction` direction.

### `POST /recruiter/jobs/:jobId/candidates/:candidateId/swipe`

Role: `RECRUITER`. Request:

```json
{ "direction": "LIKE" }
```

The API verifies job ownership, candidate existence and candidate role, then upserts one decision for `(jobId, candidateId)`. It returns `SwipeResult` with the same `matchCreated`/`match` semantics as the candidate swipe. A recruiter cannot create a match directly.

Errors: 400 validation; 403 wrong role; 404 `JOB_NOT_FOUND` for an unauthorized job and `CANDIDATE_NOT_FOUND` for an unavailable candidate; 409 only for a database conflict not absorbed by idempotent upsert.

## Mutual matches - PROPOSED

### `GET /matches`

Role: `USER` or `RECRUITER`. Candidates receive their matches. Recruiters receive matches for jobs owned by their company. Contact fields are returned only because the mutual match is already confirmed.

### `GET /matches/:id`

Role: `USER` or `RECRUITER`. Returns one `MutualMatch` only when the caller is the candidate or an authorized recruiter for the job's company; otherwise 404.

There is deliberately no `POST`, `PATCH`, `DELETE`, unmatch, or block endpoint. Matches are created only as side effects of the two swipe endpoints. The database enforces one match per `(candidateId, jobId)`.

## MATCHBACK Bot - PROPOSED

### `POST /assistant/messages`

Role: `USER` for the MVP; recruiter access may be added only with an explicit contract update. AI throttle applies.

```json
{
  "messages": [
    { "role": "user", "content": "What should I clarify before applying?" }
  ],
  "jobId": "job-001"
}
```

Validation: 1-20 messages, roles `user | assistant`, each content at most 2000 characters, total request bounded, optional existing job id. The server is stateless and returns:

```json
{ "reply": "...", "source": "ai" }
```

With `jobId`, the service builds the same safe job/candidate `MatchContext` used by explanations. It can explain fit, requirements, unconfirmed information, resume improvements, interview questions, and career guidance. It must not invent facts, claim hiring odds, expose private fields, or call official U-Bot. AI failures use the deterministic fallback and still return 200.

## Error and idempotency rules

| Situation | Status/code |
|---|---|
| Malformed body/query/enum/length | 400 validation error |
| Unknown skill | 400 `UNKNOWN_SKILL` |
| Unknown job or unauthorized company job | 404 `JOB_NOT_FOUND` |
| Unknown candidate card target | 404 `CANDIDATE_NOT_FOUND` |
| Missing recruiter company | 409 `COMPANY_REQUIRED` |
| Duplicate email | 409 `EMAIL_TAKEN` |
| Wrong role | 403 from `RolesGuard` |
| Suspended account | 403 `ACCOUNT_SUSPENDED` |
| Invalid/expired access session | 401 |
| AI unavailable | Successful response with `source: "fallback"` |

Swipes are idempotent upserts. Repeating the same direction does not create duplicate interactions, applications, or matches. The match unique constraint and `createMany({ skipDuplicates: true })` absorb simultaneous match creation. Resetting candidate swipes does not delete matches.
