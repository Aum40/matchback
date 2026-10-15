import { Trim } from '@/common/decorator/trim.decorator';
import { ApplicationStatus } from '@/database/generated/prisma/enums';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

/** PATCH: ส่งเฉพาะที่จะเปลี่ยน สตริงว่าง = ลบข้อความเดิม */
export class UpdateApplicationDto {
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  /** feedback จริงที่ได้จากนายจ้าง ผู้ใช้จดเอง */
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(2000)
  employerFeedback?: string;
}
