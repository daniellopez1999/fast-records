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

@Entity('circuit_photos')
export class CircuitPhoto {
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
  @JoinColumn({ name: 'user_id' })
  user: User;
}
