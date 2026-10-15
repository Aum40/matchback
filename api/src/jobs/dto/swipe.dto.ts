import { SwipeDirection } from '@/database/generated/prisma/enums';
import { IsEnum } from 'class-validator';

export class SwipeDto {
  @IsEnum(SwipeDirection)
  direction: SwipeDirection;
}
