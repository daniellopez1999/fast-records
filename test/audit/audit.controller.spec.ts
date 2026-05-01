import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from '../../src/audit/controllers/audit.controller';
import { AuditService } from '../../src/audit/services/audit.service';
import { AuditLog, AuditStatus } from '../../src/audit/entities/audit-log.entity';

describe('AuditController', () => {
  let auditController: AuditController;
  let auditService: AuditService;

  const mockAuditLogs: AuditLog[] = [
    {
      id: 'audit-id-1',
      user_id: 'user-123',
      controller: 'TestController',
      method: 'testMethod',
      status: AuditStatus.FINISHED,
      ip_address: '192.168.1.1',
      user_agent: 'Mozilla/5.0',
      device: 'desktop',
      version: '120.0',
      http_method: 'GET',
      endpoint: '/test',
      status_code: 200,
      error_message: null,
      metadata: {},
      duration_ms: 100,
      created_at: new Date(),
      finished_at: new Date(),
    },
    {
      id: 'audit-id-2',
      user_id: 'user-123',
      controller: 'TestController',
      method: 'testMethod',
      status: AuditStatus.FINISHED,
      ip_address: '192.168.1.1',
      user_agent: 'Mozilla/5.0',
      device: 'desktop',
      version: '120.0',
      http_method: 'POST',
      endpoint: '/test/create',
      status_code: 201,
      error_message: null,
      metadata: {},
      duration_ms: 150,
      created_at: new Date(),
      finished_at: new Date(),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: {
            getUserAuditLogs: jest.fn(),
            getEndpointAuditLogs: jest.fn(),
          },
        },
      ],
    }).compile();

    auditController = module.get<AuditController>(AuditController);
    auditService = module.get<AuditService>(AuditService);
  });

  describe('getUserAuditLogs', () => {
    it('should return user audit logs', async () => {
      jest.spyOn(auditService, 'getUserAuditLogs').mockResolvedValue(mockAuditLogs);

      const result = await auditController.getUserAuditLogs('user-123');

      expect(result).toEqual({
        success: true,
        data: mockAuditLogs,
        count: mockAuditLogs.length,
      });
      expect(auditService.getUserAuditLogs).toHaveBeenCalledWith('user-123', undefined);
    });

    it('should parse limit parameter correctly', async () => {
      jest.spyOn(auditService, 'getUserAuditLogs').mockResolvedValue(mockAuditLogs);

      await auditController.getUserAuditLogs('user-123', '100');

      expect(auditService.getUserAuditLogs).toHaveBeenCalledWith('user-123', 100);
    });

    it('should handle missing limit parameter', async () => {
      jest.spyOn(auditService, 'getUserAuditLogs').mockResolvedValue(mockAuditLogs);

      await auditController.getUserAuditLogs('user-123');

      expect(auditService.getUserAuditLogs).toHaveBeenCalledWith('user-123', undefined);
    });

    it('should return empty logs array', async () => {
      jest.spyOn(auditService, 'getUserAuditLogs').mockResolvedValue([]);

      const result = await auditController.getUserAuditLogs('user-999');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.count).toBe(0);
    });

    it('should include correct count in response', async () => {
      jest.spyOn(auditService, 'getUserAuditLogs').mockResolvedValue(mockAuditLogs);

      const result = await auditController.getUserAuditLogs('user-123');

      expect(result.count).toBe(2);
    });
  });

  describe('getEndpointAuditLogs', () => {
    it('should return endpoint audit logs', async () => {
      jest.spyOn(auditService, 'getEndpointAuditLogs').mockResolvedValue(mockAuditLogs);

      const result = await auditController.getEndpointAuditLogs('/test');

      expect(result).toEqual({
        success: true,
        data: mockAuditLogs,
        count: mockAuditLogs.length,
      });
      expect(auditService.getEndpointAuditLogs).toHaveBeenCalledWith('/test', undefined);
    });

    it('should parse limit parameter correctly', async () => {
      jest.spyOn(auditService, 'getEndpointAuditLogs').mockResolvedValue(mockAuditLogs);

      await auditController.getEndpointAuditLogs('/test', '50');

      expect(auditService.getEndpointAuditLogs).toHaveBeenCalledWith('/test', 50);
    });

    it('should handle complex endpoint paths', async () => {
      jest.spyOn(auditService, 'getEndpointAuditLogs').mockResolvedValue([]);

      await auditController.getEndpointAuditLogs('/api/users/123/profile');

      expect(auditService.getEndpointAuditLogs).toHaveBeenCalledWith(
        '/api/users/123/profile',
        undefined,
      );
    });

    it('should return empty logs array for non-existent endpoint', async () => {
      jest.spyOn(auditService, 'getEndpointAuditLogs').mockResolvedValue([]);

      const result = await auditController.getEndpointAuditLogs('/non-existent');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.count).toBe(0);
    });

    it('should always return success true', async () => {
      jest.spyOn(auditService, 'getEndpointAuditLogs').mockResolvedValue([]);

      const result = await auditController.getEndpointAuditLogs('/test');

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should propagate service errors from getUserAuditLogs', async () => {
      jest
        .spyOn(auditService, 'getUserAuditLogs')
        .mockRejectedValue(new Error('Database error'));

      await expect(
        auditController.getUserAuditLogs('user-123'),
      ).rejects.toThrow('Database error');
    });

    it('should propagate service errors from getEndpointAuditLogs', async () => {
      jest
        .spyOn(auditService, 'getEndpointAuditLogs')
        .mockRejectedValue(new Error('Database error'));

      await expect(
        auditController.getEndpointAuditLogs('/test'),
      ).rejects.toThrow('Database error');
    });
  });

  describe('Numeric Parsing', () => {
    it('should handle string numbers in limit', async () => {
      jest.spyOn(auditService, 'getUserAuditLogs').mockResolvedValue([]);

      await auditController.getUserAuditLogs('user-123', '999');

      expect(auditService.getUserAuditLogs).toHaveBeenCalledWith('user-123', 999);
    });

    it('should handle zero as limit', async () => {
      jest.spyOn(auditService, 'getUserAuditLogs').mockResolvedValue([]);

      await auditController.getUserAuditLogs('user-123', '0');

      expect(auditService.getUserAuditLogs).toHaveBeenCalledWith('user-123', 0);
    });

    it('should handle invalid limit gracefully', async () => {
      jest.spyOn(auditService, 'getUserAuditLogs').mockResolvedValue([]);

      await auditController.getUserAuditLogs('user-123', 'invalid');

      // parseInt('invalid', 10) returns NaN
      expect(auditService.getUserAuditLogs).toHaveBeenCalledWith('user-123', NaN);
    });
  });
});
