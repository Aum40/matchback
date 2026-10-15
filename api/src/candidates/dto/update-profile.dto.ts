import { Trim } from '@/common/decorator/trim.decorator';
import { WorkArrangement } from '@/database/generated/prisma/enums';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

/** ตัดช่องว่างทุกตัวในรายการและทิ้งตัวที่ว่าง (ฟอร์มส่งช่องว่างมาได้) */
const TrimList = () =>
  Transform(({ value }: { value: unknown }) =>
    Array.isArray(value)
      ? (value as unknown[])
          .map((item) => (typeof item === 'string' ? item.trim() : item))
          .filter((item) => item !== '')
      : value,
  );

/**
 * PUT = แทนที่ทั้งโปรไฟล์ field ที่ไม่ส่งมา = ล้างเป็นค่าว่าง
 * (ฟอร์มหน้าเว็บส่งครบทุกช่องเสมอ ง่ายกว่า PATCH ที่ต้องแยก "ไม่ส่ง" กับ "ลบ")
 */
export class UpdateProfileDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(150)
  headline?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(2000)
  education?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(4000)
  experience?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(4000)
  projects?: string;

  @IsOptional()
  @TrimList()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  desiredRoles?: string[];

  // null = ลบค่าเดิม ValidateIf ปล่อย null ผ่านโดยไม่ตรวจ IsInt
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  preferredSalaryMin?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsEnum(WorkArrangement)
  preferredWorkArrangement?: WorkArrangement | null;

  /** id ของ Skill (slug) ที่ผู้สมัครยืนยันว่ามี — ใช้คิดคะแนน */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  skillIds?: string[];
}
