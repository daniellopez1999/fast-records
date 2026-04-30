import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './controllers/events.controller';
import { EventsService } from './services/events.service';
import { Event } from './entities/event.entity';
import { ParticipantEvent } from './entities/participant-event.entity';
import { EventPhoto } from './entities/event-photo.entity';
import { EventsRepository } from './repositories/events.repository';
import { ParticipantEventRepository } from './repositories/participant-event.repository';
import { EventPhotoRepository } from './repositories/event-photo.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Event, ParticipantEvent, EventPhoto])],
  controllers: [EventsController],
  providers: [EventsService, EventsRepository, ParticipantEventRepository, EventPhotoRepository],
  exports: [EventsService],
})
export class EventsModule { }

