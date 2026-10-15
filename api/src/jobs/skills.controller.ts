import { Public } from '@/common/decorator/public.decorator';
import { PrismaService } from '@/database/prisma.service';
import { Controller, Get } from '@nestjs/common';

/** รายการทักษะให้หน้าโปรไฟล์เลือก — ข้อมูลอ้างอิงล้วน จึงอ่านตรงจาก Prisma ได้ */
@Public()
@Controller('skills')
export class SkillsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.skill.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }
}
