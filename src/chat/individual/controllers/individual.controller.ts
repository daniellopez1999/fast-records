import { Controller } from '@nestjs/common';
import { IndividualService } from '../services/individual.service';

@Controller('chat/individual')
export class IndividualController {
  constructor(private readonly individualService: IndividualService) { }
}
