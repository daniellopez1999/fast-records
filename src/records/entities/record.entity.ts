import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Circuit } from '../../circuits/entities/circuit.entity';

@Entity('records')
export class Record {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  best_time: string; // format: "mm:ss.ms"

  @Column()
  num_laps: number;

  @CreateDateColumn()
  record_date: Date;

  // Relations
  @ManyToOne(() => User, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Circuit, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'circuit_id' })
  circuit: Circuit;
}
