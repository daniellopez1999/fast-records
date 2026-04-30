import { Injectable } from '@nestjs/common';
import { Repository } from "typeorm";
import { EventPhoto } from "../entities/event-photo.entity";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class EventPhotoRepository {
  constructor(
    @InjectRepository(EventPhoto)
    private readonly repository: Repository<EventPhoto>,
  ) { }
}
