import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './controllers/events.controller';
import { EventsService } from './services/events.service';
import { Event } from './entities/event.entity';
import { ParticipantEvent } from './entities/participant-event.entity';
import { EventPhoto } from './entities/event-photo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event, ParticipantEvent, EventPhoto])],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule { }

