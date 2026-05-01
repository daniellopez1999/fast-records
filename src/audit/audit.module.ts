import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { AuditService } from './services/audit.service';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { AuditPublicInterceptor } from './interceptors/audit-public.interceptor';
import { AuditController } from './controllers/audit.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditService, AuditLogRepository, AuditInterceptor, AuditPublicInterceptor],
  controllers: [AuditController],
  exports: [AuditService, AuditInterceptor, AuditPublicInterceptor],
})
export class AuditModule { }
