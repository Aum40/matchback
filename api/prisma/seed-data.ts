/**
 * ข้อมูลเดโมของ MATCHBACK — บริษัทและประกาศงานทั้งหมดเป็นของสมมติ (Job.isDemo = true)
 * id ทุกตัวคงที่: seed รันซ้ำได้ (upsert) และเทสต์/เอกสารอ้างถึงได้
 * อย่าใส่ชื่อบริษัทจริง — เดโมต้องไม่ทำให้คนเข้าใจว่าเป็นประกาศจริงของบริษัทนั้น
 */

export const SKILLS = [
  // Frontend
  { id: 'html', name: 'HTML', category: 'Frontend' },
  { id: 'css', name: 'CSS', category: 'Frontend' },
  { id: 'javascript', name: 'JavaScript', category: 'Frontend' },
  { id: 'typescript', name: 'TypeScript', category: 'Frontend' },
  { id: 'react', name: 'React', category: 'Frontend' },
  { id: 'nextjs', name: 'Next.js', category: 'Frontend' },
  { id: 'tailwind', name: 'Tailwind CSS', category: 'Frontend' },
  // Backend
  { id: 'nodejs', name: 'Node.js', category: 'Backend' },
  { id: 'nestjs', name: 'NestJS', category: 'Backend' },
  { id: 'python', name: 'Python', category: 'Backend' },
  { id: 'java', name: 'Java', category: 'Backend' },
  { id: 'rest-api', name: 'REST API', category: 'Backend' },
  { id: 'sql', name: 'SQL', category: 'Backend' },
  { id: 'postgresql', name: 'PostgreSQL', category: 'Backend' },
  // Data
  { id: 'excel', name: 'Excel', category: 'Data' },
  { id: 'power-bi', name: 'Power BI', category: 'Data' },
  { id: 'pandas', name: 'pandas', category: 'Data' },
  { id: 'statistics', name: 'Statistics', category: 'Data' },
  { id: 'machine-learning', name: 'Machine Learning', category: 'Data' },
  // DevOps
  { id: 'git', name: 'Git', category: 'Tools' },
  { id: 'docker', name: 'Docker', category: 'Tools' },
  { id: 'testing', name: 'Testing', category: 'Tools' },
  { id: 'aws', name: 'AWS', category: 'Tools' },
  // Design & product
  { id: 'figma', name: 'Figma', category: 'Design & Product' },
  { id: 'ux-research', name: 'UX Research', category: 'Design & Product' },
  { id: 'agile', name: 'Agile', category: 'Design & Product' },
  // Business & soft skills
  { id: 'communication', name: 'Communication', category: 'Business' },
  { id: 'english', name: 'English', category: 'Business' },
  { id: 'digital-marketing', name: 'Digital Marketing', category: 'Business' },
  { id: 'seo', name: 'SEO', category: 'Business' },
] as const;

export type SkillId = (typeof SKILLS)[number]['id'];

type SeedJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  workArrangement: 'ONSITE' | 'HYBRID' | 'REMOTE';
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  required: SkillId[];
  niceToHave: SkillId[];
};

export const JOBS: SeedJob[] = [
  {
    id: 'job-001',
    title: 'Junior Frontend Developer',
    company: 'Lumen Pixel Studio (demo)',
    location: 'Bangkok',
    workArrangement: 'HYBRID',
    employmentType: 'FULL_TIME',
    salaryMin: 28000,
    salaryMax: 40000,
    description:
      'Build responsive web screens for client projects with a small product team. You will turn Figma designs into accessible React components and fix UI bugs reported by QA.',
    required: ['html', 'css', 'javascript', 'react'],
    niceToHave: ['typescript', 'figma', 'git'],
  },
  {
    id: 'job-002',
    title: 'Frontend Developer (Next.js)',
    company: 'Orbit Commerce (demo)',
    location: 'Bangkok',
    workArrangement: 'REMOTE',
    employmentType: 'FULL_TIME',
    salaryMin: 40000,
    salaryMax: 60000,
    description:
      'Own storefront pages for an e-commerce platform. Work with TypeScript, Next.js and Tailwind, and measure page performance with the team.',
    required: ['typescript', 'react', 'nextjs'],
    niceToHave: ['tailwind', 'testing', 'seo'],
  },
  {
    id: 'job-003',
    title: 'Backend Developer Intern',
    company: 'Northwind Logistics Tech (demo)',
    location: 'Chiang Mai',
    workArrangement: 'ONSITE',
    employmentType: 'INTERNSHIP',
    salaryMin: 12000,
    salaryMax: 15000,
    description:
      'Six-month internship building internal REST APIs for shipment tracking. Mentored by senior engineers; strong fundamentals matter more than years of experience.',
    required: ['nodejs', 'rest-api', 'sql'],
    niceToHave: ['nestjs', 'git', 'docker'],
  },
  {
    id: 'job-004',
    title: 'Junior Backend Engineer (NestJS)',
    company: 'Paywise Fintech (demo)',
    location: 'Bangkok',
    workArrangement: 'HYBRID',
    employmentType: 'FULL_TIME',
    salaryMin: 35000,
    salaryMax: 50000,
    description:
      'Develop and test payment-related services in NestJS and PostgreSQL. You will write unit tests and take part in code review from day one.',
    required: ['typescript', 'nestjs', 'postgresql', 'testing'],
    niceToHave: ['docker', 'aws', 'git'],
  },
  {
    id: 'job-005',
    title: 'Full-Stack Developer',
    company: 'Greenleaf EdTech (demo)',
    location: 'Bangkok',
    workArrangement: 'REMOTE',
    employmentType: 'FULL_TIME',
    salaryMin: 45000,
    salaryMax: 70000,
    description:
      'Ship features end to end on a learning platform used by schools: React on the front, Node.js APIs and PostgreSQL on the back.',
    required: ['typescript', 'react', 'nodejs', 'postgresql'],
    niceToHave: ['nextjs', 'docker', 'agile'],
  },
  {
    id: 'job-006',
    title: 'Data Analyst (Entry Level)',
    company: 'Riverside Retail Group (demo)',
    location: 'Bangkok',
    workArrangement: 'ONSITE',
    employmentType: 'FULL_TIME',
    salaryMin: 25000,
    salaryMax: 35000,
    description:
      'Prepare weekly sales reports and dashboards for store managers. Clean data in SQL and Excel and explain findings to non-technical teams.',
    required: ['sql', 'excel', 'communication'],
    niceToHave: ['power-bi', 'statistics', 'python'],
  },
  {
    id: 'job-007',
    title: 'Junior Data Scientist',
    company: 'Insightloop Analytics (demo)',
    location: 'Bangkok',
    workArrangement: 'HYBRID',
    employmentType: 'FULL_TIME',
    salaryMin: 40000,
    salaryMax: 55000,
    description:
      'Build and evaluate simple predictive models for marketing clients. Expect to spend most of your time on data cleaning and clear communication of results.',
    required: ['python', 'pandas', 'statistics', 'sql'],
    niceToHave: ['machine-learning', 'english'],
  },
  {
    id: 'job-008',
    title: 'BI Analyst Intern',
    company: 'Coastline Hotels Group (demo)',
    location: 'Phuket',
    workArrangement: 'ONSITE',
    employmentType: 'INTERNSHIP',
    salaryMin: 10000,
    salaryMax: 12000,
    description:
      'Support the revenue team with Power BI reports on occupancy and bookings. A good fit for students in statistics, economics or IT.',
    required: ['excel', 'power-bi'],
    niceToHave: ['sql', 'english'],
  },
  {
    id: 'job-009',
    title: 'UX/UI Designer (Junior)',
    company: 'Lumen Pixel Studio (demo)',
    location: 'Bangkok',
    workArrangement: 'HYBRID',
    employmentType: 'FULL_TIME',
    salaryMin: 28000,
    salaryMax: 38000,
    description:
      'Design mobile and web flows, run quick usability tests and hand off clean Figma files to developers.',
    required: ['figma', 'ux-research'],
    niceToHave: ['html', 'css', 'communication'],
  },
  {
    id: 'job-010',
    title: 'QA Engineer (Junior)',
    company: 'Orbit Commerce (demo)',
    location: 'Bangkok',
    workArrangement: 'HYBRID',
    employmentType: 'FULL_TIME',
    salaryMin: 25000,
    salaryMax: 35000,
    description:
      'Write test cases, run regression tests before releases and help automate the most repeated checks.',
    required: ['testing', 'communication'],
    niceToHave: ['javascript', 'git', 'agile'],
  },
  {
    id: 'job-011',
    title: 'Cloud Support Associate',
    company: 'Stratus Cloud Services (demo)',
    location: 'Bangkok',
    workArrangement: 'ONSITE',
    employmentType: 'FULL_TIME',
    salaryMin: 30000,
    salaryMax: 42000,
    description:
      'Help customers troubleshoot deployments on AWS and containerised apps. Shift work with a structured training program.',
    required: ['aws', 'docker', 'english'],
    niceToHave: ['python', 'git'],
  },
  {
    id: 'job-012',
    title: 'Digital Marketing Executive',
    company: 'Riverside Retail Group (demo)',
    location: 'Bangkok',
    workArrangement: 'HYBRID',
    employmentType: 'FULL_TIME',
    salaryMin: 25000,
    salaryMax: 32000,
    description:
      'Plan and report on online campaigns, improve product pages for search, and coordinate with the design team.',
    required: ['digital-marketing', 'communication'],
    niceToHave: ['seo', 'excel', 'english'],
  },
  {
    id: 'job-013',
    title: 'Java Developer (Graduate Program)',
    company: 'Paywise Fintech (demo)',
    location: 'Bangkok',
    workArrangement: 'ONSITE',
    employmentType: 'FULL_TIME',
    salaryMin: 32000,
    salaryMax: 42000,
    description:
      'Twelve-month graduate program rotating across backend teams that maintain core banking integrations written in Java.',
    required: ['java', 'sql', 'git'],
    niceToHave: ['rest-api', 'testing', 'english'],
  },
  {
    id: 'job-014',
    title: 'Part-time Web Developer',
    company: 'Greenleaf EdTech (demo)',
    location: 'Remote (Thailand)',
    workArrangement: 'REMOTE',
    employmentType: 'PART_TIME',
    salaryMin: null,
    salaryMax: null,
    description:
      'Flexible 20 hours per week maintaining marketing pages. Suitable for final-year students. Pay discussed at interview.',
    required: ['html', 'css', 'javascript'],
    niceToHave: ['nextjs', 'tailwind', 'seo'],
  },
  {
    id: 'job-015',
    title: 'Product Analyst',
    company: 'Insightloop Analytics (demo)',
    location: 'Bangkok',
    workArrangement: 'REMOTE',
    employmentType: 'CONTRACT',
    salaryMin: 45000,
    salaryMax: 60000,
    description:
      'Six-month contract analysing product usage data and running experiments with product managers.',
    required: ['sql', 'statistics', 'communication'],
    niceToHave: ['python', 'agile', 'power-bi'],
  },
];

/** โปรไฟล์ผู้สมัครตัวอย่าง (ข้อมูลสมมติ) — จงใจให้มีทั้งทักษะที่ตรง ทักษะที่แค่ถูกพูดถึง และช่องว่าง */
export const DEMO_PROFILE = {
  name: 'Demo Candidate',
  headline:
    'Final-year Computer Science student looking for a first frontend role',
  education: 'B.Sc. Computer Science (expected 2027), demo university',
  experience:
    'Teaching assistant for an intro web programming course: helped 40 students debug HTML, CSS and JavaScript.\nSummer intern at a small agency: fixed layout bugs and built two landing pages.',
  projects:
    'Club event website built with React and TypeScript, deployed for the student union.\nPersonal budget tracker using Next.js and a PostgreSQL database.',
  desiredRoles: ['Frontend Developer', 'Full-Stack Developer'],
  preferredSalaryMin: 30000,
  preferredWorkArrangement: 'HYBRID' as const,
  // TypeScript, Next.js, PostgreSQL ไม่ได้ติ๊ก แต่ถูกพูดถึงในโปรเจกต์ → โชว์สถานะ "unconfirmed"
  skillIds: [
    'html',
    'css',
    'javascript',
    'react',
    'git',
    'communication',
  ] satisfies SkillId[],
};

/**
 * บริษัทสมมติ ชื่อต้องตรงกับ Job.company ในรายการ JOBS ทุกตัว (seed ใช้ชื่อจับคู่งานกับเจ้าของ)
 * id เป็น uuid คงที่: seed upsert ซ้ำได้ และ recruiter เดโมผูกกับบริษัทเดิมทุกครั้ง
 */
export const COMPANIES = [
  {
    id: '0b9a1d10-0000-4000-8000-000000000001',
    name: 'Lumen Pixel Studio (demo)',
    description:
      'Small product studio building web and mobile apps for clients.',
  },
  {
    id: '0b9a1d10-0000-4000-8000-000000000002',
    name: 'Orbit Commerce (demo)',
    description: 'E-commerce platform for mid-sized online shops.',
  },
  {
    id: '0b9a1d10-0000-4000-8000-000000000003',
    name: 'Northwind Logistics Tech (demo)',
    description: 'Shipment tracking software for regional carriers.',
  },
  {
    id: '0b9a1d10-0000-4000-8000-000000000004',
    name: 'Paywise Fintech (demo)',
    description: 'Payment services and banking integrations.',
  },
  {
    id: '0b9a1d10-0000-4000-8000-000000000005',
    name: 'Greenleaf EdTech (demo)',
    description: 'Learning platform used by schools.',
  },
  {
    id: '0b9a1d10-0000-4000-8000-000000000006',
    name: 'Riverside Retail Group (demo)',
    description: 'Retail chain with stores and an online shop.',
  },
  {
    id: '0b9a1d10-0000-4000-8000-000000000007',
    name: 'Insightloop Analytics (demo)',
    description: 'Analytics consultancy for marketing teams.',
  },
  {
    id: '0b9a1d10-0000-4000-8000-000000000008',
    name: 'Coastline Hotels Group (demo)',
    description: 'Hotel group with properties in southern Thailand.',
  },
  {
    id: '0b9a1d10-0000-4000-8000-000000000009',
    name: 'Stratus Cloud Services (demo)',
    description: 'Managed cloud hosting and support.',
  },
] as const;

/** recruiter เดโม: สังกัดบริษัทที่เป็นเจ้าของ job-001 (งานที่ใช้ในสคริปต์เดโม) */
export const DEMO_RECRUITER = {
  name: 'Demo Recruiter',
  companyId: COMPANIES[0].id,
};

/**
 * ผู้สมัครคนที่สอง: กด LIKE job-001 ไว้แล้วตั้งแต่ seed
 * พอ recruiter เดโม LIKE คนนี้บนเวที จะเกิด mutual match จริงทันที (ทั้งสองฝั่งเป็นการปัดจริงใน DB)
 */
export const DEMO_CANDIDATE_2 = {
  name: 'Ploy Demo',
  headline: 'Recent graduate building accessible React interfaces',
  education: 'B.Eng. Software Engineering (2026), demo university',
  experience:
    'Frontend intern at a fintech startup for 6 months: built React forms with TypeScript and wrote component tests.',
  projects:
    'Accessible recipe finder in React with keyboard navigation.\nPortfolio site designed in Figma and built with HTML and CSS.',
  desiredRoles: ['Frontend Developer'],
  preferredSalaryMin: 28000,
  preferredWorkArrangement: 'HYBRID' as const,
  skillIds: [
    'html',
    'css',
    'javascript',
    'typescript',
    'react',
    'figma',
    'git',
    'testing',
  ] satisfies SkillId[],
  likedJobIds: ['job-001'],
};
