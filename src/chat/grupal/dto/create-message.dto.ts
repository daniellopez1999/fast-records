import {
  IsString,
  IsUUID,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class CreateGroupChatDto {
  @IsUUID()
  event_id: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;
}

export class CreateGroupMessageDto {
  @IsUUID()
  group_chat_id: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;
}

export class UpdateGroupMessageDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content?: string;
}
