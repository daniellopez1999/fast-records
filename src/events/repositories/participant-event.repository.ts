import { Injectable } from '@nestjs/common';
import { Repository } from "typeorm";
import { ParticipantEvent } from "../entities/participant-event.entity";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class ParticipantEventRepository {
  constructor(
    @InjectRepository(ParticipantEvent)
    private readonly repository: Repository<ParticipantEvent>,
  ) { }
}
