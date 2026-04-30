import { Controller } from '@nestjs/common';
import { CircuitsService } from '../services/circuits.service';

@Controller('circuits')
export class CircuitsController {
  constructor(private readonly circuitsService: CircuitsService) { }
}
