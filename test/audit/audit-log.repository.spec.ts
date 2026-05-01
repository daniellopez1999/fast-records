import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogRepository } from '../../src/audit/repositories/audit-log.repository';
import { AuditLog, AuditStatus } from '../../src/audit/entities/audit-log.entity';

describe('AuditLogRepository', () => {
  let auditLogRepository: AuditLogRepository;
  let repository: Repository<AuditLog>;

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogRepository,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: {
            save: jest.fn(),
            findOneBy: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    auditLogRepository = module.get<AuditLogRepository>(AuditLogRepository);
    repository = module.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));
  });

  describe('create', () => {
    it('should create and save a new audit log', async () => {
      const auditData: Partial<AuditLog> = {
        user_id: 'user-123',
        controller: 'TestController',
        method: 'testMethod',
        status: AuditStatus.STARTED,
      };

      jest.spyOn(repository, 'save').mockResolvedValue(mockAuditLog);

      const result = await auditLogRepository.create(auditData);

      expect(result).toEqual(mockAuditLog);
      expect(repository.save).toHaveBeenCalledWith(auditData);
    });

    it('should handle creation errors', async () => {
      jest.spyOn(repository, 'save').mockRejectedValue(new Error('DB error'));

      await expect(
        auditLogRepository.create({ user_id: 'user-123' }),
      ).rejects.toThrow('DB error');
    });
  });

  describe('findById', () => {
    it('should find an audit log by ID', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockAuditLog);

      const result = await auditLogRepository.findById('audit-id-123');

      expect(result).toEqual(mockAuditLog);
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 'audit-id-123' });
    });

    it('should return null if audit log not found', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

      const result = await auditLogRepository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find all audit logs for a user', async () => {
      const mockLogs: AuditLog[] = [mockAuditLog, mockAuditLog];
      jest.spyOn(repository, 'find').mockResolvedValue(mockLogs);

      const result = await auditLogRepository.findByUserId('user-123', 50);

      expect(result).toEqual(mockLogs);
      expect(repository.find).toHaveBeenCalledWith({
        where: { user_id: 'user-123' },
        order: { created_at: 'DESC' },
        take: 50,
      });
    });

    it('should use default limit of 50', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      await auditLogRepository.findByUserId('user-123');

      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        }),
      );
    });

    it('should return empty array if no logs found', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await auditLogRepository.findByUserId('user-123');

      expect(result).toEqual([]);
    });

    it('should order by created_at descending', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      await auditLogRepository.findByUserId('user-123');

      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { created_at: 'DESC' },
        }),
      );
    });
  });

  describe('findByEndpoint', () => {
    it('should find all audit logs for an endpoint', async () => {
      const mockLogs: AuditLog[] = [mockAuditLog, mockAuditLog];
      jest.spyOn(repository, 'find').mockResolvedValue(mockLogs);

      const result = await auditLogRepository.findByEndpoint('/test', 100);

      expect(result).toEqual(mockLogs);
      expect(repository.find).toHaveBeenCalledWith({
        where: { endpoint: '/test' },
        order: { created_at: 'DESC' },
        take: 100,
      });
    });

    it('should use default limit of 50', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      await auditLogRepository.findByEndpoint('/api/users');

      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        }),
      );
    });

    it('should return empty array if no logs found', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await auditLogRepository.findByEndpoint('/non-existent');

      expect(result).toEqual([]);
    });

    it('should handle complex endpoint paths', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      await auditLogRepository.findByEndpoint('/api/users/123/profile?filter=active');

      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { endpoint: '/api/users/123/profile?filter=active' },
        }),
      );
    });
  });
});
