import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupMessage } from '../entities/group-message.entity';
import { GroupChat } from '../entities/group-chat.entity';

@Injectable()
export class GroupMessagesRepository {
  constructor(
    @InjectRepository(GroupMessage)
    private readonly repository: Repository<GroupMessage>,
  ) { }
}

@Injectable()
export class GroupChatsRepository {
  constructor(
    @InjectRepository(GroupChat)
    private readonly repository: Repository<GroupChat>,
  ) { }
}
