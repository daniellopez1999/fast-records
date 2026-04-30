import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Event } from './event.entity';
import { User } from '../../users/entities/user.entity';

@Entity('event_participants')
export class ParticipantEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  registered_at: Date;

  @Column({ default: 'registered' })
  participation_status: string; // 'registered', 'completed', 'withdrawn'

  @Column({ nullable: true })
  final_position: number;

  @Column({ nullable: true })
  best_lap_time: string; // format: "mm:ss.ms"

  // Relations
  @ManyToOne(() => Event, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @ManyToOne(() => User, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
