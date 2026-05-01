import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../../users/entities/user.entity';
import { GroupChat } from './group-chat.entity';

@Entity('group_messages')
export class GroupMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ default: false })
  is_read: boolean;

  // Relations
  @ManyToOne(() => GroupChat, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'group_chat_id' })
  groupChat: GroupChat;

  @ManyToOne(() => User, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
