import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IndividualMessage } from '../entities/individual-message.entity';
import { IndividualChat } from '../entities/individual-chat.entity';

@Injectable()
export class IndividualMessagesRepository {
  constructor(
    @InjectRepository(IndividualMessage)
    private readonly repository: Repository<IndividualMessage>,
  ) {}
}

@Injectable()
export class IndividualChatsRepository {
  constructor(
    @InjectRepository(IndividualChat)
    private readonly repository: Repository<IndividualChat>,
  ) {}
}
