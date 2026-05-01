import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditService } from '../services/audit.service';
import { AuditLog } from '../entities/audit-log.entity';
import { AUDIT_PUBLIC_KEY } from '../decorators/audit.decorator';
import { Result } from '@common/interfaces/interfaces';

@Injectable()
export class AuditPublicInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) { }

  /**
   * Checks if the data object is a Result type
   */
  private isResult(data: any): data is Result<any> {
    return (
      data &&
      typeof data === 'object' &&
      'statusCode' in data &&
      'message' in data &&
      'data' in data &&
      'success' in data &&
      typeof data.statusCode === 'number' &&
      typeof data.message === 'string' &&
      typeof data.success === 'boolean'
    );
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    // Check if method has @AuditPublic() decorator
    const shouldAuditPublic = this.reflector.getAllAndOverride<boolean>(AUDIT_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no decorator, continue without auditing
    if (!shouldAuditPublic) {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const handler = context.getHandler();
    const controller = context.getClass().name;
    const method = handler.name;

    const startTime = Date.now();

    // Creates an audit log entry at the start of the request (for public endpoints without user_id)
    const auditLog: AuditLog = await this.auditService.logRequestStart(
      req,
      controller,
      method,
    );

    return next.handle().pipe(
      tap((response) => {
        // Check if response is a Result object with error status
        const duration = Date.now() - startTime;

        if (this.isResult(response) && response.statusCode >= 400) {
          // Error response through Result object
          const errorObject = {
            statusCode: response.statusCode,
            message: response.message,
            success: response.success,
            data: response.data,
          };

          this.auditService.logRequestEnd(
            auditLog.id,
            response.statusCode,
            response.message,
            duration,
            errorObject,
          );
        } else {
          // Successful request
          const statusCode = res.statusCode || 200;
          this.auditService.logRequestEnd(
            auditLog.id,
            statusCode,
            undefined,
            duration,
          );
        }
      }),
      catchError((error) => {
        // Error request (exception thrown)
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;

        this.auditService.logRequestEnd(
          auditLog.id,
          statusCode,
          error.message || 'Unknown error',
          duration,
          error,
        );

        return throwError(() => error);
      }),
    );
  }
}
