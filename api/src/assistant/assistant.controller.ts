import { AssistantService } from '@/assistant/assistant.service';
import { SendMessagesDto } from '@/assistant/dto/send-messages.dto';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { Roles } from '@/common/decorator/roles.decorator';
import { AiThrottle } from '@/common/decorator/throttle.decorator';
import { Role } from '@/database/generated/prisma/enums';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

/** MATCHBACK Bot — เฉพาะผู้สมัครใน MVP (recruiter ต้องมี contract แยกก่อน) */
@Roles(Role.USER)
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @HttpCode(HttpStatus.OK)
  @AiThrottle()
  @Post('messages')
  send(@CurrentUser('sub') userId: string, @Body() dto: SendMessagesDto) {
    return this.assistantService.reply(userId, dto);
  }
}
