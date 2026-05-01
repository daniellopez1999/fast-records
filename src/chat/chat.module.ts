import { Module } from '@nestjs/common';
import { IndividualModule } from './individual/individual.module';
import { GrupalModule } from './grupal/grupal.module';

@Module({
  imports: [IndividualModule, GrupalModule],
  exports: [IndividualModule, GrupalModule],
})
export class ChatModule {}
