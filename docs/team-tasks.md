# MATCHBACK — งานของแต่ละคน (ฉบับส่งให้ AI)

> อัปเดต 15 ต.ค. 2026 · ส่งงาน **16 ต.ค. 14:00 ICT**
> วิธีใช้: แต่ละคน **copy "กติกากลาง" + "บรีฟของตัวเอง"** ทั้งก้อนไปวางให้ AI ของตัวเอง (Claude Code / Cursor / Codex ฯลฯ) ที่เปิดอยู่ในโฟลเดอร์ repo นี้
> ความเป็นเจ้าของไฟล์ทั้งหมดอยู่ใน [team-ownership.md](team-ownership.md) — ไฟล์นี้แค่แตกเป็นงานที่ต้องทำ

## สถานะตอนนี้ (main)

| ส่วน | สถานะ |
|---|---|
| Schema 2 ฝั่ง (Company, JobStatus, CandidateInteraction, Match) + seed | ✅ merged (PR #7) |
| API recruiter / companies / matches + mutual match (กันกดพร้อมกันแล้ว) | ✅ merged (PR #8) |
| Type ของทุก endpoint ใน `web/src/lib/api/api.type.ts` | ✅ มีครบ รวม Bot |
| หน้าเว็บฝั่งผู้สมัคร (discover, job detail, profile, saved, applications) | ✅ มีแล้ว แต่ **ยังไม่รู้จัก match** |
| หน้าเว็บฝั่ง recruiter | ❌ ยังไม่มี |
| Sign-up เลือกประเภทบัญชี | ❌ API รับแล้ว ฟอร์มยังไม่ส่ง |
| MATCHBACK Bot (`POST /assistant/messages` + `AssistantLauncher`) | ✅ API + UI เสร็จ — รอ Dev 1 ใส่บรรทัด mount ใน layout (ดูบรีฟ Dev 1) |
| Deploy (Railway + Vercel) | ❌ Aum ทำ |

บัญชีเดโมหลัง `pnpm db:seed`: `demo@matchback.dev`, `demo2@matchback.dev` (ผู้สมัคร, รหัส `SEED_DEMO_PASSWORD`), `recruiter@matchback.dev` (รหัส `SEED_RECRUITER_PASSWORD`, เป็นเจ้าของ job-001 กับ job-009) — สิ่งที่ seed ตั้งไว้ให้เดโม (รัน `pnpm db:seed` ซ้ำ = รีเซ็ตกลับแบบนี้):
- **Try as candidate** (`demo@`): recruiter กด LIKE demo ไว้ที่ job-001 แล้ว → demo กด LIKE job-001 (การ์ดใบแรกใน Discover) = "It's a Match!" ทันที
- **Try as recruiter**: deck ของ job-001 มี 8 คน (Ploy = demo2 + ผู้สมัครเดโม 7 คน `demo-*@example.com` ที่ล็อกอินไม่ได้) — Ploy, Krit, Pim กด LIKE job-001 ไว้แล้ว recruiter LIKE = match ส่วนคนอื่นไม่เกิด match เหมือนของจริง · job-009 มี Nida, Pim ที่ LIKE ไว้

## ไทม์ไลน์

| เวลา | เป้า |
|---|---|
| 15 ต.ค. ภายใน ~2 ชม. | Dev 1 merge **SwipeStack + MatchModal** (Dev 2 ต้องใช้) · Aum deploy main ขึ้นได้ |
| 15 ต.ค. คืน | ทุกคน merge งาน P0 |
| 16 ต.ค. 10:00 | **ส่งเวอร์ชันแรกบน hub** (ส่งซ้ำได้) |
| 16 ต.ค. 12:00 | **freeze** — หลังนี้แก้เฉพาะบั๊ก |
| 16 ต.ค. 13:30 | ส่งครั้งสุดท้าย ทดสอบลิงก์ใน private window |

P0 = ต้องมีถึงจะเดโมได้ · P1 = ทำเมื่อ P0 merge แล้วเท่านั้น

---

## กติกากลาง (วางให้ AI ทุกคน)

```text
คุณกำลังทำงานใน repo MATCHBACK (NestJS api/ + Next.js web/) ร่วมกับอีก 3-4 คนที่ใช้ AI ของตัวเองพร้อมกัน
ก่อนเริ่ม อ่าน: AGENTS.md, docs/team-ownership.md, docs/api-contract.md, docs/team-tasks.md

กติกาที่ห้ามฝ่า:
1. แก้เฉพาะไฟล์ที่ "บรีฟของฉัน" บอกว่าเป็นของฉัน ไฟล์คนอื่นห้ามแตะ ถ้าจำเป็นจริง ให้หยุดแล้วเขียน diff ที่เสนอให้ฉันส่งต่อเจ้าของ
2. ห้ามแก้ api/prisma/** (schema, migration, seed), web/src/lib/api/api.type.ts, docs/api-contract.md — เป็นของ Dev 3
   ถ้า type/endpoint ที่ต้องใช้ไม่มีใน api-contract.md ให้หยุดแล้วบอกฉัน ห้ามเดา endpoint หรือสร้าง type ซ้ำ
3. ใช้ type จาก web/src/lib/api/api.type.ts เท่านั้น เบราว์เซอร์ไม่เรียก API ตรง:
   อ่านข้อมูลใน Server Component ผ่าน *.api.ts / แก้ข้อมูลผ่าน Server Action ใน src/lib/actions/ (ดูตัวอย่าง jobs.action.ts)
   Server Action คืน ErrorActionResult แทนการ throw และ validate input ด้วย zod ซ้ำ
   แยกกรณี error ด้วย ApiError.code เท่านั้น ห้ามใช้ message
4. UI: shadcn (base-nova, Base UI) + Tailwind v4 ห้ามใส่สีตรง ๆ ใช้ token ใน globals.css
   การ์ดเป็นตัวอักษรล้วน: ไม่มีรูปคน ไม่มีโลโก้ ไม่มีอัปโหลดรูป
   ทุกหน้ามี loading / empty / error state และใช้ได้ทั้ง desktop และมือถือ
   ห้ามเขียนข้อความทำนายโอกาสได้งาน และข้อมูล seed ต้องติดป้าย "Demo data"
5. คอมเมนต์เฉพาะสิ่งที่ไม่ชัดจากโค้ด เป็นภาษาไทย
6. ใช้ pnpm เท่านั้น (ห้าม npx / npm) รันคำสั่งในโฟลเดอร์ api/ หรือ web/
7. Git: แตก branch ใหม่จาก main ล่าสุด (git checkout main && git pull) ทำ PR เล็ก ๆ ห้าม push เข้า main
   ก่อนเปิด PR ต้องผ่านทั้งหมดในแอปที่แตะ:
     web: pnpm lint && pnpm test && pnpm build
     api: pnpm lint:check && pnpm test && pnpm test:e2e && pnpm build
   ก่อนเริ่มงานแต่ละรอบให้ git pull main แล้ว rebase/merge เข้า branch ตัวเอง
8. ห้ามแตะ .env / ห้าม commit secret / ห้ามขอรหัสผ่านจริงในแชต
9. เดดไลน์ 16 ต.ค. 14:00 — เดโมที่ใช้ได้จริงสำคัญกว่าฟีเจอร์เยอะ ทำ P0 ให้จบก่อน P1
10. จบงานแต่ละ PR ให้สรุป: ไฟล์ที่แก้, วิธีทดสอบด้วยมือ, สิ่งที่ต้องบอกคนอื่น
```

---

## Dev 1 — หน้าบ้านฝั่งผู้สมัคร + ของที่ใช้ร่วมกัน

```text
บรีฟของฉัน: Developer 1 (หน้าบ้านฝั่งผู้สมัคร) — branch ตั้งชื่อ feature/candidate-ui-<เรื่อง>

ไฟล์ของฉัน: ตาม "Developer 1" ใน docs/team-ownership.md
(หน้า discover/jobs/profile/saved/applications/matches, components/features/{jobs,profile,applications,swipe,match/MatchModal.tsx},
 components/layout/AppHeader.tsx, app/(app)/layout.tsx, globals.css, app/(auth)/login/**, LoginForm.tsx,
 lib/api/{jobs,candidates,applications,matches}.api.ts, lib/actions/{jobs,profile,applications,matches}.action.ts)

P0 — PR แรก ทำให้เสร็จเร็วที่สุด เพราะ Dev 2 รอใช้:
1. แยก components/features/swipe/SwipeStack.tsx ออกจาก components/features/jobs/SwipeDeck.tsx ให้เป็น generic
   - props ประมาณ: items: T[], getKey(item), renderCard(item), onSwipe(item, "LIKE" | "SKIP") => Promise<SwipeResult | ErrorActionResult>, emptyState
   - ลากด้วยเมาส์ / ปัดด้วยนิ้ว / ปุ่ม Like-Pass / คีย์บอร์ด (← →) / หมุนการ์ด + overlay
   - ให้ SwipeDeck เดิมใช้ SwipeStack แทน (พฤติกรรมเดิมห้ามเปลี่ยน, เทสต์ SwipeDeck.test.tsx ต้องผ่าน)
2. components/features/match/MatchModal.tsx: props { open, matchId, title, subtitle, primaryHref, onClose }
   เปิดเฉพาะตอน SwipeResult.matchCreated === true เท่านั้น (isMatched แต่ matchCreated=false = ไม่ฉลองซ้ำ)
   เมื่อ merge แล้ว บอกฉันให้แจ้ง Dev 2 ทันที พร้อมตัวอย่างการใช้งาน

P0 — PR ที่สอง:
3. discover: หลังปัดให้ใช้ SwipeResult — matchCreated → เปิด MatchModal ลิงก์ไป /matches/<matchId>
4. หน้า /matches (รายการ MutualMatch ของฉัน) และ /matches/[id]: lib/api/matches.api.ts เรียก GET /matches และ GET /matches/:id
   404 MATCH_NOT_FOUND → notFound() / empty state บอกว่า "match เกิดเมื่อบริษัทกด LIKE คุณกลับ"
5. AppHeader ตาม role:
   USER → Discover, Saved, Applications, Matches, Profile
   RECRUITER → /recruiter (Jobs), /recruiter/matches, /recruiter/company   (หน้าพวกนี้ Dev 2 ทำ ฉันทำแค่ลิงก์)
   ADMIN → เหมือนเดิม
6. กัน recruiter ออกจากหน้าผู้สมัคร: ในหน้า/เลย์เอาต์ของผู้สมัครถ้า session.user.role === "RECRUITER" ให้ redirect("/recruiter")
   และหลังล็อกอิน recruiter ต้องไปที่ /recruiter (ผู้สมัครไป /discover ตามเดิม)
7. ปุ่มกรรมการบน /login: "Try as candidate" / "Try as recruiter"
   - เพิ่ม env ฝั่ง server ใน web/src/lib/env.ts + web/.env.example (มีคอมเมนต์):
     DEMO_CANDIDATE_EMAIL, DEMO_CANDIDATE_PASSWORD, DEMO_RECRUITER_EMAIL, DEMO_RECRUITER_PASSWORD (optional ทั้งหมด ไม่ตั้ง = ซ่อนปุ่ม)
   - ปุ่มเรียก Server Action ที่ signIn ด้วยค่าจาก env ฝั่ง server — รหัสห้ามหลุดไปเบราว์เซอร์และห้าม hardcode

P1: ขัดเกลา UX discover/match บนมือถือ, เทสต์ Vitest ของ SwipeStack/MatchModal
คำขอจาก Dev 4 (พร้อมแล้ว) — ฉัน (Dev 1) ใส่ใน app/(app)/layout.tsx หลัง </main>:
  import AssistantLauncher from "@/components/features/assistant/AssistantChat";
  {session.user.role === "USER" && <AssistantLauncher />}
  (ปุ่มลอยมุมขวาล่าง; อยู่หน้า /jobs/[id] จะส่ง jobId ให้ Bot เอง ไม่ต้องส่ง prop)
ห้ามแตะ: หน้า/คอมโพเนนต์ recruiter, SignupForm, AiPanels.tsx, api/**, api.type.ts
```

## Dev 2 — หน้าบ้านฝั่ง recruiter + sign-up

```text
บรีฟของฉัน: Developer 2 (หน้าบ้านฝั่ง recruiter) — branch feature/recruiter-ui-<เรื่อง>

ไฟล์ของฉัน: app/(app)/recruiter/**, components/features/recruiter/**, app/(auth)/signup/**, components/features/auth/SignupForm.tsx,
lib/api/{companies,recruiter}.api.ts, lib/actions/{company,recruiter}.action.ts, schema zod ใหม่ใน lib/schemas/ ที่ขึ้นต้นด้วย recruiter- / company-
API ทั้งหมดอยู่ใน docs/api-contract.md หัวข้อ "Recruiter identity, company, and jobs", "Recruiter candidate deck and swipes", "Mutual matches"

เส้นทางที่ตกลงกันแล้ว (ห้ามเปลี่ยนชื่อ เพราะ Dev 1 ทำลิงก์ในเมนูไว้):
  /recruiter                       รายการงานของบริษัท (GET /recruiter/jobs) + ปุ่มสร้างงาน
  /recruiter/company               ข้อมูลบริษัท (GET/PUT /companies/me)
  /recruiter/jobs/new              สร้างงาน (POST /recruiter/jobs → ได้ DRAFT)
  /recruiter/jobs/[jobId]          แก้ไขงาน + เปลี่ยนสถานะ DRAFT/PUBLISHED/CLOSED (PATCH)
  /recruiter/jobs/[jobId]/deck     ปัดผู้สมัคร
  /recruiter/matches               match ทั้งหมด (GET /matches) · ต่อ job ใช้ GET /recruiter/jobs/:jobId/matches

P0 (เริ่มได้ทันที ไม่ต้องรอใคร):
1. app/(app)/recruiter/layout.tsx: role ไม่ใช่ RECRUITER → redirect("/discover") (ADMIN ไป /admin)
2. SignupForm: ตัวเลือก "ฉันหางาน" (CANDIDATE) / "ฉันรับคนเข้าทำงาน" (RECRUITER) ส่ง accountType ไปกับ register
   ห้ามมีตัวเลือก ADMIN · ปุ่ม Google = ผู้สมัครเสมอ (บอกใต้ปุ่ม)
3. หน้า company: 409 COMPANY_REQUIRED จากทุก endpoint recruiter → พาไปกรอก /recruiter/company ก่อน
   website ต้องเป็น http/https
4. รายการงาน + ฟอร์มสร้าง/แก้ไขงาน (react-hook-form + zodResolver แบบ LoginForm.tsx)
   skills เลือก 1-15 ตัวจาก GET /skills (ติ๊ก required ได้) · error code: INVALID_SALARY_RANGE, DUPLICATE_SKILL, UNKNOWN_SKILL
   แสดง likeCount = "คนที่บริษัทกด LIKE" (ไม่ใช่คนที่ชอบงานนี้) และ matchCount

P0 (หลัง Dev 1 merge SwipeStack + MatchModal — ห้าม fork หรือเขียนการ์ดปัดเอง):
5. /recruiter/jobs/[jobId]/deck: GET /recruiter/jobs/:jobId/candidates → CandidateCard ใน SwipeStack
   แสดงแค่ข้อมูลใน CandidateCard (ชื่อต้น, headline, การศึกษา, ประสบการณ์, ทักษะ, คะแนน) ห้ามแสดงหรือเดาว่าผู้สมัครชอบงานนี้หรือยัง
   ปัด → POST /recruiter/jobs/:jobId/candidates/:candidateId/swipe → matchCreated → MatchModal
   409 JOB_NOT_PUBLISHED → ข้อความ "เผยแพร่งานก่อน" + ปุ่มไปหน้าแก้ไข
6. /recruiter/matches: MutualMatch (หลัง match ถึงจะเห็นอีเมลผู้สมัคร)

P1: เทสต์ Vitest ของฟอร์มงาน/ฟอร์มบริษัท, ปุ่ม "Publish" ด่วนในรายการงาน
ห้ามแตะ: หน้าผู้สมัคร, AppHeader, app/(app)/layout.tsx, SwipeStack/MatchModal (ขอแก้ผ่าน Dev 1), api/**, api.type.ts
```

## Dev 3 — Backend / contract (คนที่ทำ PR #7, #8)

```text
บรีฟของฉัน: Developer 3 (backend, DB, contract) — branch feature/api-<เรื่อง>
ไฟล์ของฉัน: ตาม "Developer 3" ใน docs/team-ownership.md (api/**, api.type.ts, api-contract.md)

งานหลักเสร็จแล้ว ช่วงที่เหลือคือ "ช่วยคนอื่นไม่ให้ติด":
P0:
1. รับคำขอเพิ่ม type / endpoint / error code จาก Dev 1, 2, 4 → แก้ api-contract.md + api.type.ts + API + เทสต์ ใน PR เดียว แล้วแจ้งกลับ
2. รีวิว PR ของ Dev 4 ที่แตะ api/src/assistant/** และบรรทัด import ใน app.module.ts
3. ช่วย Aum ตอน deploy: migrate deploy + seed บน Railway Postgres, เช็ก env ของ API
4. หลังทุกคน merge: ทดสอบ demo script ใน docs/two-sided-plan.md ข้อ 7 บนเว็บที่ deploy จริง
   (ผู้สมัคร LIKE → recruiter LIKE → match 1 ครั้ง → retry ไม่ฉลองซ้ำ → ทั้งสองฝั่งเห็น match)
P1: e2e สำหรับ flow recruiter บน DB จริง, ปรับ seed ให้เดโมสวยขึ้น (เช่นผู้สมัครเดโมเพิ่ม) — seed เปลี่ยนต้องไม่ทำให้บัญชีเดโมเดิมพัง
```

## Dev 4 — AI + MATCHBACK Bot

```text
บรีฟของฉัน: Developer 4 (AI / Bot) — branch feature/ai-bot-<เรื่อง>

ไฟล์ของฉัน: api/src/assistant/** (ใหม่), api/src/infrastructure/ai/**, api/src/resume/**,
web/src/components/features/match/AiPanels.tsx, web/src/components/features/assistant/** (ใหม่),
web/src/lib/api/assistant.api.ts, web/src/lib/actions/assistant.action.ts
ยกเว้นพิเศษ: เพิ่ม AssistantModule ใน imports ของ api/src/app.module.ts ได้ 1 บรรทัด (บอกในคำอธิบาย PR ให้ Dev 3 รีวิว)

สเปกอยู่ใน docs/api-contract.md หัวข้อ "MATCHBACK Bot" — ทำตามทุกข้อ ห้ามเพิ่มเอง
type ฝั่งเว็บมีแล้ว: AssistantMessage, AssistantResponse ใน web/src/lib/api/api.type.ts

P0:
1. API POST /assistant/messages
   - @Roles(Role.USER) + @AiThrottle() (มีใน api/src/common/decorator/throttle.decorator.ts)
   - DTO class-validator: messages 1-20 ตัว, role "user" | "assistant", content ≤ 2,000 ตัวอักษร (@Trim),
     รวมทุกข้อความ > 20,000 → 400 { code: "ASSISTANT_INPUT_TOO_LARGE" }, jobId optional
     jobId ต้องเป็นงาน PUBLISHED (ดู JobsService) ไม่งั้น 404 JOB_NOT_FOUND
   - context ที่ส่งให้ Gemini: โปรไฟล์ + ทักษะของผู้ใช้เอง + งาน (ถ้ามี) + ผล calculateMatch เท่านั้น
     ห้ามส่ง email, user id, ข้อมูลผู้สมัครคนอื่น, ข้อมูลภายในของ recruiter
   - เรียกผ่าน AiService ตัวเดิมเท่านั้น (ห้ามสร้าง client Gemini ตัวที่สอง), output สูงสุด 1,200 tokens, ไม่เก็บประวัติแชตใน DB
   - Gemini ใช้ไม่ได้ / timeout / ผลไม่ตรง schema → ตอบ deterministic { reply, source: "fallback" } ห้าม 500
   - ห้ามทำนายโอกาสได้งาน ห้ามบอกว่าคะแนนคือ mutual match · ไม่ใช้ U-Bot (U-Bot ไม่มี API ห้ามอ้างว่าเชื่อมแล้ว)
   - unit test: validation, fallback, context ไม่มี email
2. เว็บ: ปุ่มลอยเปิดแชต (components/features/assistant/), ประวัติเก็บใน state ฝั่ง client, ส่งผ่าน Server Action
   แสดงป้าย "fallback" แบบสุภาพเมื่อ source = "fallback" · แสดงเฉพาะ role USER
   เสร็จแล้วเขียนบรรทัด mount ที่ต้องเพิ่มใน app/(app)/layout.tsx ส่งให้ Dev 1 ใส่ (ห้ามแก้ layout เอง)
P1: ส่ง jobId อัตโนมัติเมื่อเปิด Bot จากหน้า /jobs/[id], ปุ่มคำถามแนะนำ 3 ปุ่ม
ห้ามแตะ: สูตรคะแนนใน api/src/matching/match-score.ts, prisma/**, match/recruiter API, layout, MatchModal
```

## Deploy — Aum (Railway + Vercel ของ Aum)

```text
บรีฟของฉัน: Deploy MATCHBACK จาก main ขึ้น Railway (Postgres + API) และ Vercel (web)
ไม่แก้โค้ดแอป ถ้าเจอบั๊กให้รายงานเจ้าของไฟล์ · ห้ามใส่ secret ลง repo หรือแชต — ใส่ใน dashboard เท่านั้น
คู่มือเดิม docs/deploy.md เขียนสำหรับ Render; ค่า env และคำสั่งเหมือนกัน เปลี่ยนแค่โฮสต์

0. หลัง transfer repo: ให้สิทธิ์ GitHub App ของ Railway และ Vercel เข้าถึง repo Aum40/matchback
1. Railway: New Project → Add PostgreSQL → Add service จาก GitHub repo
   - Root Directory: api · Build: pnpm install --frozen-lockfile && pnpm build
   - Start: pnpm prisma migrate deploy && pnpm start:prod
   - Node ต้อง 24.x (engines บังคับ ≥ 24.15) ถ้า build ใช้เวอร์ชันผิดให้ตั้ง RAILPACK_NODE_VERSION=24
   - env: DATABASE_URL (อ้างอิงจาก Postgres service), NODE_ENV=production, FRONTEND_URL=<URL Vercel>,
     ACCESS_TOKEN_SECRET (สุ่มยาว), INTERNAL_API_SECRET (สุ่ม ≥ 32 ตัว, ค่าเดียวกับเว็บ), TRUST_PROXY=1 (Railway มี proxy หน้า API หนึ่งชั้น),
     BREVO_API_KEY + MAIL_FROM (production บังคับ ไม่มี = API ไม่ boot), GEMINI_API_KEY,
     SEED_ADMIN_EMAIL/PASSWORD, SEED_DEMO_PASSWORD, SEED_RECRUITER_PASSWORD
     ดูรายการทั้งหมดและความหมายใน api/.env.example และ api/src/config/env.validation.ts
   - Generate Domain → ได้ URL ของ API แล้วรัน seed ครั้งเดียว: pnpm db:seed (ผ่าน Railway shell/CLI)
2. Vercel: Import repo, Root Directory: web, Node 24
   - env: API_URL=<URL Railway>, AUTH_SECRET (สุ่ม), AUTH_URL=<URL Vercel> (ไม่ตั้ง = ล็อกอินเด้งกลับเงียบ ๆ),
     INTERNAL_API_SECRET (เท่ากับฝั่ง API), DEMO_CANDIDATE_EMAIL/PASSWORD, DEMO_RECRUITER_EMAIL/PASSWORD (หลัง Dev 1 merge ปุ่มกรรมการ)
   - กลับไปแก้ FRONTEND_URL ใน Railway ให้ตรง URL Vercel แล้ว redeploy
3. ทดสอบใน private window: หน้าแรก, ล็อกอิน demo / recruiter, ปัด, match
4. ทุกครั้งที่ merge main ทั้งสองฝั่งต้อง redeploy อัตโนมัติ · ถ้ามี migration ใหม่ start command จะ migrate ให้เอง
5. ส่ง URL เว็บ + URL API ให้ทีม แล้วอัปเดต docs/deploy.md เป็น Railway/Vercel (PR เล็ก)
```

---

## ลำดับ merge และจุดที่อาจชนกัน

1. Dev 1: SwipeStack + MatchModal (ด่วน) → Dev 2 pull main แล้วทำ deck ต่อ
2. Dev 2: layout recruiter / signup / company / jobs ไม่ชนใคร merge ได้เรื่อย ๆ
3. Dev 4: API Bot → UI Bot → Dev 1 ใส่บรรทัด mount
4. Dev 3: รับคำขอ contract ตลอด, ทดสอบ demo script บนเว็บจริงหลัง merge ทุกก้อน

| ถ้า AI ของคุณอยาก… | ให้ทำแบบนี้แทน |
|---|---|
| เพิ่ม type / endpoint / error code | ขอ Dev 3 |
| แก้เมนู, layout, globals.css, SwipeStack, MatchModal | ขอ Dev 1 |
| แก้ SignupForm | ขอ Dev 2 |
| แก้ AiService / prompt | ขอ Dev 4 |
| แก้ schema / seed | ขอ Dev 3 (ห้าม migrate เอง) |
