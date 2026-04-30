import { Controller } from '@nestjs/common';
import { GrupalService } from '../services/grupal.service';

@Controller('chat/grupal')
export class GrupalController {
  constructor(private readonly grupalService: GrupalService) { }
}
