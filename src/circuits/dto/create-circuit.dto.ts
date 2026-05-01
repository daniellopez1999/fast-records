import {
  IsString,
  IsNumber,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class CreateCircuitDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(3)
  location: string;

  @IsString()
  @MinLength(2)
  @MaxLength(2)
  country: string; // ISO country code

  @IsString()
  @MinLength(2)
  city: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  main_photo?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsNumber()
  @Min(1)
  num_laps: number;

  @IsNumber()
  @Min(0.1)
  track_length_km: number;
}

export class UpdateCircuitDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  main_photo?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  num_laps?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  track_length_km?: number;
}
