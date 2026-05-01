import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../src/users/services/users.service';
import { UsersRepository } from '../../src/users/repositories/users.repository';
import { DataSource, QueryRunner } from 'typeorm';
import { User, UserType } from '../../src/users/entities/user.entity';

describe('UsersService', () => {
  let usersService: UsersService;
  let usersRepository: UsersRepository;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  beforeEach(async () => {
    const mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        save: jest.fn(),
        findOne: jest.fn(),
      },
    } as unknown as QueryRunner;

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    } as unknown as DataSource;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            create: jest.fn(),
            findByEmail: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    usersRepository = module.get<UsersRepository>(UsersRepository);
    dataSource = module.get<DataSource>(DataSource);
    queryRunner = mockDataSource.createQueryRunner();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'hashedPassword123',
        first_name: 'John',
        last_name: 'Doe',
      };

      const newUser: User = {
        user_id: 'uuid-123',
        email: userData.email,
        password: userData.password,
        first_name: userData.first_name,
        last_name: userData.last_name,
        user_type: UserType.USER,
        profile_photo: null,
        description: null,
        last_access: null,
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      jest.spyOn(usersRepository, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(usersRepository, 'create').mockResolvedValue(newUser);

      const result = await usersService.createUser(userData);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(201);
      expect(result.message).toContain('successfully');
      expect(result.data).toEqual(newUser);
      expect(usersRepository.findByEmail).toHaveBeenCalledWith(queryRunner, userData);
      expect(usersRepository.create).toHaveBeenCalledWith(queryRunner, userData);
    });

    it('should return error if email already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'hashedPassword123',
        first_name: 'Jane',
        last_name: 'Doe',
      };

      const existingUser: User = {
        user_id: 'uuid-456',
        email: userData.email,
        password: 'differentPassword',
        first_name: 'Existing',
        last_name: 'User',
        user_type: UserType.USER,
        profile_photo: null,
        description: null,
        last_access: null,
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      jest
        .spyOn(usersRepository, 'findByEmail')
        .mockResolvedValue(existingUser);

      const result = await usersService.createUser(userData);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(400);
      expect(result.message).toContain('already exists');
      expect(usersRepository.create).not.toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'hashedPassword123',
        first_name: 'Test',
        last_name: 'User',
      };

      jest.spyOn(usersRepository, 'findByEmail').mockResolvedValue(null);
      jest
        .spyOn(usersRepository, 'create')
        .mockRejectedValue(new Error('Database error'));

      await expect(usersService.createUser(userData)).rejects.toThrow(
        'Database error',
      );

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should call transaction methods in order', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'hashedPassword123',
        first_name: 'Test',
        last_name: 'User',
      };

      const newUser: User = {
        user_id: 'uuid-123',
        email: userData.email,
        password: userData.password,
        first_name: userData.first_name,
        last_name: userData.last_name,
        user_type: UserType.USER,
        profile_photo: null,
        description: null,
        last_access: null,
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      jest.spyOn(usersRepository, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(usersRepository, 'create').mockResolvedValue(newUser);

      await usersService.createUser(userData);

      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return empty array', () => {
      const result = usersService.findAll();
      expect(result).toEqual([]);
    });
  });
});
