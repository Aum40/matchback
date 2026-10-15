import type { AccessTokenPayload } from '@/auth/types/jwt-payload';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { Roles } from '@/common/decorator/roles.decorator';
import { Role } from '@/database/generated/prisma/enums';
import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { MatchesService } from './matches.service';

/**
 * อ่านอย่างเดียว: ไม่มี POST/PATCH/DELETE โดยตั้งใจ
 * match เกิดได้ทางเดียวคือการปัดของทั้งสองฝั่ง (MatchesService.syncMatch)
 */
@Roles(Role.USER, Role.RECRUITER)
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  findAll(@CurrentUser() user: AccessTokenPayload) {
    return this.matchesService.findAllFor(user);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.matchesService.findOneFor(user, id);
  }
}
