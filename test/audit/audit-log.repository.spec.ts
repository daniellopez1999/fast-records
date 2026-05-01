import { Test, TestingModule } from '@nestjs/testing';
import { QueryRunner } from 'typeorm';
import { AuditLogRepository } from '../../src/audit/repositories/audit-log.repository';
import { AuditLog, AuditStatus } from '../../src/audit/entities/audit-log.entity';

describe('AuditLogRepository', () => {
  let auditLogRepository: AuditLogRepository;
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
    metadata: { browser: 'Chrome' },
    duration_ms: 100,
    created_at: new Date(),
    finished_at: null,
  };

  beforeEach(async () => {
    mockQueryRunner = {
      manager: {
        save: jest.fn(),
        findOneBy: jest.fn(),
        find: jest.fn(),
      } as any,
    };

    auditLogRepository = new AuditLogRepository();
  });

  describe('create', () => {
    it('should create and save a new audit log', async () => {
      const auditData: Partial<AuditLog> = {
        user_id: 'user-123',
        controller: 'TestController',
        method: 'testMethod',
        status: AuditStatus.STARTED,
      };

      (mockQueryRunner.manager!.save as jest.Mock).mockResolvedValue(mockAuditLog);

      const result = await auditLogRepository.create(auditData, mockQueryRunner as QueryRunner);

      expect(result).toEqual(mockAuditLog);
      expect(mockQueryRunner.manager!.save).toHaveBeenCalledWith(AuditLog, auditData);
    });

    it('should handle creation errors', async () => {
      (mockQueryRunner.manager!.save as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(
        auditLogRepository.create({ user_id: 'user-123' }, mockQueryRunner as QueryRunner),
      ).rejects.toThrow('DB error');
    });
  });

  describe('findById', () => {
    it('should find an audit log by ID', async () => {
      (mockQueryRunner.manager!.findOneBy as jest.Mock).mockResolvedValue(mockAuditLog);

      const result = await auditLogRepository.findById('audit-id-123', mockQueryRunner as QueryRunner);

      expect(result).toEqual(mockAuditLog);
      expect(mockQueryRunner.manager!.findOneBy).toHaveBeenCalledWith(AuditLog, { id: 'audit-id-123' });
    });

    it('should return null if audit log not found', async () => {
      (mockQueryRunner.manager!.findOneBy as jest.Mock).mockResolvedValue(null);

      const result = await auditLogRepository.findById('non-existent-id', mockQueryRunner as QueryRunner);

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find all audit logs for a user', async () => {
      const mockLogs: AuditLog[] = [mockAuditLog, mockAuditLog];
      (mockQueryRunner.manager!.find as jest.Mock).mockResolvedValue(mockLogs);

      const result = await auditLogRepository.findByUserId('user-123', mockQueryRunner as QueryRunner, 50);

      expect(result).toEqual(mockLogs);
      expect(mockQueryRunner.manager!.find).toHaveBeenCalledWith(AuditLog, {
        where: { user_id: 'user-123' },
        order: { created_at: 'DESC' },
        take: 50,
      });
    });

    it('should use default limit of 50', async () => {
      (mockQueryRunner.manager!.find as jest.Mock).mockResolvedValue([]);

      await auditLogRepository.findByUserId('user-123', mockQueryRunner as QueryRunner);

      expect(mockQueryRunner.manager!.find).toHaveBeenCalledWith(
        AuditLog,
        expect.objectContaining({
          take: 50,
        }),
      );
    });

    it('should return empty array if no logs found', async () => {
      (mockQueryRunner.manager!.find as jest.Mock).mockResolvedValue([]);

      const result = await auditLogRepository.findByUserId('user-123', mockQueryRunner as QueryRunner);

      expect(result).toEqual([]);
    });

    it('should order by created_at descending', async () => {
      (mockQueryRunner.manager!.find as jest.Mock).mockResolvedValue([]);

      await auditLogRepository.findByUserId('user-123', mockQueryRunner as QueryRunner);

      expect(mockQueryRunner.manager!.find).toHaveBeenCalledWith(
        AuditLog,
        expect.objectContaining({
          order: { created_at: 'DESC' },
        }),
      );
    });
  });

  describe('findByEndpoint', () => {
    it('should find all audit logs for an endpoint', async () => {
      const mockLogs: AuditLog[] = [mockAuditLog, mockAuditLog];
      (mockQueryRunner.manager!.find as jest.Mock).mockResolvedValue(mockLogs);

      const result = await auditLogRepository.findByEndpoint('/test', mockQueryRunner as QueryRunner, 100);

      expect(result).toEqual(mockLogs);
      expect(mockQueryRunner.manager!.find).toHaveBeenCalledWith(AuditLog, {
        where: { endpoint: '/test' },
        order: { created_at: 'DESC' },
        take: 100,
      });
    });

    it('should use default limit of 50', async () => {
      (mockQueryRunner.manager!.find as jest.Mock).mockResolvedValue([]);

      await auditLogRepository.findByEndpoint('/api/users', mockQueryRunner as QueryRunner);

      expect(mockQueryRunner.manager!.find).toHaveBeenCalledWith(
        AuditLog,
        expect.objectContaining({
          take: 50,
        }),
      );
    });

    it('should return empty array if no logs found', async () => {
      (mockQueryRunner.manager!.find as jest.Mock).mockResolvedValue([]);

      const result = await auditLogRepository.findByEndpoint('/non-existent', mockQueryRunner as QueryRunner);

      expect(result).toEqual([]);
    });

    it('should handle complex endpoint paths', async () => {
      (mockQueryRunner.manager!.find as jest.Mock).mockResolvedValue([]);

      await auditLogRepository.findByEndpoint('/api/users/123/profile?filter=active', mockQueryRunner as QueryRunner);

      expect(mockQueryRunner.manager!.find).toHaveBeenCalledWith(
        AuditLog,
        expect.objectContaining({
          where: { endpoint: '/api/users/123/profile?filter=active' },
        }),
      );
    });
  });
});
