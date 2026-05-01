import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/auth/controller/auth.controller';
import { UsersService } from '../../src/users/services/users.service';
import { Result, UserWithoutPassword } from '../../src/common/interfaces/interfaces';

describe('AuthController', () => {
  let authController: AuthController;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            createUser: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUserData = {
        email: 'test@example.com',
        password: 'hashedPassword123',
        first_name: 'John',
        last_name: 'Doe',
      };

      const mockResponse: Result<UserWithoutPassword> = {
        statusCode: 201,
        message: 'User created successfully',
        data: {
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
        success: true,
      };

      jest.spyOn(usersService, 'createUser').mockResolvedValue(mockResponse);

      const result = await authController.register(mockUserData);

      expect(result).toEqual(mockResponse);
      expect(usersService.createUser).toHaveBeenCalledWith(mockUserData);
    });

    it('should return error if email already exists', async () => {
      const mockUserData = {
        email: 'existing@example.com',
        password: 'hashedPassword123',
        first_name: 'Jane',
        last_name: 'Doe',
      };

      const mockResponse: Result<UserWithoutPassword> = {
        statusCode: 409,
        message: 'User Email already exists',
        data: null,
        success: false,
      };

      jest.spyOn(usersService, 'createUser').mockResolvedValue(mockResponse);

      const result = await authController.register(mockUserData);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(409);
      expect(result.message).toContain('already exists');
      expect(usersService.createUser).toHaveBeenCalledWith(mockUserData);
    });

    it('should pass user data to service', async () => {
      const mockUserData = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
      };

      jest
        .spyOn(usersService, 'createUser')
        .mockResolvedValue({} as any);

      await authController.register(mockUserData);

      expect(usersService.createUser).toHaveBeenCalledTimes(1);
      expect(usersService.createUser).toHaveBeenCalledWith(mockUserData);
    });
  });
});
