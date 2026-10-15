import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { Roles } from '@/common/decorator/roles.decorator';
import { Role } from '@/database/generated/prisma/enums';
import { SwipeDto } from '@/jobs/dto/swipe.dto';
import { CreateJobDto } from '@/recruiter/dto/create-job.dto';
import { UpdateJobDto } from '@/recruiter/dto/update-job.dto';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { RecruiterService } from './recruiter.service';

/** ทุก route ตรวจว่างานเป็นของบริษัทผู้เรียกใน RecruiterService (บริษัทอ่านจาก DB) */
@Roles(Role.RECRUITER)
@Controller('recruiter/jobs')
export class RecruiterController {
  constructor(private readonly recruiterService: RecruiterService) {}

  @Get()
  listJobs(@CurrentUser('sub') userId: string) {
    return this.recruiterService.listJobs(userId);
  }

  @Post()
  createJob(@CurrentUser('sub') userId: string, @Body() dto: CreateJobDto) {
    return this.recruiterService.createJob(userId, dto);
  }

  @Patch(':jobId')
  updateJob(
    @CurrentUser('sub') userId: string,
    @Param('jobId') jobId: string,
    @Body() dto: UpdateJobDto,
  ) {
    return this.recruiterService.updateJob(userId, jobId, dto);
  }

  @Get(':jobId/candidates')
  candidateDeck(
    @CurrentUser('sub') userId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.recruiterService.candidateDeck(userId, jobId);
  }

  @HttpCode(HttpStatus.OK)
  @Post(':jobId/candidates/:candidateId/swipe')
  swipeCandidate(
    @CurrentUser('sub') userId: string,
    @Param('jobId') jobId: string,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
    @Body() dto: SwipeDto,
  ) {
    return this.recruiterService.swipeCandidate(
      userId,
      jobId,
      candidateId,
      dto.direction,
    );
  }

  @Get(':jobId/matches')
  jobMatches(
    @CurrentUser('sub') userId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.recruiterService.jobMatches(userId, jobId);
  }
}
