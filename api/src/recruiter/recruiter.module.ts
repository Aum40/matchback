import { CompaniesModule } from '@/companies/companies.module';
import { MatchesModule } from '@/matches/matches.module';
import { Module } from '@nestjs/common';
import { RecruiterController } from './recruiter.controller';
import { RecruiterService } from './recruiter.service';

@Module({
  imports: [CompaniesModule, MatchesModule],
  controllers: [RecruiterController],
  providers: [RecruiterService],
})
export class RecruiterModule {}
