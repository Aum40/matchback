import { UpsertCompanyDto } from '@/companies/dto/upsert-company.dto';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { Roles } from '@/common/decorator/roles.decorator';
import { Role } from '@/database/generated/prisma/enums';
import { Body, Controller, Get, Put } from '@nestjs/common';
import { CompaniesService } from './companies.service';

@Roles(Role.RECRUITER)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('me')
  findMine(@CurrentUser('sub') userId: string) {
    return this.companiesService.findMine(userId);
  }

  @Put('me')
  upsertMine(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpsertCompanyDto,
  ) {
    return this.companiesService.upsertMine(userId, dto);
  }
}
