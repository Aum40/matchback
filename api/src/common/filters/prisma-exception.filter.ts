import { Prisma } from '@/database/generated/prisma/client';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

/**
 * แปลง error ของ Prisma ที่หลุดมาถึง controller เป็นคำตอบ HTTP ที่มีความหมาย
 * แทน 500 "Internal server error" ทุกกรณี — รูปร่างเดียวกับ error ของ Nest
 * ({ statusCode, message, code }) เว็บจึงอ่านด้วย ApiError ตัวเดียวได้
 *
 * ไม่ใช่ข้ออ้างให้ข้ามการเช็ก: service ควรโยน NotFoundException ของตัวเองพร้อม code
 * ที่เฉพาะเจาะจงก่อน ตัวนี้แค่เป็นตาข่ายรองกันหลุด
 */
const MAPPED: Record<
  string,
  { status: number; message: string; code: string }
> = {
  // record ที่ต้อง update/delete ไม่มีอยู่
  P2025: {
    status: HttpStatus.NOT_FOUND,
    message: 'Resource not found',
    code: 'NOT_FOUND',
  },
  // unique ชน
  P2002: {
    status: HttpStatus.CONFLICT,
    message: 'Resource already exists',
    code: 'CONFLICT',
  },
  // foreign key ชี้ไปแถวที่ไม่มี
  P2003: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Related resource does not exist',
    code: 'INVALID_REFERENCE',
  },
};

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(error: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const mapped = MAPPED[error.code];

    if (!mapped) {
      // รายละเอียดของ DB (ชื่อตาราง/คอลัมน์) ห้ามหลุดไปถึงผู้ใช้ เก็บไว้ใน log
      this.logger.error(`Unhandled Prisma error ${error.code}`, error.stack);
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
      return;
    }

    response.status(mapped.status).json({
      statusCode: mapped.status,
      message: mapped.message,
      code: mapped.code,
    });
  }
}
