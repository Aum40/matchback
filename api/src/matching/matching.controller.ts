import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { AiThrottle } from '@/common/decorator/throttle.decorator';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { MatchingService } from './matching.service';

@Controller('jobs/:jobId/match')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get()
  getMatch(@CurrentUser('sub') userId: string, @Param('jobId') jobId: string) {
    return this.matchingService.getMatch(userId, jobId);
  }

  // POST: ทุกครั้งที่เรียกอาจเสียเงินค่า AI ไม่ให้ถูก prefetch/cache เหมือน GET
  @HttpCode(HttpStatus.OK)
  @AiThrottle()
  @Post('explanation')
  explain(@CurrentUser('sub') userId: string, @Param('jobId') jobId: string) {
    return this.matchingService.explain(userId, jobId);
  }
}
