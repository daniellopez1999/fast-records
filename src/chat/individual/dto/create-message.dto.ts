import {
  IsString,
  IsUUID,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class CreateIndividualChatDto {
  @IsUUID()
  user_2_id: string;
}

export class CreateIndividualMessageDto {
  @IsUUID()
  individual_chat_id: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;
}

export class UpdateIndividualMessageDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content?: string;
}

