import { NormalizeEmail } from '@/common/decorator/normalize-email.decorator';
import { StrongPassword } from '@/common/decorator/strong-password.decorator';
import { Trim } from '@/common/decorator/trim.decorator';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** ประเภทบัญชีที่เลือกเองได้ตอนสมัคร — ไม่มี ADMIN โดยตั้งใจ (แอดมินมาจาก seed เท่านั้น) */
export const ACCOUNT_TYPES = ['CANDIDATE', 'RECRUITER'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export class RegisterDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @NormalizeEmail()
  @IsEmail()
  @MaxLength(254)
  email: string;

  @StrongPassword()
  password: string;

  /** ไม่ส่ง = CANDIDATE (เข้ากันได้กับเว็บเวอร์ชันเดิมที่ยังไม่มีตัวเลือกนี้) */
  @IsOptional()
  @IsIn(ACCOUNT_TYPES)
  accountType?: AccountType;
}
