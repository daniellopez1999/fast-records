import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditService } from '../services/audit.service';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) { }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const handler = context.getHandler();
    const controller = context.getClass().name;
    const method = handler.name;

    const startTime = Date.now();

    // Creates an audit log entry at the start of the request
    const auditLog: AuditLog = await this.auditService.logRequestStart(
      req,
      controller,
      method,
    );

    return next.handle().pipe(
      tap((response) => {
        // Successful request
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode || 200;

        this.auditService.logRequestEnd(
          auditLog.id,
          statusCode,
          undefined,
          duration,
        );
      }),
      catchError((error) => {
        // Error request
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;

        this.auditService.logRequestEnd(
          auditLog.id,
          statusCode,
          error.message || 'Unknown error',
          duration,
        );

        return throwError(() => error);
      }),
    );
  }
}
