import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from '../../src/users/repositories/users.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserType } from '../../src/users/entities/user.entity';
import { QueryRunner, Repository } from 'typeorm';

describe('UsersRepository', () => {
  let usersRepository: UsersRepository;
  let repository: Repository<User>;
  let queryRunner: QueryRunner;

  beforeEach(async () => {
    const mockQueryRunner = {
      manager: {
        save: jest.fn(),
        findOne: jest.fn(),
      },
    } as unknown as QueryRunner;

    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    } as unknown as Repository<User>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    usersRepository = module.get<UsersRepository>(UsersRepository);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
    queryRunner = mockQueryRunner;
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData: Partial<User> = {
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

      jest.spyOn(repository, 'create').mockReturnValue(newUser);
      jest.spyOn(queryRunner.manager, 'save').mockResolvedValue(newUser);

      const result = await usersRepository.create(queryRunner, userData);

      expect(result).toEqual(newUser);
      expect(repository.create).toHaveBeenCalledWith(userData);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(User, newUser);
    });

    it('should handle creation errors', async () => {
      const userData: Partial<User> = {
        email: 'error@example.com',
        password: 'password',
        first_name: 'Error',
        last_name: 'User',
      };

      jest.spyOn(repository, 'create').mockReturnValue(userData as User);
      jest
        .spyOn(queryRunner.manager, 'save')
        .mockRejectedValue(new Error('Database error'));

      await expect(
        usersRepository.create(queryRunner, userData),
      ).rejects.toThrow('Database error');
    });
  });

  describe('findByEmail', () => {
    it('should return a user if email exists', async () => {
      const email = 'existing@example.com';
      const userData: Partial<User> = { email };

      const existingUser: User = {
        user_id: 'uuid-456',
        email,
        password: 'hashedPassword',
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
        .spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValue(existingUser);

      const result = await usersRepository.findByEmail(queryRunner, userData, [
        'email',
      ]);

      expect(result).toEqual(existingUser);
      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(User, {
        where: { email },
        select: ['email'],
      });
    });

    it('should return null if email does not exist', async () => {
      const email = 'nonexistent@example.com';
      const userData: Partial<User> = { email };

      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValue(null);

      const result = await usersRepository.findByEmail(queryRunner, userData, [
        'email',
      ]);

      expect(result).toBeNull();
      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(User, {
        where: { email },
        select: ['email'],
      });
    });

    it('should use email from userData parameter', async () => {
      const email = 'test@example.com';
      const userData: Partial<User> = { email, first_name: 'Test' };

      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValue(null);

      await usersRepository.findByEmail(queryRunner, userData, ['email']);

      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(User, {
        where: { email },
        select: ['email'],
      });
    });

    it('should handle database errors', async () => {
      const userData: Partial<User> = { email: 'error@example.com' };

      jest
        .spyOn(queryRunner.manager, 'findOne')
        .mockRejectedValue(new Error('Database connection error'));

      await expect(
        usersRepository.findByEmail(queryRunner, userData, ['email']),
      ).rejects.toThrow('Database connection error');
    });
  });
});
