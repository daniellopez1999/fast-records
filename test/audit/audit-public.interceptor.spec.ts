import { Test, TestingModule } from '@nestjs/testing';
import { AuditPublicInterceptor } from '../../src/audit/interceptors/audit-public.interceptor';
import { AuditService } from '../../src/audit/services/audit.service';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of, throwError } from 'rxjs';
import { AuditLog, AuditStatus } from '../../src/audit/entities/audit-log.entity';

describe('AuditPublicInterceptor', () => {
  let auditPublicInterceptor: AuditPublicInterceptor;
  let auditService: AuditService;
  let reflector: Reflector;

  const mockAuditLog: AuditLog = {
    id: 'public-audit-id-123',
    user_id: null, // No user for public endpoints
    controller: 'AuthController',
    method: 'register',
    status: AuditStatus.STARTED,
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0',
    device: 'desktop',
    version: '120.0',
    http_method: 'POST',
    endpoint: '/auth/register',
    status_code: null,
    error_message: null,
    metadata: { browser: 'Chrome' },
    duration_ms: null,
    created_at: new Date(),
    finished_at: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditPublicInterceptor,
        {
          provide: AuditService,
          useValue: {
            logRequestStart: jest.fn(),
            logRequestEnd: jest.fn(),
          },
        },
        Reflector,
      ],
    }).compile();

    auditPublicInterceptor = module.get<AuditPublicInterceptor>(AuditPublicInterceptor);
    auditService = module.get<AuditService>(AuditService);
    reflector = module.get<Reflector>(Reflector);
  });

  describe('intercept', () => {
    it('should log public endpoint request when @AuditPublic() decorator is present', async () => {
      const mockRequest = { method: 'POST', originalUrl: '/auth/register' };
      const mockResponse = { statusCode: 201 };
      const mockHandler: CallHandler = {
        handle: () => of({ success: true }),
      };

      // Mock the reflector to return true (decorator is present)
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
        getHandler: () => ({ name: 'register' }),
        getClass: () => ({ name: 'AuthController' }),
      } as unknown as ExecutionContext;

      jest.spyOn(auditService, 'logRequestStart').mockResolvedValue(mockAuditLog);
      jest.spyOn(auditService, 'logRequestEnd').mockResolvedValue({
        ...mockAuditLog,
        status: AuditStatus.FINISHED,
        status_code: 201,
      });

      const result = await auditPublicInterceptor.intercept(mockContext, mockHandler);

      // Execute the observable
      await new Promise((resolve) => {
        result.subscribe(() => resolve(null));
      });

      expect(auditService.logRequestStart).toHaveBeenCalledWith(
        mockRequest,
        'AuthController',
        'register',
      );
      expect(auditService.logRequestEnd).toHaveBeenCalledWith(
        'public-audit-id-123',
        201,
        undefined,
        expect.any(Number),
      );
    });

    it('should skip audit when @AuditPublic() decorator is not present', async () => {
      const mockRequest = { method: 'GET', originalUrl: '/auth/profile' };
      const mockResponse = { statusCode: 200 };
      const mockHandler: CallHandler = {
        handle: () => of({ data: 'test' }),
      };

      // Reflector returns undefined (no decorator)
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
        getHandler: () => ({ name: 'getProfile' }),
        getClass: () => ({ name: 'AuthController' }),
      } as unknown as ExecutionContext;

      const result = await auditPublicInterceptor.intercept(mockContext, mockHandler);

      await new Promise((resolve) => {
        result.subscribe(() => resolve(null));
      });

      // Should not call audit service
      expect(auditService.logRequestStart).not.toHaveBeenCalled();
      expect(auditService.logRequestEnd).not.toHaveBeenCalled();
    });

    it('should handle errors in public endpoint auditing', async () => {
      const mockRequest = { method: 'POST', originalUrl: '/auth/register' };
      const mockResponse = { statusCode: 400 };
      const mockError = new Error('Validation error');
      Object.assign(mockError, { status: 400 });

      const mockHandler: CallHandler = {
        handle: () => throwError(() => mockError),
      };

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
        getHandler: () => ({ name: 'register' }),
        getClass: () => ({ name: 'AuthController' }),
      } as unknown as ExecutionContext;

      jest.spyOn(auditService, 'logRequestStart').mockResolvedValue(mockAuditLog);
      jest.spyOn(auditService, 'logRequestEnd').mockResolvedValue({
        ...mockAuditLog,
        status: AuditStatus.FINISHED_WITH_ERROR,
        status_code: 400,
      });

      const result = await auditPublicInterceptor.intercept(mockContext, mockHandler);

      // Execute the observable and catch the error
      await new Promise((resolve) => {
        result.subscribe(
          () => { },
          () => resolve(null),
        );
      });

      expect(auditService.logRequestEnd).toHaveBeenCalledWith(
        'public-audit-id-123',
        400,
        'Validation error',
        expect.any(Number),
      );
    });

    it('should measure public endpoint request duration', async () => {
      const mockRequest = { method: 'POST', originalUrl: '/auth/login' };
      const mockResponse = { statusCode: 200 };

      const mockHandler: CallHandler = {
        handle: () => new Observable((observer) => {
          setTimeout(() => {
            observer.next({ token: 'jwt-token' });
            observer.complete();
          }, 50);
        }),
      };

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
        getHandler: () => ({ name: 'login' }),
        getClass: () => ({ name: 'AuthController' }),
      } as unknown as ExecutionContext;

      jest.spyOn(auditService, 'logRequestStart').mockResolvedValue(mockAuditLog);
      jest.spyOn(auditService, 'logRequestEnd').mockResolvedValue(mockAuditLog);

      const result = await auditPublicInterceptor.intercept(mockContext, mockHandler);

      await new Promise((resolve) => {
        result.subscribe(() => resolve(null));
      });

      expect(auditService.logRequestEnd).toHaveBeenCalledWith(
        'public-audit-id-123',
        200,
        undefined,
        expect.any(Number),
      );

      // Verify that duration is at least ~50ms (allowing some variance)
      const callArgs = (auditService.logRequestEnd as jest.Mock).mock.calls[0];
      expect(callArgs[3]).toBeGreaterThanOrEqual(40);
    });
  });
});
