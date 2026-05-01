import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum AuditStatus {
  STARTED = 'started',
  FINISHED = 'finished',
  FINISHED_WITH_ERROR = 'finished_with_error',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  user_id: string;

  @Column()
  controller: string;

  @Column()
  method: string;

  @Column({ type: 'enum', enum: AuditStatus })
  status: AuditStatus;

  @Column({ nullable: true })
  ip_address: string;

  @Column({ nullable: true })
  user_agent: string;

  @Column({ nullable: true })
  device: string;

  @Column({ nullable: true })
  version: string;

  @Column({ nullable: true })
  http_method: string;

  @Column({ nullable: true })
  endpoint: string;

  @Column({ nullable: true, type: 'integer' })
  status_code: number;

  @Column({ nullable: true })
  error_message: string;

  @Column({ nullable: true, type: 'json' })
  metadata: Record<string, any>;

  @Column({ nullable: true, type: 'bigint' })
  duration_ms: number;

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true })
  finished_at: Date;
}
