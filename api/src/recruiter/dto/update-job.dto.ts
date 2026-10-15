import { JobStatus } from '@/database/generated/prisma/enums';
import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateJobDto } from './create-job.dto';

/** PATCH: ส่งเฉพาะที่จะเปลี่ยน ส่ง skills = แทนที่รายการทักษะทั้งชุด */
export class UpdateJobDto extends PartialType(CreateJobDto) {
  /** PUBLISHED = ผู้สมัครเห็น, DRAFT/CLOSED = ซ่อนจากผู้สมัคร (เจ้าของยังจัดการได้) */
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;
}
