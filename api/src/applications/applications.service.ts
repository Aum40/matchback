import { UpdateApplicationDto } from '@/applications/dto/update-application.dto';
import { ApplicationStatus } from '@/database/generated/prisma/enums';
import { PrismaService } from '@/database/prisma.service';
import { JOB_SELECT, toJobResponse } from '@/jobs/job.select';
import { Injectable, NotFoundException } from '@nestjs/common';

const APPLICATION_SELECT = {
  id: true,
  status: true,
  notes: true,
  employerFeedback: true,
  createdAt: true,
  updatedAt: true,
  job: { select: JOB_SELECT },
} as const;

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, status?: ApplicationStatus) {
    const applications = await this.prisma.application.findMany({
      where: { userId, ...(status && { status }) },
      select: APPLICATION_SELECT,
      orderBy: { updatedAt: 'desc' },
    });
    return applications.map(({ job, ...rest }) => ({
      ...rest,
      job: toJobResponse(job),
    }));
  }

  /**
   * where มี userId เสมอ: id ของคนอื่นตอบ 404 เหมือนไม่มี (ไม่บอกว่ามีอยู่จริง)
   * ใช้ updateMany/deleteMany เพราะ update/delete ของ Prisma รับแค่ unique field
   */
  async update(userId: string, id: string, dto: UpdateApplicationDto) {
    const { count } = await this.prisma.application.updateMany({
      where: { id, userId },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.notes !== undefined && { notes: dto.notes || null }),
        ...(dto.employerFeedback !== undefined && {
          employerFeedback: dto.employerFeedback || null,
        }),
      },
    });
    if (count === 0) throw this.notFound();

    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    const { count } = await this.prisma.application.deleteMany({
      where: { id, userId },
    });
    if (count === 0) throw this.notFound();
    return { id, deleted: true };
  }

  private async findOne(userId: string, id: string) {
    const application = await this.prisma.application.findFirst({
      where: { id, userId },
      select: APPLICATION_SELECT,
    });
    if (!application) throw this.notFound();
    const { job, ...rest } = application;
    return { ...rest, job: toJobResponse(job) };
  }

  private notFound() {
    return new NotFoundException({
      message: 'Application not found',
      code: 'APPLICATION_NOT_FOUND',
    });
  }
}
