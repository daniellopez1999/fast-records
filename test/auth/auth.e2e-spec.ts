import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../src/users/entities/user.entity';
import { StorageService } from '../../src/storage/services/storage.service';
import { ConfigService } from '../../src/config/config.service';
import { AuthController } from '../../src/auth/controller/auth.controller';
import { AuthService } from '../../src/auth/services/auth.service';
import { UsersService } from '../../src/users/services/users.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from '../../src/common/interceptors/response.interceptor';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let authService: any;

  beforeAll(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config = {
          JWT_SECRET: 'test-secret-key',
          JWT_EXPIRES_IN: '1h',
        };
        return config[key];
      }),
    };

    const mockStorageService = {
      validateOnInit: jest.fn().mockResolvedValue(undefined),
      onModuleInit: jest.fn().mockResolvedValue(undefined),
      uploadFile: jest.fn(),
      getFile: jest.fn(),
      createBucket: jest.fn(),
    };

    const mockUserRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    };

    const mockUsersService = {
      createUser: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };

    const mockAuthService = {
      register: jest.fn().mockImplementation((userData) => {
        return Promise.resolve({
          success: true,
          message: 'User registered successfully',
          data: {
            access_token: 'test-token-' + userData.email,
            user: {
              user_id: 'test-user-id-' + userData.email,
              email: userData.email,
              first_name: userData.first_name,
              last_name: userData.last_name,
              profile_photo: userData.profile_photo,
              description: userData.description,
            },
          },
          statusCode: 201,
        });
      }),
      login: jest.fn(),
      validateUser: jest.fn(),
      hashPassword: jest.fn(),
      generateToken: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({
          secret: 'test-secret-key',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: ResponseInterceptor,
        },
      ],
    })
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .overrideProvider(StorageService)
      .useValue(mockStorageService)
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockUserRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    authService = mockAuthService;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /auth/register', () => {
    const validUserData = {
      email: 'testuser@example.com',
      password: 'securePassword123',
      first_name: 'John',
      last_name: 'Doe',
      profile_photo: 'https://example.com/photo.jpg',
      description: 'Test user description',
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should register a new user successfully', () => {
      const mockUser = {
        user_id: 'user-123',
        email: validUserData.email,
        first_name: validUserData.first_name,
        last_name: validUserData.last_name,
        profile_photo: validUserData.profile_photo,
        description: validUserData.description,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const registerResponse = {
        success: true,
        message: 'User registered successfully',
        data: {
          access_token: 'test-token',
          user: mockUser,
        },
        statusCode: 201,
      };

      authService.register.mockResolvedValueOnce(registerResponse);

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(validUserData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('message');
          expect(res.body.data).toHaveProperty('access_token');
          expect(res.body.data).toHaveProperty('user');
          expect(res.body.data.user).toHaveProperty(
            'email',
            validUserData.email,
          );
          expect(res.body.data.user).toHaveProperty(
            'first_name',
            validUserData.first_name,
          );
          expect(res.body.data.user).toHaveProperty(
            'last_name',
            validUserData.last_name,
          );
        });
    });

    it('should reject registration with invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validUserData,
          email: 'invalid-email',
        })
        .expect(400);
    });

    it('should reject registration with missing email', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { email, ...dataWithoutEmail } = validUserData;
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(dataWithoutEmail)
        .expect(400);
    });

    it('should reject registration with missing password', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...dataWithoutPassword } = validUserData;
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(dataWithoutPassword)
        .expect(400);
    });

    it('should reject registration with password too short', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validUserData,
          email: 'shortpass@example.com',
          password: '123',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'Password must be at least 6 characters',
          );
        });
    });

    it('should reject registration with missing first_name', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { first_name, ...dataWithoutFirstName } = validUserData;
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(dataWithoutFirstName)
        .expect(400);
    });

    it('should reject registration with missing last_name', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { last_name, ...dataWithoutLastName } = validUserData;
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(dataWithoutLastName)
        .expect(400);
    });

    it('should allow registration with optional profile_photo omitted', () => {
      const userData = {
        email: 'usernoPhoto@example.com',
        password: 'securePassword123',
        first_name: 'Jane',
        last_name: 'Smith',
        description: 'User without photo',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body.data).toHaveProperty('access_token');
          expect(res.body.data.user).toHaveProperty('email', userData.email);
        });
    });

    it('should allow registration with optional description omitted', () => {
      const userData = {
        email: 'usernodesc@example.com',
        password: 'securePassword123',
        first_name: 'Bob',
        last_name: 'Johnson',
        profile_photo: 'https://example.com/bob.jpg',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body.data).toHaveProperty('access_token');
        });
    });

    it('should return access token that can be used for authenticated requests', async () => {
      const userData = {
        email: 'tokenuser@example.com',
        password: 'securePassword123',
        first_name: 'Token',
        last_name: 'User',
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData);

      expect(registerResponse.status).toBe(201);
      const { access_token } = registerResponse.body.data;
      expect(access_token).toBeDefined();
      expect(typeof access_token).toBe('string');
    });

    it('should reject registration with extra fields', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validUserData,
          email: 'extrafield@example.com',
          extraField: 'should be removed by whitelist',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
        });
    });

    it('should reject registration with first_name as non-string', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validUserData,
          email: 'nonstring@example.com',
          first_name: 123,
        })
        .expect(400);
    });

    it('should reject registration with last_name as non-string', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validUserData,
          email: 'nonstring2@example.com',
          last_name: 123,
        })
        .expect(400);
    });

    it('should handle empty string email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validUserData,
          email: '',
        })
        .expect(400);
    });

    it('should handle empty string password', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validUserData,
          password: '',
        })
        .expect(400);
    });
  });
});
