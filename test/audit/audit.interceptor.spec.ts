import { Test, TestingModule } from '@nestjs/testing';
import { AuditInterceptor } from '../../src/audit/interceptors/audit.interceptor';
import { AuditService } from '../../src/audit/services/audit.service';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of, throwError } from 'rxjs';
import { AuditLog, AuditStatus } from '../../src/audit/entities/audit-log.entity';

describe('AuditInterceptor', () => {
  let auditInterceptor: AuditInterceptor;
  let auditService: AuditService;
  let reflector: Reflector;

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
    status_code: null,
    error_message: null,
    error_json: null,
    metadata: { browser: 'Chrome' },
    duration_ms: null,
    created_at: new Date(),
    finished_at: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditInterceptor,
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

    auditInterceptor = module.get<AuditInterceptor>(AuditInterceptor);
    auditService = module.get<AuditService>(AuditService);
    reflector = module.get<Reflector>(Reflector);
  });

  describe('intercept', () => {
    it('should log request start and end on successful request', async () => {
      const mockRequest = { method: 'GET', originalUrl: '/test' };
      const mockResponse = { statusCode: 200 };
      const mockHandler: CallHandler = {
        handle: () => of({ data: 'test' }),
      };

      // Mock the reflector to return true (decorator is present)
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
        getHandler: () => mockAuditLog,
        getClass: () => ({ name: 'TestController' }),
      } as unknown as ExecutionContext;

      jest.spyOn(auditService, 'logRequestStart').mockResolvedValue(mockAuditLog);
      jest.spyOn(auditService, 'logRequestEnd').mockResolvedValue({
        ...mockAuditLog,
        status: AuditStatus.FINISHED,
        status_code: 200,
      });

      const result = await auditInterceptor.intercept(mockContext, mockHandler);

      // Execute the observable
      await new Promise((resolve) => {
        result.subscribe(() => resolve(null));
      });

      expect(auditService.logRequestStart).toHaveBeenCalled();
      expect(auditService.logRequestEnd).toHaveBeenCalledWith(
        'audit-id-123',
        200,
        undefined,
        expect.any(Number),
      );
    });

    it('should log request with error status on failed request', async () => {
      const mockRequest = { method: 'POST', originalUrl: '/test' };
      const mockResponse = { statusCode: 500 };
      const mockError = new Error('Test error');
      Object.assign(mockError, { status: 500 });

      const mockHandler: CallHandler = {
        handle: () => throwError(() => mockError),
      };

      // Mock the reflector to return true (decorator is present)
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
        getHandler: () => mockAuditLog,
        getClass: () => ({ name: 'TestController' }),
      } as unknown as ExecutionContext;

      jest.spyOn(auditService, 'logRequestStart').mockResolvedValue(mockAuditLog);
      jest.spyOn(auditService, 'logRequestEnd').mockResolvedValue({
        ...mockAuditLog,
        status: AuditStatus.FINISHED_WITH_ERROR,
        status_code: 500,
      });

      const result = await auditInterceptor.intercept(mockContext, mockHandler);

      // Execute the observable and catch the error
      await new Promise((resolve) => {
        result.subscribe(
          () => { },
          () => resolve(null),
        );
      });

      expect(auditService.logRequestEnd).toHaveBeenCalledWith(
        'audit-id-123',
        500,
        'Test error',
        expect.any(Number),
        mockError,
      );
    });

    it('should extract controller and method names from context', async () => {
      const mockRequest = { method: 'GET' };
      const mockResponse = { statusCode: 200 };
      const mockHandler = { name: 'getUserById' };

      // Mock the reflector to return true (decorator is present)
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
        getHandler: () => mockHandler,
        getClass: () => ({ name: 'UsersController' }),
      } as unknown as ExecutionContext;

      jest.spyOn(auditService, 'logRequestStart').mockResolvedValue(mockAuditLog);

      const mockHandlerCallable: CallHandler = {
        handle: () => of({ data: 'test' }),
      };

      const result = await auditInterceptor.intercept(mockContext, mockHandlerCallable);

      await new Promise((resolve) => {
        result.subscribe(() => resolve(null));
      });

      expect(auditService.logRequestStart).toHaveBeenCalledWith(
        mockRequest,
        'UsersController',
        'getUserById',
      );
    });

    it('should measure request duration', async () => {
      const mockRequest = { method: 'GET' };
      const mockResponse = { statusCode: 200 };

      const mockHandler: CallHandler = {
        handle: () => new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'test' });
            observer.complete();
          }, 50);
        }),
      };

      // Mock the reflector to return true (decorator is present)
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
        getHandler: () => mockAuditLog,
        getClass: () => ({ name: 'TestController' }),
      } as unknown as ExecutionContext;

      jest.spyOn(auditService, 'logRequestStart').mockResolvedValue(mockAuditLog);
      jest.spyOn(auditService, 'logRequestEnd').mockResolvedValue(mockAuditLog);

      const result = await auditInterceptor.intercept(mockContext, mockHandler);

      await new Promise((resolve) => {
        result.subscribe(() => resolve(null));
      });

      expect(auditService.logRequestEnd).toHaveBeenCalledWith(
        'audit-id-123',
        200,
        undefined,
        expect.any(Number),
      );
    });

    it('should handle default status code of 200', async () => {
      const mockRequest = { method: 'GET' };
      const mockResponse = {}; // No statusCode

      const mockHandler: CallHandler = {
        handle: () => of({ data: 'test' }),
      };

      // Mock the reflector to return true (decorator is present)
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
        getHandler: () => mockAuditLog,
        getClass: () => ({ name: 'TestController' }),
      } as unknown as ExecutionContext;

      jest.spyOn(auditService, 'logRequestStart').mockResolvedValue(mockAuditLog);
      jest.spyOn(auditService, 'logRequestEnd').mockResolvedValue(mockAuditLog);

      const result = await auditInterceptor.intercept(mockContext, mockHandler);

      await new Promise((resolve) => {
        result.subscribe(() => resolve(null));
      });

      expect(auditService.logRequestEnd).toHaveBeenCalledWith(
        'audit-id-123',
        200,
        undefined,
        expect.any(Number),
      );
    });

    it('should handle default error status code of 500', async () => {
      const mockRequest = { method: 'GET' };
      const mockResponse = { statusCode: 200 };
      const mockError = new Error('Unknown error');
      // No status property

      const mockHandler: CallHandler = {
        handle: () => throwError(() => mockError),
      };

      // Mock the reflector to return true (decorator is present)
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
        getHandler: () => mockAuditLog,
        getClass: () => ({ name: 'TestController' }),
      } as unknown as ExecutionContext;

      jest.spyOn(auditService, 'logRequestStart').mockResolvedValue(mockAuditLog);
      jest.spyOn(auditService, 'logRequestEnd').mockResolvedValue(mockAuditLog);

      const result = await auditInterceptor.intercept(mockContext, mockHandler);

      await new Promise((resolve) => {
        result.subscribe(
          () => { },
          () => resolve(null),
        );
      });

      expect(auditService.logRequestEnd).toHaveBeenCalledWith(
        'audit-id-123',
        500,
        'Unknown error',
        expect.any(Number),
        mockError,
      );
    });

    it('should handle error with undefined message', async () => {
      const mockRequest = { method: 'GET' };
      const mockResponse = { statusCode: 200 };
      const mockError: any = new Error();
      mockError.message = undefined;
      // No status property

      const mockHandler: CallHandler = {
        handle: () => throwError(() => mockError),
      };

      // Mock the reflector to return true (decorator is present)
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
        getHandler: () => mockAuditLog,
        getClass: () => ({ name: 'TestController' }),
      } as unknown as ExecutionContext;

      jest.spyOn(auditService, 'logRequestStart').mockResolvedValue(mockAuditLog);
      jest.spyOn(auditService, 'logRequestEnd').mockResolvedValue(mockAuditLog);

      const result = await auditInterceptor.intercept(mockContext, mockHandler);

      await new Promise((resolve) => {
        result.subscribe(
          () => { },
          () => resolve(null),
        );
      });

      expect(auditService.logRequestEnd).toHaveBeenCalledWith(
        'audit-id-123',
        500,
        'Unknown error',
        expect.any(Number),
        mockError,
      );
    });

    it('should skip audit when @Audit() decorator is not present', async () => {
      const mockRequest = { method: 'GET', originalUrl: '/test' };
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
        getHandler: () => ({}),
        getClass: () => ({ name: 'AuthController' }),
      } as unknown as ExecutionContext;

      const result = await auditInterceptor.intercept(mockContext, mockHandler);

      await new Promise((resolve) => {
        result.subscribe(() => resolve(null));
      });

      // Should not call audit service
      expect(auditService.logRequestStart).not.toHaveBeenCalled();
      expect(auditService.logRequestEnd).not.toHaveBeenCalled();
    });

    it('should audit when @Audit() decorator is present', async () => {
      const mockRequest = { method: 'GET', originalUrl: '/test' };
      const mockResponse = { statusCode: 200 };
      const mockHandler: CallHandler = {
        handle: () => of({ data: 'test' }),
      };

      // Reflector returns true (decorator is present)
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      jest.spyOn(auditService, 'logRequestStart').mockResolvedValue(mockAuditLog);
      jest.spyOn(auditService, 'logRequestEnd').mockResolvedValue({
        ...mockAuditLog,
        status: AuditStatus.FINISHED,
        status_code: 200,
      });

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
        getHandler: () => ({}),
        getClass: () => ({ name: 'UsersController' }),
      } as unknown as ExecutionContext;

      const result = await auditInterceptor.intercept(mockContext, mockHandler);

      await new Promise((resolve) => {
        result.subscribe(() => resolve(null));
      });

      // Should call audit service
      expect(auditService.logRequestStart).toHaveBeenCalled();
      expect(auditService.logRequestEnd).toHaveBeenCalledWith(
        'audit-id-123',
        200,
        undefined,
        expect.any(Number),
      );
    });
  });
});
