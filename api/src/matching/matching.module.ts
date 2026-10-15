import { CandidatesModule } from '@/candidates/candidates.module';
import { JobsModule } from '@/jobs/jobs.module';
import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';

@Module({
  imports: [JobsModule, CandidatesModule],
  controllers: [MatchingController],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
