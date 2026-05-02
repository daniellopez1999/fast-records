import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { AuditLog, AuditStatus } from '../entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    private readonly auditLogRepository: AuditLogRepository,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Gets the user agent string and parses it to extract device, browser, OS, and version information.
   */
  private parseUserAgent(userAgent: string): {
    device?: string;
    version?: string;
    browser?: string;
    os?: string;
  } {
    if (!userAgent) {
      return {};
    }

    try {
      const result: any = {
        device: 'desktop',
        browser: 'unknown',
        os: 'unknown',
        version: 'unknown',
      };

      // Detect device type
      if (
        /mobile|android|iphone|ipod|blackberry|windows phone/i.test(userAgent)
      ) {
        result.device = 'mobile';
      } else if (/tablet|ipad/i.test(userAgent)) {
        result.device = 'tablet';
      }

      // Detect browser and version
      if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) {
        result.browser = 'Chrome';
        const match = userAgent.match(/Chrome\/([0-9.]+)/);
        if (match) result.version = match[1];
      } else if (/firefox/i.test(userAgent)) {
        result.browser = 'Firefox';
        const match = userAgent.match(/Firefox\/([0-9.]+)/);
        if (match) result.version = match[1];
      } else if (
        /safari/i.test(userAgent) &&
        !/chrome/i.test(userAgent) &&
        !/edg/i.test(userAgent)
      ) {
        result.browser = 'Safari';
        const match = userAgent.match(/Version\/([0-9.]+)/);
        if (match) result.version = match[1];
      } else if (/edg/i.test(userAgent)) {
        result.browser = 'Edge';
        const match = userAgent.match(/Edg\/([0-9.]+)/);
        if (match) result.version = match[1];
      }

      // Detect OS (iOS and Android must come before macOS check since they contain "Mac")
      if (/iphone|ipad|ipod/i.test(userAgent)) {
        result.os = 'iOS';
      } else if (/android/i.test(userAgent)) {
        result.os = 'Android';
      } else if (/windows/i.test(userAgent)) {
        result.os = 'Windows';
      } else if (/mac/i.test(userAgent)) {
        result.os = 'macOS';
      } else if (/linux/i.test(userAgent)) {
        result.os = 'Linux';
      }

      return result;
    } catch {
      return {};
    }
  }

  /**
   * Extracts the client's IP address from the request
   */
  private getClientIp(req: any): string {
    const forwarded = req.headers?.['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }

  /**
   * Gets the user ID from the request (from the JWT token or req.user)
   */
  private getUserId(req: any): string | null {
    return req.user?.user_id || req.user?.id || null;
  }

  /**
   * Creates an initial audit log (started)
   */
  async logRequestStart(
    req: any,
    controller: string,
    method: string,
  ): Promise<AuditLog> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      const userAgent = req.headers?.['user-agent'] || '';
      const parsed = this.parseUserAgent(userAgent);

      const auditLog = await this.auditLogRepository.create(
        {
          user_id: this.getUserId(req),
          controller,
          method,
          status: AuditStatus.STARTED,
          ip_address: this.getClientIp(req),
          user_agent: userAgent,
          device: parsed.device,
          version: parsed.version,
          http_method: req.method,
          endpoint: req.originalUrl || req.url,
          metadata: {
            browser: parsed.browser,
            os: parsed.os,
          },
        },
        queryRunner,
      );

      return auditLog;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Creates a new audit log entry with the result (finished or finished_with_error)
   */
  async logRequestEnd(
    auditLogId: string,
    statusCode: number,
    errorMessage?: string,
    duration_ms?: number,
    errorObject?: any,
  ): Promise<AuditLog> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Get the started log to copy its information
      const startedLog = await this.auditLogRepository.findById(
        auditLogId,
        queryRunner,
      );

      if (!startedLog) {
        throw new Error(`Audit log with ID ${auditLogId} not found`);
      }

      const isError = statusCode >= 400;
      const status = isError
        ? AuditStatus.FINISHED_WITH_ERROR
        : AuditStatus.FINISHED;

      // Stringify the error object if present
      let errorJson: Record<string, any> | null = null;
      if (errorObject && isError) {
        try {
          errorJson = JSON.parse(
            JSON.stringify(errorObject, (key, value) => {
              // Handle circular references and special types
              if (value instanceof Error) {
                return {
                  message: value.message,
                  name: value.name,
                  stack: value.stack,
                };
              }
              return value;
            }),
          );
        } catch {
          // If stringify fails, try to capture what we can
          errorJson = {
            message: errorMessage,
            type: typeof errorObject,
            stringified: String(errorObject),
          };
        }
      }

      // Create a new log entry with the end status
      return await this.auditLogRepository.create(
        {
          user_id: startedLog.user_id,
          controller: startedLog.controller,
          method: startedLog.method,
          status,
          ip_address: startedLog.ip_address,
          user_agent: startedLog.user_agent,
          device: startedLog.device,
          version: startedLog.version,
          http_method: startedLog.http_method,
          endpoint: startedLog.endpoint,
          status_code: statusCode,
          error_message: errorMessage || null,
          error_json: errorJson,
          duration_ms: Math.round(duration_ms || 0),
          metadata: {
            ...startedLog.metadata,
            started_log_id: auditLogId,
          },
          finished_at: new Date(),
        },
        queryRunner,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Gets the audit logs for a specific user
   */
  async getUserAuditLogs(user_id: string, limit?: number): Promise<AuditLog[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      return await this.auditLogRepository.findByUserId(
        user_id,
        queryRunner,
        limit,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Gets the audit logs for a specific endpoint
   */
  async getEndpointAuditLogs(
    endpoint: string,
    limit?: number,
  ): Promise<AuditLog[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      return await this.auditLogRepository.findByEndpoint(
        endpoint,
        queryRunner,
        limit,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
