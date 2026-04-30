import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('circuits')
export class Circuit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  location: string;

  @Column()
  country: string;

  @Column()
  city: string;

  @Column('decimal', { precision: 10, scale: 6 })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 6 })
  longitude: number;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  main_photo: string;

  @Column({ nullable: true })
  website: string;

  @Column()
  num_laps: number;

  @Column('decimal', { precision: 8, scale: 2 })
  track_length_km: number; // in km

  @CreateDateColumn()
  created_at: Date;
}

