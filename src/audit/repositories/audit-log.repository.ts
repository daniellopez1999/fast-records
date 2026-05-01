import { QueryRunner } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { AuditLog, AuditStatus } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogRepository {
  async create(auditLog: Partial<AuditLog>, queryRunner: QueryRunner): Promise<AuditLog> {
    return await queryRunner.manager.save(AuditLog, auditLog);
  }

  async findById(id: string, queryRunner: QueryRunner): Promise<AuditLog | null> {
    return await queryRunner.manager.findOneBy(AuditLog, { id });
  }

  async findByUserId(user_id: string, queryRunner: QueryRunner, limit: number = 50): Promise<AuditLog[]> {
    return await queryRunner.manager.find(AuditLog, {
      where: { user_id },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async findByEndpoint(
    endpoint: string,
    queryRunner: QueryRunner,
    limit: number = 50,
  ): Promise<AuditLog[]> {
    return await queryRunner.manager.find(AuditLog, {
      where: { endpoint },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }
}
