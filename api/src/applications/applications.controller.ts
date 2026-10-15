import { FindApplicationsDto } from '@/applications/dto/find-applications.dto';
import { UpdateApplicationDto } from '@/applications/dto/update-application.dto';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';

/**
 * งานที่สนใจและสถานะการสมัคร — ผู้ใช้อัปเดตเองทั้งหมด
 * ระบบไม่ได้รับข้อมูลจากนายจ้าง อย่าเพิ่มอะไรที่ทำให้ดูเหมือนอัปเดตอัตโนมัติ
 */
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  findAll(
    @CurrentUser('sub') userId: string,
    @Query() query: FindApplicationsDto,
  ) {
    return this.applicationsService.findAll(userId, query.status);
  }

  @Patch(':id')
  update(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.applicationsService.update(userId, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.applicationsService.remove(userId, id);
  }
}
