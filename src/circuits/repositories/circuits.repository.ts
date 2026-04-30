import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Circuit } from '../entities/circuit.entity';

@Injectable()
export class CircuitsRepository {
  constructor(
    @InjectRepository(Circuit)
    private readonly repository: Repository<Circuit>,
  ) { }
}
