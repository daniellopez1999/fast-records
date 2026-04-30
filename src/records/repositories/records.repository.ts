import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Record } from '../entities/record.entity';

@Injectable()
export class RecordsRepository {
  constructor(
    @InjectRepository(Record)
    private readonly repository: Repository<Record>,
  ) { }
}
