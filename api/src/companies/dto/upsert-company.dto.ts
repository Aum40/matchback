import { Trim } from '@/common/decorator/trim.decorator';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

/** ไม่มีช่องโลโก้/รูปโดยตั้งใจ (การ์ดเป็น text-first ตาม AGENTS.md) */
export class UpsertCompanyDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(4000)
  description?: string;

  // รับเฉพาะ http/https — กันลิงก์ javascript: หรือ data: ที่จะไปแสดงในหน้าเว็บ
  @IsOptional()
  @Trim()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  website?: string;
}
