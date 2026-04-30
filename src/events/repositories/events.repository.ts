import { Injectable } from '@nestjs/common';
import { Repository } from "typeorm";
import { Event } from "../entities/event.entity";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class EventsRepository {
  constructor(
    @InjectRepository(Event)
    private readonly repository: Repository<Event>,
  ) { }
}
