import { CandidatesModule } from '@/candidates/candidates.module';
import { MatchingModule } from '@/matching/matching.module';
import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';

@Module({
  imports: [MatchingModule, CandidatesModule],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}
