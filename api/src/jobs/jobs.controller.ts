import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { Public } from '@/common/decorator/public.decorator';
import { Roles } from '@/common/decorator/roles.decorator';
import { Role } from '@/database/generated/prisma/enums';
import { SwipeDto } from '@/jobs/dto/swipe.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  /** รายการงานทั้งหมด ไม่ต้องล็อกอิน (หน้าแรกของเว็บใช้แสดงตัวอย่างงาน) */
  @Public()
  @Get()
  findAll() {
    return this.jobsService.findAll();
  }

  // ต้องประกาศก่อน :id ไม่งั้น "discover" ถูกตีความเป็น id
  @Roles(Role.USER)
  @Get('discover')
  discover(@CurrentUser('sub') userId: string) {
    return this.jobsService.discover(userId);
  }

  @HttpCode(HttpStatus.OK)
  @Roles(Role.USER)
  @Delete('swipes')
  resetSwipes(@CurrentUser('sub') userId: string) {
    return this.jobsService.resetSwipes(userId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @HttpCode(HttpStatus.OK)
  @Roles(Role.USER)
  @Post(':id/swipe')
  swipe(
    @CurrentUser('sub') userId: string,
    @Param('id') jobId: string,
    @Body() dto: SwipeDto,
  ) {
    return this.jobsService.swipe(userId, jobId, dto.direction);
  }
}
