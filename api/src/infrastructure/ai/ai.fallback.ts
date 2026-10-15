import type {
  MatchContext,
  MatchExplanation,
  ResumeCoaching,
} from './ai.types';

/**
 * คำตอบแบบ deterministic ตอนไม่มี ANTHROPIC_API_KEY หรือ AI ล่ม/ปฏิเสธ
 * สร้างจากผล calculateMatch() ล้วน ไม่เดาอะไรเพิ่ม จึงไม่มีทาง "แต่ง" ทักษะให้ผู้สมัคร
 * ต้องคืนรูปร่างเดียวกับคำตอบของ AI เสมอ (ดู ai.types.ts)
 */

const names = (skills: { name: string }[]) =>
  skills.map((skill) => skill.name).join(', ');

export function fallbackExplanation({
  job,
  match,
}: MatchContext): MatchExplanation {
  const strengths =
    match.matchedSkills.length > 0
      ? [
          `Your profile lists ${names(match.matchedSkills)}, which this role asks for.`,
        ]
      : [];

  const missingRequired = match.missingSkills.filter((skill) => skill.required);
  const gaps = [
    ...(missingRequired.length > 0
      ? [
          `Required skills not shown in your profile: ${names(missingRequired)}.`,
        ]
      : []),
    ...(match.unconfirmedSkills.length > 0
      ? [
          `Not enough information about: ${names(match.unconfirmedSkills)}. These are not counted as gaps yet.`,
        ]
      : []),
  ];

  const nextSteps = [
    ...match.unconfirmedSkills
      .filter((skill) => skill.reason === 'MENTIONED_IN_PROFILE')
      .map(
        (skill) =>
          `Your profile mentions ${skill.name} — add it to your skills if you can back it up.`,
      ),
    ...(match.unconfirmedSkills.some(
      (skill) => skill.reason === 'NO_SKILLS_LISTED',
    )
      ? [
          'List your skills on the Profile page so the match can be calculated properly.',
        ]
      : []),
    ...missingRequired.map(
      (skill) =>
        `Build evidence of ${skill.name} with a small project or course before applying.`,
    ),
  ];

  return {
    summary: `Match score ${match.score}/100 for ${job.title} at ${job.company}, based on the skills and preferences in your profile. This is not a prediction of whether you will be hired.`,
    strengths,
    gaps,
    nextSteps:
      nextSteps.length > 0
        ? nextSteps
        : ['Tailor your resume to the job description before applying.'],
    source: 'fallback',
  };
}

export function fallbackCoaching({ match }: MatchContext): ResumeCoaching {
  return {
    emphasize: match.matchedSkills.map(
      (skill) =>
        `Put ${skill.name} near the top of your resume with a concrete example.`,
    ),
    bulletSuggestions: [],
    highlight: match.unconfirmedSkills
      .filter((skill) => skill.reason === 'MENTIONED_IN_PROFILE')
      .map(
        (skill) =>
          `Your experience or projects mention ${skill.name} — describe what you did with it and the result.`,
      ),
    cautions: match.missingSkills
      .filter((skill) => skill.required)
      .map(
        (skill) =>
          `Do not claim ${skill.name} unless you have real experience with it.`,
      ),
    source: 'fallback',
  };
}
