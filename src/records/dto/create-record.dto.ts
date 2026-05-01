import { IsString, IsUUID, IsNumber, Min } from 'class-validator';

export class CreateRecordDto {
  @IsUUID()
  circuit_id: string;

  @IsString()
  best_time: string; // format: "mm:ss.ms"

  @IsNumber()
  @Min(1)
  num_laps: number;
}
