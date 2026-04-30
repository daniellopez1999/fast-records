import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Event } from './event.entity';

@Entity('event_photos')
export class EventPhoto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  photo_url: string; // URL from Minio/S3

  @Column({ nullable: true })
  description: string;

  @Column({ default: 0 })
  likes_count: number;

  @CreateDateColumn()
  uploaded_at: Date;

  @Column({ default: false })
  is_featured: boolean;

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
