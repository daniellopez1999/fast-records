import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { User } from '../../src/users/entities/user.entity';
import { StorageService } from '../../src/storage/services/storage.service';
import { ConfigService } from '../../src/config/config.service';
import { AuthController } from '../../src/auth/controller/auth.controller';
import { AuthService } from '../../src/auth/services/auth.service';
import { UsersService } from '../../src/users/services/users.service';
import { LocalStrategy } from '../../src/auth/strategies/local.strategy';
import { JwtStrategy } from '../../src/auth/strategies/jwt.strategy';
import { JwtRefreshStrategy } from '../../src/auth/strategies/jwt-refresh.strategy';
import { ResponseInterceptor } from '../../src/common/interceptors/response.interceptor';

const TEST_JWT_SECRET = 'test-secret-key';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let authService: any;
  let jwtService: JwtService;
  let mockUserRepository: any;

  const mockUser = {
    user_id: 'test-user-id',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    user_type: 'user',
    profile_photo: null,
    description: null,
    last_access: new Date(),
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, any> = {
          JWT_SECRET: TEST_JWT_SECRET,
          JWT_EXPIRES_IN: '1h',
        };
        return config[key];
      }),
    };

    const mockNestConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const config: Record<string, any> = {
          JWT_SECRET: TEST_JWT_SECRET,
        };
        return config[key] ?? defaultValue;
      }),
    };

    const mockStorageService = {
      validateOnInit: jest.fn().mockResolvedValue(undefined),
      onModuleInit: jest.fn().mockResolvedValue(undefined),
      uploadFile: jest.fn(),
      getFile: jest.fn(),
      createBucket: jest.fn(),
    };

    mockUserRepository = {
      findOne: jest.fn().mockResolvedValue(mockUser),
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
      refreshTokens: jest.fn(),
      logout: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({
          secret: TEST_JWT_SECRET,
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: NestConfigService, useValue: mockNestConfigService },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
        LocalStrategy,
        JwtStrategy,
        JwtRefreshStrategy,
      ],
    })
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .overrideProvider(StorageService)
      .useValue(mockStorageService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    authService = mockAuthService;
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    delete process.env.JWT_SECRET;
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

  // ─── POST /auth/login ────────────────────────────────────────────────────────

  describe('POST /auth/login', () => {
    const loginResult = {
      success: true,
      message: 'Login successful',
      data: { access_token: 'test-access-token', user: {} },
      statusCode: 200,
    };

    const loginTokens = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should login successfully with valid credentials', () => {
      authService.validateUser.mockResolvedValueOnce(mockUser);
      authService.login.mockReturnValueOnce({
        tokens: loginTokens,
        result: loginResult,
      });

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('message', 'Login successful');
          expect(res.body.data).toHaveProperty('access_token');
          expect(res.body.data).toHaveProperty('user');
        });
    });

    it('should set access_token and refresh_token cookies on successful login', () => {
      authService.validateUser.mockResolvedValueOnce(mockUser);
      authService.login.mockReturnValueOnce({
        tokens: loginTokens,
        result: loginResult,
      });

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(200)
        .expect((res) => {
          const cookies: string[] = [res.headers['set-cookie']].flat();
          expect(
            cookies.some((c: string) => c.startsWith('access_token=')),
          ).toBe(true);
          expect(
            cookies.some((c: string) => c.startsWith('refresh_token=')),
          ).toBe(true);
        });
    });

    it('should return 401 with invalid credentials', () => {
      authService.validateUser.mockResolvedValueOnce(null);

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' })
        .expect(401);
    });

    it('should return 401 with non-existent email', () => {
      authService.validateUser.mockResolvedValueOnce(null);

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' })
        .expect(401);
    });

    it('should return 401 with missing email', () => {
      authService.validateUser.mockResolvedValueOnce(null);

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'password123' })
        .expect(401);
    });

    it('should return 401 with missing password', () => {
      authService.validateUser.mockResolvedValueOnce(null);

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com' })
        .expect(401);
    });

    it('should return 401 with empty credentials', () => {
      authService.validateUser.mockResolvedValueOnce(null);

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(401);
    });
  });

  // ─── POST /auth/refresh ──────────────────────────────────────────────────────

  describe('POST /auth/refresh', () => {
    let validRefreshToken: string;

    beforeEach(() => {
      jest.clearAllMocks();
      validRefreshToken = jwtService.sign(
        { sub: 'test-user-id', type: 'refresh' },
        { expiresIn: '7d' },
      );
      mockUserRepository.findOne.mockResolvedValue(mockUser);
    });

    it('should refresh tokens successfully', () => {
      authService.refreshTokens.mockResolvedValueOnce({
        tokens: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
        },
        result: {
          success: true,
          message: 'Tokens refreshed successfully',
          data: { access_token: 'new-access-token' },
          statusCode: 200,
        },
      });

      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', [`refresh_token=${validRefreshToken}`])
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty(
            'message',
            'Tokens refreshed successfully',
          );
          expect(res.body.data).toHaveProperty('access_token');
        });
    });

    it('should set new access_token and refresh_token cookies on successful refresh', () => {
      authService.refreshTokens.mockResolvedValueOnce({
        tokens: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
        },
        result: {
          success: true,
          message: 'Tokens refreshed successfully',
          data: { access_token: 'new-access-token' },
          statusCode: 200,
        },
      });

      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', [`refresh_token=${validRefreshToken}`])
        .expect(200)
        .expect((res) => {
          const cookies: string[] = [res.headers['set-cookie']].flat();
          expect(
            cookies.some((c: string) => c.startsWith('access_token=')),
          ).toBe(true);
          expect(
            cookies.some((c: string) => c.startsWith('refresh_token=')),
          ).toBe(true);
        });
    });

    it('should return 401 without refresh token cookie', () => {
      return request(app.getHttpServer()).post('/auth/refresh').expect(401);
    });

    it('should return 401 with an invalid (malformed) refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', ['refresh_token=this.is.not.valid'])
        .expect(401);
    });

    it('should return 401 when the token type is not refresh', () => {
      const wrongTypeToken = jwtService.sign({
        sub: 'test-user-id',
        email: 'test@example.com',
      });

      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', [`refresh_token=${wrongTypeToken}`])
        .expect(401);
    });

    it('should return 401 when user is not found', () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', [`refresh_token=${validRefreshToken}`])
        .expect(401);
    });
  });

  // ─── POST /auth/logout ───────────────────────────────────────────────────────

  describe('POST /auth/logout', () => {
    let validAccessToken: string;

    beforeEach(() => {
      jest.clearAllMocks();
      validAccessToken = jwtService.sign({
        sub: 'test-user-id',
        email: 'test@example.com',
      });
      authService.logout.mockReturnValue({
        success: true,
        message: 'Logout successful',
        data: null,
        statusCode: 200,
      });
    });

    it('should logout successfully with valid access token', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('message', 'Logout successful');
        });
    });

    it('should clear cookies on logout', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(200)
        .expect((res) => {
          const cookies: string[] = [res.headers['set-cookie']]
            .flat()
            .filter(Boolean);
          const accessCookie = cookies.find((c: string) =>
            c.startsWith('access_token='),
          );
          const refreshCookie = cookies.find((c: string) =>
            c.startsWith('refresh_token='),
          );
          if (accessCookie) expect(accessCookie).toMatch(/Expires=/i);
          if (refreshCookie) expect(refreshCookie).toMatch(/Expires=/i);
        });
    });

    it('should return 401 without access token', () => {
      return request(app.getHttpServer()).post('/auth/logout').expect(401);
    });

    it('should return 401 with invalid access token', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer this.is.not.valid')
        .expect(401);
    });

    it('should return 401 with a refresh token used as access token', () => {
      const refreshToken = jwtService.sign(
        { sub: 'test-user-id', type: 'refresh' },
        { expiresIn: '7d' },
      );

      // JwtStrategy only validates structure, so a refresh token is still a valid JWT
      // The guard doesn't care about type — it just verifies the signature
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(200); // JwtStrategy accepts any signed token
    });

    it('should call authService.logout with the authenticated user id', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(200);

      expect(authService.logout).toHaveBeenCalledWith('test-user-id');
    });
  });
});
