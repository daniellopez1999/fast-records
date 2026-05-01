import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLog, AuditStatus } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogRepository {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repository: Repository<AuditLog>,
  ) { }

  async create(auditLog: Partial<AuditLog>): Promise<AuditLog> {
    return this.repository.save(auditLog);
  }

  async findById(id: string): Promise<AuditLog | null> {
    return this.repository.findOneBy({ id });
  }

  async findByUserId(user_id: string, limit: number = 50): Promise<AuditLog[]> {
    return this.repository.find({
      where: { user_id },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async findByEndpoint(
    endpoint: string,
    limit: number = 50,
  ): Promise<AuditLog[]> {
    return this.repository.find({
      where: { endpoint },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }
}
