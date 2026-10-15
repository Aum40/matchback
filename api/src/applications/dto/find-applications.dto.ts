import { ApplicationStatus } from '@/database/generated/prisma/enums';
import { IsEnum, IsOptional } from 'class-validator';

export class FindApplicationsDto {
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;
}
