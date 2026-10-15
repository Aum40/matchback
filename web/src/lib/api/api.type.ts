/** ต้องตรงกับ PUBLIC_USER_SELECT ใน api/src/users/users.service.ts */
/** USER = ผู้สมัคร (ชื่อเดิม), RECRUITER = ฝั่งบริษัท */
export type Role = "USER" | "RECRUITER" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED";

export type UserResponse = {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
};

export type LoginResponse = {
  /** อายุสั้น (ประมาณ 15 นาที) proxy.ts ต่ออายุให้เองด้วย refresh_token */
  access_token: string;
  refresh_token: string;
  user: UserResponse;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
};

// ---------------------------------------------------------------------------
// MATCHBACK — ต้องตรงกับคำตอบของ API (jobs.service.ts, match-score.ts, ai.types.ts)
// ---------------------------------------------------------------------------

export type WorkArrangement = "ONSITE" | "HYBRID" | "REMOTE";
export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
export type SwipeDirection = "LIKE" | "SKIP";
/** ผู้สมัครเห็นเฉพาะ PUBLISHED; DRAFT/CLOSED จัดการได้ทางหน้า recruiter เท่านั้น */
export type JobStatus = "DRAFT" | "PUBLISHED" | "CLOSED";
export type ApplicationStatus =
  | "INTERESTED"
  | "APPLIED"
  | "INTERVIEWING"
  | "REJECTED"
  | "OFFER";

export type Skill = { id: string; name: string; category: string };
export type JobSkill = { id: string; name: string; required: boolean };

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  workArrangement: WorkArrangement;
  employmentType: EmploymentType;
  /** บาท/เดือน null = ไม่ระบุ */
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  /** true = ข้อมูลตัวอย่าง ต้องติดป้ายบอกใน UI เสมอ */
  isDemo: boolean;
  skills: JobSkill[];
};

export type DiscoverJob = Job & {
  match: {
    score: number;
    matchedSkillIds: string[];
    missingSkillIds: string[];
    unconfirmedSkillIds: string[];
  };
};

export type UnconfirmedSkill = JobSkill & {
  reason: "MENTIONED_IN_PROFILE" | "NO_SKILLS_LISTED";
};

export type MatchResult = {
  score: number;
  breakdown: { required: number; niceToHave: number; preferences: number };
  matchedSkills: JobSkill[];
  unconfirmedSkills: UnconfirmedSkill[];
  missingSkills: JobSkill[];
  preferenceFit: { workArrangement: number; salary: number; role: number };
};

export type JobMatchResponse = {
  job: Job;
  match: MatchResult;
  aiEnabled: boolean;
};

/** source = "fallback": ไม่มี GEMINI_API_KEY หรือ AI ใช้ไม่ได้ในตอนนั้น (ล่ม, โควตาหมด, ตอบไม่ครบ) */
export type MatchExplanation = {
  summary: string;
  strengths: string[];
  gaps: string[];
  nextSteps: string[];
  source: "ai" | "fallback";
};

export type ResumeCoaching = {
  emphasize: string[];
  bulletSuggestions: { original: string | null; suggestion: string; reason: string }[];
  highlight: string[];
  cautions: string[];
  source: "ai" | "fallback";
};

export type CandidateProfile = {
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

export type Application = {
  id: string;
  status: ApplicationStatus;
  notes: string | null;
  employerFeedback: string | null;
  createdAt: string;
  updatedAt: string;
  job: Job;
};
