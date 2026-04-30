import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CircuitsController } from './controllers/circuits.controller';
import { CircuitsService } from './services/circuits.service';
import { Circuit } from './entities/circuit.entity';
import { CircuitPhoto } from './entities/circuit-photo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Circuit, CircuitPhoto])],
  controllers: [CircuitsController],
  providers: [CircuitsService],
  exports: [CircuitsService],
})
export class CircuitsModule { }

