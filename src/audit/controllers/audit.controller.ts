import { Controller, Get, Param, Query } from '@nestjs/common';
import { AuditService } from '../services/audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) { }

  /**
   * Gets the audit logs for a specific user
   * @example GET /audit/user/user-id-123?limit=50
   */
  @Get('user/:user_id')
  async getUserAuditLogs(
    @Param('user_id') user_id: string,
    @Query('limit') limit?: string,
  ) {
    const logs = await this.auditService.getUserAuditLogs(
      user_id,
      limit ? parseInt(limit, 10) : undefined,
    );
    return {
      success: true,
      data: logs,
      count: logs.length,
    };
  }

  /**
   * Gets the audit logs for a specific endpoint
   * @example GET /audit/endpoint/users%2Fprofile?limit=50
   */
  @Get('endpoint')
  async getEndpointAuditLogs(
    @Query('endpoint') endpoint: string,
    @Query('limit') limit?: string,
  ) {
    const logs = await this.auditService.getEndpointAuditLogs(
      endpoint,
      limit ? parseInt(limit, 10) : undefined,
    );
    return {
      success: true,
      data: logs,
      count: logs.length,
    };
  }
}
