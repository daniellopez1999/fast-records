import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CircuitsController } from './controllers/circuits.controller';
import { CircuitsService } from './services/circuits.service';
import { Circuit } from './entities/circuit.entity';
import { CircuitPhoto } from './entities/circuit-photo.entity';
import { CircuitsRepository } from './repositories/circuits.repository';
import { CircuitPhotoRepository } from './repositories/circuit-photo.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Circuit, CircuitPhoto])],
  controllers: [CircuitsController],
  providers: [CircuitsService, CircuitsRepository, CircuitPhotoRepository],
  exports: [CircuitsService],
})
export class CircuitsModule { }

