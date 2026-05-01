import { Controller } from '@nestjs/common';
import { RecordsService } from '../services/records.service';

@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}
}
