import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, QueryRunner } from 'typeorm';
import { AuditService } from '../../src/audit/services/audit.service';
import { AuditLogRepository } from '../../src/audit/repositories/audit-log.repository';
import { AuditLog, AuditStatus } from '../../src/audit/entities/audit-log.entity';

describe('AuditService', () => {
  let auditService: AuditService;
  let auditLogRepository: AuditLogRepository;
  let mockDataSource: Partial<DataSource>;
  let mockQueryRunner: Partial<QueryRunner>;

  const mockAuditLog: AuditLog = {
    id: 'audit-id-123',
    user_id: 'user-123',
    controller: 'TestController',
    method: 'testMethod',
    status: AuditStatus.STARTED,
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0',
    device: 'desktop',
    version: '120.0',
    http_method: 'GET',
    endpoint: '/test',
    status_code: 200,
    error_message: null,
    metadata: { browser: 'Chrome', os: 'Windows' },
    duration_ms: 100,
    created_at: new Date(),
    finished_at: null,
  };

  beforeEach(async () => {
    mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        save: jest.fn(),
        findOneBy: jest.fn(),
        find: jest.fn(),
      } as any,
    };

    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: AuditLogRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByUserId: jest.fn(),
            findByEndpoint: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    auditService = module.get<AuditService>(AuditService);
    auditLogRepository = module.get<AuditLogRepository>(AuditLogRepository);
  });

  describe('logRequestStart', () => {
    it('should create an audit log with STARTED status', async () => {
      const req = {
        user: { user_id: 'user-123' },
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        method: 'GET',
        originalUrl: '/test',
        ip: '192.168.1.1',
      };

      (auditLogRepository.create as jest.Mock).mockResolvedValue(mockAuditLog);

      const result = await auditService.logRequestStart(req, 'TestController', 'testMethod');

      expect(result).toEqual(mockAuditLog);
      expect(auditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          controller: 'TestController',
          method: 'testMethod',
          status: AuditStatus.STARTED,
          http_method: 'GET',
          endpoint: '/test',
        }),
        mockQueryRunner,
      );
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should extract device info from user agent', async () => {
      const req = {
        user: { user_id: 'user-123' },
        headers: {
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
        },
        method: 'POST',
        originalUrl: '/api/users',
        ip: '192.168.1.1',
      };

      (auditLogRepository.create as jest.Mock).mockResolvedValue(mockAuditLog);

      await auditService.logRequestStart(req, 'UsersController', 'create');

      const callArgs = (auditLogRepository.create as jest.Mock).mock.calls[0][0];
      expect(callArgs.device).toBe('mobile');
      // iOS check should come before macOS check
      expect(callArgs.metadata.os).toBe('iOS');
    });

    it('should handle missing user agent', async () => {
      const req = {
        user: { user_id: 'user-123' },
        headers: {},
        method: 'GET',
        originalUrl: '/test',
        ip: '192.168.1.1',
      };

      (auditLogRepository.create as jest.Mock).mockResolvedValue(mockAuditLog);

      await auditService.logRequestStart(req, 'TestController', 'testMethod');

      expect(auditLogRepository.create).toHaveBeenCalled();
    });

    it('should extract IP from x-forwarded-for header', async () => {
      const req = {
        user: { user_id: 'user-123' },
        headers: {
          'x-forwarded-for': '203.0.113.1, 198.51.100.1',
          'user-agent': 'Mozilla/5.0',
        },
        method: 'GET',
        originalUrl: '/test',
      };

      (auditLogRepository.create as jest.Mock).mockResolvedValue(mockAuditLog);

      await auditService.logRequestStart(req, 'TestController', 'testMethod');

      expect(auditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ip_address: '203.0.113.1',
        }),
        mockQueryRunner,
      );
    });
  });

  describe('logRequestEnd', () => {
    it('should create a finished audit log on success', async () => {
      (auditLogRepository.findById as jest.Mock).mockResolvedValue(mockAuditLog);
      (auditLogRepository.create as jest.Mock).mockResolvedValue({
        ...mockAuditLog,
        status: AuditStatus.FINISHED,
        status_code: 200,
      });

      const result = await auditService.logRequestEnd('audit-id-123', 200, undefined, 150);

      expect(result.status).toBe(AuditStatus.FINISHED);
      expect(result.status_code).toBe(200);
      expect(auditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AuditStatus.FINISHED,
          status_code: 200,
          duration_ms: 150,
        }),
        mockQueryRunner,
      );
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should create a finished_with_error audit log on error', async () => {
      (auditLogRepository.findById as jest.Mock).mockResolvedValue(mockAuditLog);
      (auditLogRepository.create as jest.Mock).mockResolvedValue({
        ...mockAuditLog,
        status: AuditStatus.FINISHED_WITH_ERROR,
        status_code: 500,
        error_message: 'Internal Server Error',
      });

      const result = await auditService.logRequestEnd('audit-id-123', 500, 'Internal Server Error', 100);

      expect(result.status).toBe(AuditStatus.FINISHED_WITH_ERROR);
      expect(result.status_code).toBe(500);
      expect(result.error_message).toBe('Internal Server Error');
    });

    it('should throw error if started log not found', async () => {
      (auditLogRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        auditService.logRequestEnd('non-existent-id', 200),
      ).rejects.toThrow('Audit log with ID non-existent-id not found');
    });

    it('should copy all data from started log to finished log', async () => {
      (auditLogRepository.findById as jest.Mock).mockResolvedValue(mockAuditLog);
      (auditLogRepository.create as jest.Mock).mockResolvedValue({
        ...mockAuditLog,
        status: AuditStatus.FINISHED,
      });

      await auditService.logRequestEnd('audit-id-123', 200, undefined, 150);

      expect(auditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockAuditLog.user_id,
          controller: mockAuditLog.controller,
          method: mockAuditLog.method,
          ip_address: mockAuditLog.ip_address,
          device: mockAuditLog.device,
          endpoint: mockAuditLog.endpoint,
        }),
        mockQueryRunner,
      );
    });

    it('should include started_log_id in metadata', async () => {
      (auditLogRepository.findById as jest.Mock).mockResolvedValue(mockAuditLog);
      (auditLogRepository.create as jest.Mock).mockResolvedValue({
        ...mockAuditLog,
        status: AuditStatus.FINISHED,
      });

      await auditService.logRequestEnd('audit-id-123', 200, undefined, 150);

      expect(auditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            started_log_id: 'audit-id-123',
          }),
        }),
        mockQueryRunner,
      );
    });
  });

  describe('getUserAuditLogs', () => {
    it('should return audit logs for a specific user', async () => {
      const mockLogs: AuditLog[] = [mockAuditLog];
      (auditLogRepository.findByUserId as jest.Mock).mockResolvedValue(mockLogs);

      const result = await auditService.getUserAuditLogs('user-123', 50);

      expect(result).toEqual(mockLogs);
      expect(auditLogRepository.findByUserId).toHaveBeenCalledWith('user-123', mockQueryRunner, 50);
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should use default limit if not provided', async () => {
      (auditLogRepository.findByUserId as jest.Mock).mockResolvedValue([]);

      await auditService.getUserAuditLogs('user-123');

      expect(auditLogRepository.findByUserId).toHaveBeenCalledWith('user-123', mockQueryRunner, undefined);
    });

    it('should return empty array if no logs found', async () => {
      (auditLogRepository.findByUserId as jest.Mock).mockResolvedValue([]);

      const result = await auditService.getUserAuditLogs('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('getEndpointAuditLogs', () => {
    it('should return audit logs for a specific endpoint', async () => {
      const mockLogs: AuditLog[] = [mockAuditLog];
      (auditLogRepository.findByEndpoint as jest.Mock).mockResolvedValue(mockLogs);

      const result = await auditService.getEndpointAuditLogs('/test', 100);

      expect(result).toEqual(mockLogs);
      expect(auditLogRepository.findByEndpoint).toHaveBeenCalledWith('/test', mockQueryRunner, 100);
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should handle complex endpoints', async () => {
      (auditLogRepository.findByEndpoint as jest.Mock).mockResolvedValue([]);

      await auditService.getEndpointAuditLogs('/api/users/123/profile');

      expect(auditLogRepository.findByEndpoint).toHaveBeenCalledWith('/api/users/123/profile', mockQueryRunner, undefined);
    });
  });

  describe('Device and Browser Detection', () => {
    it('should detect Firefox browser', async () => {
      const req = {
        user: { user_id: 'user-123' },
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        },
        method: 'GET',
        originalUrl: '/test',
        ip: '192.168.1.1',
      };

      (auditLogRepository.create as jest.Mock).mockResolvedValue(mockAuditLog);

      await auditService.logRequestStart(req, 'TestController', 'testMethod');

      expect(auditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            browser: 'Firefox',
          }),
        }),
        mockQueryRunner,
      );
    });

    it('should detect Safari browser without version', async () => {
      const req = {
        user: { user_id: 'user-123' },
        headers: {
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Safari/605.1.15',
        },
        method: 'GET',
        originalUrl: '/test',
        ip: '192.168.1.1',
      };

      (auditLogRepository.create as jest.Mock).mockResolvedValue(mockAuditLog);

      await auditService.logRequestStart(req, 'TestController', 'testMethod');

      const callArgs = (auditLogRepository.create as jest.Mock).mock.calls[0][0];
      expect(callArgs.metadata.browser).toBe('Safari');
      // Should still have version 'unknown' if Version/ pattern not found
      expect(callArgs.version).toBeDefined();
    });

    it('should detect Edge browser without version', async () => {
      const req = {
        user: { user_id: 'user-123' },
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 KHTML like Gecko Version/4.0 Edg/120.0.0.0',
        },
        method: 'GET',
        originalUrl: '/test',
        ip: '192.168.1.1',
      };

      (auditLogRepository.create as jest.Mock).mockResolvedValue(mockAuditLog);

      await auditService.logRequestStart(req, 'TestController', 'testMethod');

      const callArgs = (auditLogRepository.create as jest.Mock).mock.calls[0][0];
      expect(callArgs.metadata.browser).toBe('Edge');
    });

    it('should detect Android (not iPhone)', async () => {
      const req = {
        user: { user_id: 'user-123' },
        headers: {
          'user-agent': 'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36',
        },
        method: 'GET',
        originalUrl: '/test',
        ip: '192.168.1.1',
      };

      (auditLogRepository.create as jest.Mock).mockResolvedValue(mockAuditLog);

      await auditService.logRequestStart(req, 'TestController', 'testMethod');

      const callArgs = (auditLogRepository.create as jest.Mock).mock.calls[0][0];
      expect(callArgs.metadata.os).toBe('Android');
    });

    it('should detect Linux OS', async () => {
      const req = {
        user: { user_id: 'user-123' },
        headers: {
          'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        },
        method: 'GET',
        originalUrl: '/test',
        ip: '192.168.1.1',
      };

      (auditLogRepository.create as jest.Mock).mockResolvedValue(mockAuditLog);

      await auditService.logRequestStart(req, 'TestController', 'testMethod');

      const callArgs = (auditLogRepository.create as jest.Mock).mock.calls[0][0];
      expect(callArgs.metadata.os).toBe('Linux');
    });

    it('should handle unknown browser and OS', async () => {
      const req = {
        user: { user_id: 'user-123' },
        headers: {
          'user-agent': 'CustomBot/1.0',
        },
        method: 'GET',
        originalUrl: '/test',
        ip: '192.168.1.1',
      };

      (auditLogRepository.create as jest.Mock).mockResolvedValue(mockAuditLog);

      await auditService.logRequestStart(req, 'TestController', 'testMethod');

      const callArgs = (auditLogRepository.create as jest.Mock).mock.calls[0][0];
      expect(callArgs.metadata.browser).toBe('unknown');
      expect(callArgs.metadata.os).toBe('unknown');
    });

    it('should detect tablet device', async () => {
      const req = {
        user: { user_id: 'user-123' },
        headers: {
          'user-agent': 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15',
        },
        method: 'GET',
        originalUrl: '/test',
        ip: '192.168.1.1',
      };

      (auditLogRepository.create as jest.Mock).mockResolvedValue(mockAuditLog);

      await auditService.logRequestStart(req, 'TestController', 'testMethod');

      expect(auditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          device: 'tablet',
        }),
        mockQueryRunner,
      );
    });

    it('should detect Chrome with version', async () => {
      const req = {
        user: { user_id: 'user-123' },
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        method: 'GET',
        originalUrl: '/test',
        ip: '192.168.1.1',
      };

      (auditLogRepository.create as jest.Mock).mockResolvedValue(mockAuditLog);

      await auditService.logRequestStart(req, 'TestController', 'testMethod');

      const callArgs = (auditLogRepository.create as jest.Mock).mock.calls[0][0];
      expect(callArgs.metadata.browser).toBe('Chrome');
      expect(callArgs.version).toBe('120.0.0.0');
    });

    it('should detect Firefox with version', async () => {
      const req = {
        user: { user_id: 'user-123' },
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        },
        method: 'GET',
        originalUrl: '/test',
        ip: '192.168.1.1',
      };

      (auditLogRepository.create as jest.Mock).mockResolvedValue(mockAuditLog);

      await auditService.logRequestStart(req, 'TestController', 'testMethod');

      const callArgs = (auditLogRepository.create as jest.Mock).mock.calls[0][0];
      expect(callArgs.metadata.browser).toBe('Firefox');
      expect(callArgs.version).toBe('121.0');
    });

    it('should detect Safari with version', async () => {
      const req = {
        user: { user_id: 'user-123' },
        headers: {
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        },
        method: 'GET',
        originalUrl: '/test',
        ip: '192.168.1.1',
      };

      (auditLogRepository.create as jest.Mock).mockResolvedValue(mockAuditLog);

      await auditService.logRequestStart(req, 'TestController', 'testMethod');

      const callArgs = (auditLogRepository.create as jest.Mock).mock.calls[0][0];
      expect(callArgs.metadata.browser).toBe('Safari');
      expect(callArgs.version).toBe('17.1');
    });

    it('should detect Edge with version', async () => {
      const req = {
        user: { user_id: 'user-123' },
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 KHTML like Gecko Version/4.0 Edg/120.0.0.0',
        },
        method: 'GET',
        originalUrl: '/test',
        ip: '192.168.1.1',
      };

      (auditLogRepository.create as jest.Mock).mockResolvedValue(mockAuditLog);

      await auditService.logRequestStart(req, 'TestController', 'testMethod');

      const callArgs = (auditLogRepository.create as jest.Mock).mock.calls[0][0];
      expect(callArgs.metadata.browser).toBe('Edge');
      expect(callArgs.version).toBe('120.0.0.0');
    });
  });
});
