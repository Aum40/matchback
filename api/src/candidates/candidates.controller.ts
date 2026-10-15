import { UpdateProfileDto } from '@/candidates/dto/update-profile.dto';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { Body, Controller, Get, Put } from '@nestjs/common';
import { CandidatesService } from './candidates.service';

/** โปรไฟล์ของคนที่ล็อกอินอยู่เท่านั้น — ไม่มี endpoint อ่านโปรไฟล์คนอื่น */
@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get('me')
  getProfile(@CurrentUser('sub') userId: string) {
    return this.candidatesService.getProfile(userId);
  }

  @Put('me')
  updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.candidatesService.updateProfile(userId, dto);
  }
}
