import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserType {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ nullable: true })
  profile_photo: string;

  @Column({ type: 'enum', enum: UserType, default: UserType.USER })
  user_type: UserType;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  registration_date: Date;

  @Column({ nullable: true })
  last_access: Date;

  @Column({ default: true })
  active: boolean;

  @UpdateDateColumn()
  updated_at: Date;
}


