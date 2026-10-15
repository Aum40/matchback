import { CandidatesService } from '@/candidates/candidates.service';
import { AiService } from '@/infrastructure/ai/ai.service';
import type { MatchContext } from '@/infrastructure/ai/ai.types';
import { JobsService, toMatchJob } from '@/jobs/jobs.service';
import { calculateMatch } from '@/matching/match-score';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MatchingService {
  constructor(
    private readonly jobsService: JobsService,
    private readonly candidatesService: CandidatesService,
    private readonly aiService: AiService,
  ) {}

  /** ผลจับคู่แบบ deterministic — เร็ว ไม่เรียก AI หน้ารายละเอียดงานโหลดอันนี้ก่อนเสมอ */
  async getMatch(userId: string, jobId: string) {
    const { job, context } = await this.buildContext(userId, jobId);
    return { job, match: context.match, aiEnabled: this.aiService.enabled };
  }

  /** คำอธิบายเป็นภาษาคน: AI ถ้ามี key ไม่งั้น fallback (ดู source ในผลลัพธ์) */
  async explain(userId: string, jobId: string) {
    const { context } = await this.buildContext(userId, jobId);
    return this.aiService.explainMatch(context);
  }

  /** ใช้ร่วมกับ ResumeService: งาน + โปรไฟล์ + คะแนน ที่คำนวณจากชุดข้อมูลเดียวกัน */
  async buildContext(userId: string, jobId: string) {
    const [job, { candidate, facts }] = await Promise.all([
      this.jobsService.findOne(jobId),
      this.candidatesService.getMatchInputs(userId),
    ]);

    const context: MatchContext = {
      candidate: facts,
      job: {
        title: job.title,
        company: job.company,
        description: job.description,
      },
      match: calculateMatch(candidate, toMatchJob(job)),
    };
    return { job, context };
  }
}
