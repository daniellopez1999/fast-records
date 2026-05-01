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

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  event_date: Date;

  @Column()
  start_time: string;

  @Column()
  end_time: string;

  @Column()
  max_participants: number;

  @Column()
  event_type: string; // 'race', 'training', 'friendly'

  @Column({ default: 'scheduled' })
  status: string; // 'scheduled', 'live', 'completed', 'cancelled'

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => Circuit, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'circuit_id' })
  circuit: Circuit;

  @ManyToOne(() => User, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'creator_id' })
  creator: User;
}
