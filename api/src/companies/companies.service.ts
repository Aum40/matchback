import { UpsertCompanyDto } from '@/companies/dto/upsert-company.dto';
import { PrismaService } from '@/database/prisma.service';
import { ConflictException, Injectable } from '@nestjs/common';

const COMPANY_SELECT = {
  id: true,
  name: true,
  description: true,
  website: true,
  isDemo: true,
} as const;

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { company: { select: COMPANY_SELECT } },
    });
    return user?.company ?? null;
  }

  /**
   * เรียกครั้งแรก = สร้างบริษัทและผูก recruiter เข้ากับบริษัท, ครั้งต่อไป = แก้บริษัทเดิม
   * ทำใน transaction เดียว ไม่ให้เกิดบริษัทลอย ๆ ที่ไม่มีใครสังกัด ถ้าผูกไม่สำเร็จ
   */
  async upsertMine(userId: string, dto: UpsertCompanyDto) {
    const data = {
      name: dto.name,
      description: dto.description || null,
      website: dto.website || null,
    };

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { companyId: true },
      });

      if (user.companyId) {
        return tx.company.update({
          where: { id: user.companyId },
          data,
          select: COMPANY_SELECT,
        });
      }

      const company = await tx.company.create({ data, select: COMPANY_SELECT });
      await tx.user.update({
        where: { id: userId },
        data: { companyId: company.id },
      });
      return company;
    });
  }

  /**
   * บริษัทของ recruiter จาก DB (ไม่เชื่อค่าจาก token หรือ body)
   * ยังไม่มีบริษัท = 409 COMPANY_REQUIRED หน้าเว็บพาไปสร้างบริษัทก่อน
   */
  async requireCompany(userId: string) {
    const company = await this.findMine(userId);
    if (!company) {
      throw new ConflictException({
        message: 'Create your company profile first',
        code: 'COMPANY_REQUIRED',
      });
    }
    return company;
  }
}
