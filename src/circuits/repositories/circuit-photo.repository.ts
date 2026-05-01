import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CircuitPhoto } from '../entities/circuit-photo.entity';

@Injectable()
export class CircuitPhotoRepository {
  constructor(
    @InjectRepository(CircuitPhoto)
    private readonly repository: Repository<CircuitPhoto>,
  ) {}
}
