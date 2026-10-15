# MATCHBACK API contract

> This is the shared HTTP contract for parallel development. "IMPLEMENTED" describes behavior on main today. "PROPOSED" describes behavior that must not be presented as complete until its API, tests, authorization, and web flow land. Developer 3 owns this file and web/src/lib/api/api.type.ts; other developers propose changes through that owner.

## Conventions

- The base URL is the server-only API_URL; the browser never calls the API directly.
- Every endpoint requires Authorization: Bearer <accessToken> unless marked public.
- USER is the existing candidate role. RECRUITER is proposed. ADMIN is reserved for administration and cannot be selected at sign-up.
- Current controllers do not yet apply candidate @Roles(Role.USER) decorators. Where this contract says USER, that is the required proposed authorization, not a claim about the current implementation.
- Errors use { statusCode: number, message: string, code?: string }. Clients branch on stable code, never message text. Existing paths without a code must be normalized when they are next touched.
- A resource owned by another user/company returns 404. A valid token with the wrong role returns 403.
- SwipeDirection is "LIKE" | "SKIP"; the UI may label these LIKE and PASS/NOPE.
- Job ids are stable strings for seeded demo jobs (job-001) and may be UUIDs for recruiter-created jobs. User, company, application, and match ids are UUIDs.
- JSON uses camelCase response names except the existing auth token fields access_token and refresh_token.
- Validation uses the Nest global ValidationPipe({ whitelist: true, transform: true }).
- There are no photo/logo/image fields or upload endpoints. Candidate cards and company records are text-first.
- There is no direct candidate-recruiter messaging endpoint. MATCHBACK Bot is the only chat experience.

## Shared schemas

### Enums

~~~ts
type Role = "USER" | "RECRUITER" | "ADMIN";
type UserStatus = "ACTIVE" | "SUSPENDED";
type WorkArrangement = "ONSITE" | "HYBRID" | "REMOTE";
type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
type SwipeDirection = "LIKE" | "SKIP";
type ApplicationStatus = "INTERESTED" | "APPLIED" | "INTERVIEWING" | "REJECTED" | "OFFER";
type JobStatus = "DRAFT" | "PUBLISHED" | "CLOSED"; // PROPOSED
type AiSource = "ai" | "fallback";
~~~

### Implemented catalog and user schemas

~~~ts
type Skill = {
  id: string;       // stable slug, e.g. "typescript"
  name: string;
  category: string;
};

type JobSkill = {
  id: string;
  name: string;
  required: boolean;
};

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  workArrangement: WorkArrangement;
  employmentType: EmploymentType;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  isDemo: boolean;
  skills: JobSkill[];
  // PROPOSED managed-job fields; absent from current main responses:
  // companyId?: string | null;
  // status?: JobStatus;
};

type PublicUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
};

type CandidateProfile = {
  headline: string | null;
  education: string | null;
  experience: string | null;
  projects: string | null;
  desiredRoles: string[];
  preferredSalaryMin: number | null;
  preferredWorkArrangement: WorkArrangement | null;
  skills: { id: string; name: string }[];
  isComplete: boolean;
  updatedAt: string | null;
};

type Application = {
  id: string;
  status: ApplicationStatus;
  notes: string | null;
  employerFeedback: string | null;
  createdAt: string;
  updatedAt: string;
  job: Job;
};
~~~

isDemo: true means fictional seeded data and must be shown as Demo data; it never means that a job is a real vacancy. Recruiter-created records are not seeded demo data. Any fictional recruiter records used in the hackathon walkthrough must be labeled as demo records separately.

### Compatibility schemas

~~~ts
type MatchSummary = {
  score: number; // integer 0-100 profile fit, never hiring probability
  matchedSkillIds: string[];
  unconfirmedSkillIds: string[];
  missingSkillIds: string[];
};

type DiscoverJob = Job & { match: MatchSummary };

type UnconfirmedSkill = JobSkill & {
  reason: "MENTIONED_IN_PROFILE" | "NO_SKILLS_LISTED";
};

type MatchResult = {
  score: number;
  breakdown: { required: number; niceToHave: number; preferences: number };
  matchedSkills: JobSkill[];
  unconfirmedSkills: UnconfirmedSkill[];
  missingSkills: JobSkill[];
  preferenceFit: { workArrangement: number; salary: number; role: number };
};

type JobMatchResponse = {
  job: Job;
  match: MatchResult;
  aiEnabled: boolean;
};
~~~

The API computes score = round(70 * requiredRatio + 15 * niceToHaveRatio + 15 * preferenceFit), clamped to 0-100. AI explains this result and provides recommendations; it never calculates or changes it. The score is not a hiring probability and is not a mutual match.

### AI schemas

~~~ts
type MatchExplanation = {
  summary: string;
  strengths: string[];
  gaps: string[];
  nextSteps: string[];
  source: AiSource;
};

type ResumeCoaching = {
  emphasize: string[];
  bulletSuggestions: {
    original: string | null;
    suggestion: string;
    reason: string;
  }[];
  highlight: string[];
  cautions: string[];
  source: AiSource;
};
~~~

AI output is validated by zod and uses only candidate-provided facts. It must not invent qualifications, achievements, numbers, employers, or experience.

### Proposed recruiter and match schemas

~~~ts
type Company = {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
};

type RecruiterJob = Job & {
  companyId: string;
  status: JobStatus;
  likeCount: number;
  matchCount: number;
};

type CandidateCard = {
  candidateId: string;
  displayName: string; // first name only before a mutual match
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
  isMatched: boolean;
  matchId: string | null;
  application: { id: string; status: ApplicationStatus } | null;
};

type AssistantResponse = {
  reply: string;
  source: AiSource;
};
~~~

Before a match, CandidateCard contains no email, surname/full name, photo, logo, or candidate LIKE/SKIP decision. Contact details are returned only in MutualMatch after the backend confirms both LIKEs.

## Authentication and session endpoints

### POST /auth/register - IMPLEMENTED request; recruiter role PROPOSED

Current main accepts:

~~~json
{ "name": "Ann Example", "email": "ann@example.com", "password": "StrongPass1!" }
~~~

The proposed additive body is:

~~~json
{
  "name": "Ann Example",
  "email": "ann@example.com",
  "password": "StrongPass1!",
  "accountType": "CANDIDATE"
}
~~~

accountType defaults to CANDIDATE, maps to role USER, and may also be RECRUITER. ADMIN is rejected. Name is trimmed and max 100 characters; email is normalized and max 254 characters; password is 8-72 printable ASCII characters with upper, lower, number, and special character. The current implementation does not accept accountType yet.

Response:

~~~json
{
  "access_token": "...",
  "refresh_token": "...",
  "user": {
    "id": "uuid",
    "email": "ann@example.com",
    "name": "Ann Example",
    "role": "USER",
    "status": "ACTIVE",
    "createdAt": "2026-10-15T00:00:00.000Z"
  }
}
~~~

Errors: 400 validation; 409 EMAIL_TAKEN. Google-created accounts always use USER in the proposed role model.

### POST /auth/login - IMPLEMENTED, public

Request { "email": "ann@example.com", "password": "StrongPass1!" }; email is normalized and both fields are required. Returns the session shape above. Invalid credentials return 401 without revealing whether the email exists. Suspended users return 403 ACCOUNT_SUSPENDED.

### POST /auth/google - IMPLEMENTED, public

Request { "idToken": "<Google id token>" }; idToken is required and max 4096 characters. Returns the session shape. Google sign-up creates a candidate (USER), not a recruiter.

### POST /auth/refresh and POST /auth/logout - IMPLEMENTED, public

Request { "refreshToken": "..." }, max 200 characters. Refresh rotates the token and returns the current user role. Logout revokes the supplied refresh token and returns { "message": "Logged out" }. Invalid sessions return 401; suspended accounts return 403 ACCOUNT_SUSPENDED.

### GET /users/me - IMPLEMENTED, authenticated

Returns PublicUser for the token subject. This is the recruiter identity endpoint; no separate recruiter profile model or endpoint is needed. The API excludes password, Google id, session version, and deleted users.

### GET /health - IMPLEMENTED, public

Returns { "status": "ok" }.

## Public catalog endpoints

### GET /skills - IMPLEMENTED, public

Returns Skill[], ordered by category and then name:

~~~json
[{ "id": "typescript", "name": "TypeScript", "category": "Programming" }]
~~~

### GET /jobs - IMPLEMENTED today; visibility filtering PROPOSED

Returns Job[] using the current schema. The current implementation returns seeded rows. After the proposed publication field lands, it returns only PUBLISHED jobs; existing seeded demo rows are treated as PUBLISHED.

### GET /jobs/:id - IMPLEMENTED today; visibility filtering PROPOSED

Returns one Job or 404 JOB_NOT_FOUND. After publication states land, draft/closed jobs are available through recruiter-owned management routes only; public candidates receive 404 for them.

## Candidate endpoints

The following endpoints are implemented for authenticated users today. The required target authorization is @Roles(Role.USER); Developer 3 adds those decorators as part of the proposed role work.

### GET /candidates/me - IMPLEMENTED

Returns CandidateProfile. A missing profile is a 200 response with null/empty fields, skills: [], isComplete: false, and updatedAt: null.

### PUT /candidates/me - IMPLEMENTED

Replaces the profile and skill list transactionally. Body fields are optional in the DTO; the current service treats omitted text as null, omitted desiredRoles as [], omitted preferences as null, and omitted skillIds as [].

~~~json
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
~~~

Validation: text max lengths are headline 150, education 2000, experience/projects 4000; at most 5 desired roles of 100 characters each; at most 50 skill ids; salary is a non-negative integer or null; arrangement is a valid enum. Unknown skill ids return 400 UNKNOWN_SKILL.

### GET /jobs/discover - IMPLEMENTED today; candidate visibility filtering PROPOSED

Returns DiscoverJob[] for jobs not yet swiped by the authenticated user, sorted by deterministic score. The proposed behavior requires USER and returns only status = PUBLISHED jobs.

### POST /jobs/:jobId/swipe - IMPLEMENTED today; mutual fields PROPOSED

Request (direction is required and must be `LIKE` or `SKIP`):

~~~json
{ "direction": "LIKE" }
~~~

Current response:

~~~json
{
  "jobId": "job-001",
  "direction": "LIKE",
  "application": { "id": "uuid", "status": "INTERESTED" }
}
~~~

SKIP returns application: null. A LIKE upserts JobInteraction and creates/preserves an INTERESTED application; it never submits an external application. The proposed response adds matchCreated, isMatched, and matchId as SwipeResult.

### DELETE /jobs/swipes - IMPLEMENTED today; candidate role PROPOSED

Returns { "cleared": number }. It deletes only the authenticated user's candidate swipe rows. It does not delete applications or mutual matches.

### GET /jobs/:jobId/match - IMPLEMENTED

Returns JobMatchResponse. It calculates the score on every request and does not call AI. The score is profile fit, not a percentage, hiring probability, or mutual match.

### POST /jobs/:jobId/match/explanation - IMPLEMENTED

Authenticated candidate target, AI throttle, no body. Returns MatchExplanation. AI explains the precomputed score and uses only safe profile/job facts. Missing key, timeout, API error, refusal, or invalid output returns 200 with source: "fallback".

### POST /resume/coach - IMPLEMENTED

Authenticated candidate target, AI throttle. Body { "jobId": "job-001" }; job id is required, string, and max 100 characters. Returns ResumeCoaching. Suggestions must use only profile facts and may not invent achievements, metrics, experience, or qualifications. AI failures return a successful fallback response.

### GET /applications - IMPLEMENTED

Authenticated candidate target. Optional query status is one ApplicationStatus. Returns applications owned by the caller, newest updated first:

~~~json
{
  "id": "uuid",
  "status": "INTERESTED",
  "notes": null,
  "employerFeedback": null,
  "createdAt": "2026-10-15T00:00:00.000Z",
  "updatedAt": "2026-10-15T00:00:00.000Z",
  "job": { "id": "job-001", "title": "Frontend Developer", "company": "Lumen Pixel Studio (demo)", "location": "Bangkok", "workArrangement": "HYBRID", "employmentType": "FULL_TIME", "salaryMin": 30000, "salaryMax": 45000, "description": "...", "isDemo": true, "skills": [] }
}
~~~

### PATCH /applications/:id - IMPLEMENTED

Authenticated candidate target; ownership is scoped by userId, so another user's id returns 404 APPLICATION_NOT_FOUND.

~~~json
{ "status": "APPLIED", "notes": "Submitted through the company site.", "employerFeedback": "Waiting for an update." }
~~~

All fields are optional. Status is an enum; notes and employer feedback are trimmed strings max 2000 characters. Blank text clears the field. Returns the updated Application.

### DELETE /applications/:id - IMPLEMENTED

Authenticated candidate target. Returns { "id": "uuid", "deleted": true }, or 404 APPLICATION_NOT_FOUND. This is a self-reported tracker row and is not an employer action.

## Admin endpoints

### GET /admin/users - IMPLEMENTED, ADMIN only

Optional query parameters: search trimmed string max 100; page integer min 1, default 1; limit integer 1-100, default 20. Returns:

~~~json
{
  "items": [
    {
      "id": "uuid",
      "email": "ann@example.com",
      "name": "Ann Example",
      "role": "USER",
      "status": "ACTIVE",
      "createdAt": "2026-10-15T00:00:00.000Z"
    }
  ],
  "total": 42,
  "page": 1,
  "totalPages": 3
}
~~~

Deleted users are excluded. Wrong roles return 403.

### PATCH /admin/users/:id/status - IMPLEMENTED, ADMIN only

Request { "status": "SUSPENDED" } or { "status": "ACTIVE" }. The id must be a UUID. Admins cannot change their own status (400); unknown users return 404. Suspending a user revokes all refresh tokens and future requests return ACCOUNT_SUSPENDED.

## Recruiter identity, company, and jobs - PROPOSED

Recruiter identity is GET /users/me. The MVP has no separate recruiter profile model. Company information is managed through the following endpoints, and the caller's company relation is loaded from the database rather than accepted from request JSON.

### GET /companies/me - PROPOSED

Role RECRUITER. Returns `Company | null`.

### PUT /companies/me - PROPOSED

Role RECRUITER. Creates the caller's one company on first call or updates it thereafter.

~~~json
{ "name": "North Star Labs", "description": "Builds web products.", "website": "https://example.test" }
~~~

Returns `Company`. Name is required, trimmed, and max 150 characters; description is optional, trimmed, and max 4,000 characters; website is optional, trimmed, and max 2,048 characters with a valid `http` or `https` URL. No logo/image field exists. A recruiter may belong to only one company in the MVP. Unknown fields are rejected by the whitelist validation pipe.

### GET /recruiter/jobs - PROPOSED

Role RECRUITER. Requires a company; otherwise 409 COMPANY_REQUIRED. Returns `RecruiterJob[]` for the caller's company in any status, with `status`, `companyId`, `likeCount`, and `matchCount`.

### POST /recruiter/jobs - PROPOSED

Role RECRUITER; requires a company. A new job starts as DRAFT.

~~~json
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
~~~

Returns the created `RecruiterJob`. Validate trimmed title and location (max 150 characters each), description (max 4,000 characters), enum values, non-negative integer salaries with salaryMin <= salaryMax, and 1-15 unique existing skills. Unknown ids return 400 UNKNOWN_SKILL. The API sets companyId, display company, isDemo: false, and status: DRAFT; clients cannot submit those authority fields.

### PATCH /recruiter/jobs/:jobId - PROPOSED

Role RECRUITER. Accepts a partial create payload plus optional status: DRAFT | PUBLISHED | CLOSED, and returns the updated `RecruiterJob`. The job must belong to the caller's company; otherwise return 404 JOB_NOT_FOUND. Recruiters can manage draft, published, and closed jobs. Only published jobs enter candidate discovery/public browsing.

## Recruiter candidate deck and swipes - PROPOSED

### GET /recruiter/jobs/:jobId/candidates - PROPOSED

Role RECRUITER. The job must belong to the caller's company and have `status = PUBLISHED`; otherwise return `409 JOB_NOT_PUBLISHED`. The endpoint returns `CandidateCard[]` with at least one listed skill and no existing CandidateInteraction for this job, ordered by deterministic score. It never reveals the candidate's JobInteraction and has no photo fields. Draft and closed jobs remain manageable through recruiter job-management endpoints, but they cannot open a candidate deck or accept recruiter swipes.

### POST /recruiter/jobs/:jobId/candidates/:candidateId/swipe - PROPOSED

Role RECRUITER. The job must belong to the caller's company and have `status = PUBLISHED`; otherwise return `409 JOB_NOT_PUBLISHED`. Request { "direction": "LIKE" | "SKIP" }. The API verifies job ownership, candidate existence, candidate role, and candidate privacy rules, then upserts one CandidateInteraction for (jobId, candidateId). It returns SwipeResult. There is no client-created match endpoint.

Errors: 400 validation; 403 wrong role; 404 JOB_NOT_FOUND for an unauthorized job and CANDIDATE_NOT_FOUND for an unavailable candidate; 409 JOB_NOT_PUBLISHED for a draft or closed job.

## Mutual matches - PROPOSED

### GET /matches - PROPOSED

Role USER or RECRUITER. Returns `MutualMatch[]`. Candidates receive their own matches. Recruiters receive matches for jobs owned by their company. Contact details are returned only because the match is already confirmed.

### GET /matches/:id - PROPOSED

Role USER or RECRUITER. Returns `MutualMatch` only when the caller is the candidate or an authorized recruiter for the job's company; otherwise 404.

There is no POST, PATCH, DELETE, unmatch, or block endpoint. Matches are created only by the two swipe services and have a database uniqueness constraint on (candidateId, jobId).

## Mutual-match retry and idempotency rules - PROPOSED

After the current swipe is committed, the service reads the other side. If both sides LIKE, it calls createMany({ skipDuplicates: true }) and uses the inserted-row count to set matchCreated:

- matchCreated: true means this request inserted a new match row.
- isMatched: true means a match row exists, whether created by this request, a concurrent request, or an earlier swipe.
- matchId is non-null whenever isMatched is true.
- matchCreated: false, isMatched: false, matchId: null means no mutual match exists yet.
- A later SKIP does not delete an existing match; it still returns isMatched: true and the existing matchId.
- Repeating a swipe is an idempotent upsert. It cannot create duplicate interactions, applications, or matches.

Client behavior:

1. On matchCreated: true, show the match celebration once and load the match by matchId.
2. If the request times out, retry the same swipe. If the retry returns isMatched: true but matchCreated: false, do not replay the creation celebration; refresh/open the existing match.
3. Never show "It's a Match!" from isMatched alone, from a high score, or from a candidate/recruiter LIKE without the API result.

## MATCHBACK Bot - PROPOSED

### POST /assistant/messages - PROPOSED

Role USER only for the hackathon MVP; recruiter Bot access is out of scope and must not be added without a separate contract decision. AI throttle applies.

Request:

~~~json
{
  "messages": [
    { "role": "user", "content": "What should I clarify before applying?" }
  ],
  "jobId": "job-001"
}
~~~

Validation and cost controls:

- 1-20 messages.
- Each message content is at most 2,000 characters.
- Combined message content is at most 20,000 characters; larger requests return 400 ASSISTANT_INPUT_TOO_LARGE.
- Roles are only user and assistant.
- jobId is optional but, when present, must identify an accessible job.
- The server sends only the minimum safe profile/job context, makes one model call per request, uses the configured AI_MODEL, caps generated output at 1,200 tokens, and applies the AI throttle. The client cannot choose a model or token budget.
- Conversation history is not persisted. The server does not expose the API key, user id, email, or private recruiter data to the prompt.

Response:

~~~json
{ "reply": "...", "source": "ai" }
~~~

The response is `AssistantResponse`; `source` is `fallback` when the deterministic fallback was used.

The Bot can explain fit, requirements, unconfirmed information, resume improvements, interview questions, and career guidance. It must not invent facts, claim hiring odds, expose pre-match contact data, or call official U-Bot. Missing key, timeout, API error, refusal, or invalid output returns a deterministic context-based reply with source: "fallback" and does not fail the page.

## Job visibility and demo data

The current Job schema has no publication field and current seeded rows are publicly returned. The proposed schema adds status: DRAFT | PUBLISHED | CLOSED through a future migration:

| Status | Recruiter owner | Candidate discovery/public browsing |
|---|---|---|
| DRAFT | Can view/edit | Hidden |
| PUBLISHED | Can view/edit/close | Visible and eligible |
| CLOSED | Can view/edit/reopen | Hidden |

Existing seeded jobs are backfilled or treated as PUBLISHED so the current demo path remains intact. isDemo remains a fictional-data label and is not a visibility control. No seeded job may be described as a real vacancy.

## Error and authorization summary

| Situation | Status/code |
|---|---|
| Malformed body/query/enum/length | 400 validation error |
| Unknown skill | 400 UNKNOWN_SKILL |
| Assistant payload over limits | 400 ASSISTANT_INPUT_TOO_LARGE |
| Admin changes own status | 400, current message-only error |
| Unknown job or unauthorized company job | 404 JOB_NOT_FOUND |
| Unknown candidate card target | 404 CANDIDATE_NOT_FOUND |
| Application not owned by caller | 404 APPLICATION_NOT_FOUND |
| Missing recruiter company | 409 COMPANY_REQUIRED |
| Draft or closed recruiter job used for candidate deck/swipe | 409 JOB_NOT_PUBLISHED |
| Duplicate email | 409 EMAIL_TAKEN |
| Wrong role | 403 from RolesGuard |
| Suspended account | 403 ACCOUNT_SUSPENDED |
| Invalid/expired access session | 401 |
| AI unavailable | Successful response with source: "fallback" |

User-owned queries always use the authenticated subject id. Recruiter ownership always comes from the database. Prisma errors are mapped by PrismaExceptionFilter and database details are not exposed.
