import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GrupalController } from './controllers/grupal.controller';
import { GrupalService } from './services/grupal.service';
import { GroupChat } from './entities/group-chat.entity';
import { GroupMessage } from './entities/group-message.entity';
import { GroupMessagesRepository } from './repositories/group-message.repository';
import { GroupChatsRepository } from './repositories/group-message.repository';

@Module({
  imports: [TypeOrmModule.forFeature([GroupChat, GroupMessage])],
  controllers: [GrupalController],
  providers: [GrupalService, GroupMessagesRepository, GroupChatsRepository],
  exports: [GrupalService],
})
export class GrupalModule { }
