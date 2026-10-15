import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CoachResumeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  jobId: string;
}
