import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { AiThrottle } from '@/common/decorator/throttle.decorator';
import { AiService } from '@/infrastructure/ai/ai.service';
import { MatchingService } from '@/matching/matching.service';
import { CoachResumeDto } from '@/resume/dto/coach-resume.dto';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

/**
 * AI Resume Coach: คำแนะนำปรับ resume ให้ตรงงาน จากข้อมูลในโปรไฟล์เท่านั้น
 * ตรรกะทั้งหมดอยู่ใน MatchingService.buildContext + AiService ที่นี่แค่ต่อสายให้
 */
@Controller('resume')
export class ResumeController {
  constructor(
    private readonly matchingService: MatchingService,
    private readonly aiService: AiService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @AiThrottle()
  @Post('coach')
  async coach(@CurrentUser('sub') userId: string, @Body() dto: CoachResumeDto) {
    const { context } = await this.matchingService.buildContext(
      userId,
      dto.jobId,
    );
    return this.aiService.coachResume(context);
  }
}
