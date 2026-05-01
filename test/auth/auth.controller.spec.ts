import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/auth/controller/auth.controller';
import { AuthService } from '../../src/auth/services/auth.service';
import { Result, RegisterResponse } from '../../src/common/interfaces/interfaces';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUserData = {
        email: 'test@example.com',
        password: 'hashedPassword123',
        first_name: 'John',
        last_name: 'Doe',
      };

      const mockResponse: Result<RegisterResponse | null> = {
        statusCode: 201,
        message: 'User registered successfully',
        data: {
          access_token: 'token123',
          user: {
            user_id: 'uuid-123',
            email: 'test@example.com',
            first_name: 'John',
            last_name: 'Doe',
            user_type: 'USER',
            profile_photo: null,
            description: null,
            last_access: null,
            active: true,
          },
        },
        success: true,
      };

      jest.spyOn(authService, 'register').mockResolvedValue(mockResponse);

      const result = await authController.register(mockUserData);

      expect(result).toEqual(mockResponse);
      expect(authService.register).toHaveBeenCalledWith(mockUserData);
    });

    it('should return error if email already exists', async () => {
      const mockUserData = {
        email: 'existing@example.com',
        password: 'hashedPassword123',
        first_name: 'Jane',
        last_name: 'Doe',
      };

      const mockErrorResponse: Result<null> = {
        statusCode: 409,
        message: 'User with this email already exists',
        data: null,
        success: false,
      };

      jest.spyOn(authService, 'register').mockResolvedValue(mockErrorResponse);

      const result = await authController.register(mockUserData);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(409);
      expect(result.message).toContain('already exists');
      expect(authService.register).toHaveBeenCalledWith(mockUserData);
    });

    it('should pass user data to service', async () => {
      const mockUserData = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
      };

      const mockResponse: Result<RegisterResponse | null> = {
        statusCode: 201,
        message: 'User registered successfully',
        data: null,
        success: true,
      };

      jest.spyOn(authService, 'register').mockResolvedValue(mockResponse);

      await authController.register(mockUserData);

      expect(authService.register).toHaveBeenCalledTimes(1);
      expect(authService.register).toHaveBeenCalledWith(mockUserData);
    });
  });
});
