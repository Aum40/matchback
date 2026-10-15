import { MatchingModule } from '@/matching/matching.module';
import { Module } from '@nestjs/common';
import { ResumeController } from './resume.controller';

@Module({
  imports: [MatchingModule],
  controllers: [ResumeController],
})
export class ResumeModule {}
