import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../../users/entities/user.entity';
import { IndividualChat } from './individual-chat.entity';

@Entity('individual_messages')
export class IndividualMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ default: false })
  is_read: boolean;

  // Relations
  @ManyToOne(() => IndividualChat, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'individual_chat_id' })
  individualChat: IndividualChat;

  @ManyToOne(() => User, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
