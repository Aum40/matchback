import { Trim } from '@/common/decorator/trim.decorator';
import {
  EmploymentType,
  WorkArrangement,
} from '@/database/generated/prisma/enums';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class JobSkillInputDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  id: string;

  @IsBoolean()
  required: boolean;
}

/**
 * ไม่มี companyId, company, isDemo, status ในนี้โดยตั้งใจ:
 * API ตั้งค่าเหล่านี้เอง (whitelist ตัด field ที่ client แอบส่งมาทิ้ง)
 */
export class CreateJobDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  location: string;

  @IsEnum(WorkArrangement)
  workArrangement: WorkArrangement;

  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  // null = ไม่ระบุเงินเดือน (ValidateIf ปล่อย null ผ่านโดยไม่ตรวจ IsInt)
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(0)
  salaryMin?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(0)
  salaryMax?: number | null;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  description: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(15)
  @ValidateNested({ each: true })
  @Type(() => JobSkillInputDto)
  skills: JobSkillInputDto[];
}
