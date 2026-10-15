import { Trim } from '@/common/decorator/trim.decorator';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export const CHAT_ROLES = ['user', 'assistant'] as const;

export class ChatMessageDto {
  @IsIn(CHAT_ROLES)
  role: (typeof CHAT_ROLES)[number];

  @IsString()
  @Trim()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}

export class SendMessagesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  jobId?: string;
}
