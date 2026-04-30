import {
  IsString,
  IsUUID,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateNotificationDto {
  @IsUUID()
  user_id: string;

  @IsString()
  type: string; // 'participation', 'invitation', 'message', 'like', etc.

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  content: string;

  @IsOptional()
  @IsUUID()
  reference_id?: string;
}

