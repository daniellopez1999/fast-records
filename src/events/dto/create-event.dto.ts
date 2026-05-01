import {
  IsString,
  IsUUID,
  IsDateString,
  IsNumber,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateEventDto {
  @IsUUID()
  circuit_id: string;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @IsDateString()
  event_date: string;

  @IsString()
  start_time: string; // format: "HH:mm"

  @IsString()
  end_time: string; // format: "HH:mm"

  @IsNumber()
  @Min(1)
  max_participants: number;

  @IsString()
  event_type: string; // 'race', 'training', 'friendly'

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  start_time?: string;

  @IsOptional()
  @IsString()
  end_time?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  max_participants?: number;

  @IsOptional()
  @IsString()
  status?: string; // 'scheduled', 'live', 'completed', 'cancelled'

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
