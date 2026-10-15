import { CandidatesModule } from '@/candidates/candidates.module';
import { MatchesModule } from '@/matches/matches.module';
import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { SkillsController } from './skills.controller';

@Module({
  imports: [CandidatesModule, MatchesModule],
  controllers: [JobsController, SkillsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
