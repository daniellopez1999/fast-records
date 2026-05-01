import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndividualController } from './controllers/individual.controller';
import { IndividualService } from './services/individual.service';
import { IndividualChat } from './entities/individual-chat.entity';
import { IndividualMessage } from './entities/individual-message.entity';
import { IndividualMessagesRepository } from './repositories/individual-message.repository';
import { IndividualChatsRepository } from './repositories/individual-message.repository';

@Module({
  imports: [TypeOrmModule.forFeature([IndividualChat, IndividualMessage])],
  controllers: [IndividualController],
  providers: [
    IndividualService,
    IndividualMessagesRepository,
    IndividualChatsRepository,
  ],
  exports: [IndividualService],
})
export class IndividualModule {}
