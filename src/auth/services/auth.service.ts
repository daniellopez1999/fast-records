import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/services/users.service';
import { User } from '../../users/entities/user.entity';
import {
  LoginResponse,
  RefreshResponse,
  RegisterResponse,
  Result,
} from '@common/interfaces/interfaces';
import { ResponseBuilder } from '@common/utils/response_builder/response.builder';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Validates user credentials
   * @param email User email
   * @param password User password
   * @returns User without password if valid, null otherwise
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      this.logger.log(`User validated successfully: ${email}`);
      return {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: user.user_type,
        profile_photo: user.profile_photo,
        description: user.description,
        last_access: user.last_access,
        active: user.active,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
    }

    this.logger.warn(`Failed login attempt for email: ${email}`);
    return null;
  }

  /**
   * Generates JWT access token (short-lived)
   * @param user Object containing at least user_id and email
   * @returns JWT access token
   */
  generateToken(user: Pick<User, 'user_id' | 'email'>): {
    access_token: string;
  } {
    const payload = { email: user.email, sub: user.user_id };
    return { access_token: this.jwtService.sign(payload) };
  }

  /**
   * Generates JWT refresh token (long-lived)
   * @param userId User id
   * @returns Signed refresh JWT
   */
  generateRefreshToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      { expiresIn: '7d' },
    );
  }

  /**
   * Registers new user
   * @param userData User registration data
   * @returns Created user and access token
   */
  async register(userData: any): Promise<Result<RegisterResponse | null>> {
    this.logger.log(`Registering new user: ${userData.email}`);
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await this.usersService.createUser({
        ...userData,
        password: hashedPassword,
      });

      const { access_token } = this.generateToken(user);
      this.logger.log(`User registered successfully: ${user.email}`);
      return ResponseBuilder.success(
        'User registered successfully',
        { access_token, user },
        201,
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        this.logger.warn(
          `Registration failed — email already exists: ${userData.email}`,
        );
        return ResponseBuilder.failed(
          'User with this email already exists',
          409,
        );
      }
      this.logger.error(`Registration failed for ${userData.email}`, error);
      throw new InternalServerErrorException('Registration failed: ' + error);
    }
  }

  /**
   * @description Logs in a user and issues JWT tokens
   * Flow in Controller Login Endpoint
   * @param user Validated user (from LocalStrategy)
   */
  login(user: Omit<User, 'password'>): {
    tokens: { access_token: string; refresh_token: string };
    result: Result<LoginResponse>;
  } {
    this.logger.log(`User logged in: ${user.email}`);
    const { access_token } = this.generateToken(user);
    const refresh_token = this.generateRefreshToken(user.user_id);

    return {
      tokens: { access_token, refresh_token },
      result: ResponseBuilder.success(
        'Login successful',
        { access_token, user },
        200,
      ),
    };
  }

  /**
   * Issues new access + refresh tokens from a valid refresh token
   * @param user User derived from refresh token payload
   */
  async refreshTokens(user: Omit<User, 'password'>): Promise<{
    tokens: { access_token: string; refresh_token: string };
    result: Result<RefreshResponse>;
  }> {
    this.logger.log(`Refreshing tokens for user: ${user.email}`);
    const { access_token } = this.generateToken(user);
    const refresh_token = this.generateRefreshToken(user.user_id);

    return {
      tokens: { access_token, refresh_token },
      result: ResponseBuilder.success(
        'Tokens refreshed successfully',
        { access_token },
        200,
      ),
    };
  }

  /**
   * Logout
   */
  logout(userId: string): Result<null> {
    this.logger.log(`User logged out: ${userId}`);
    return ResponseBuilder.success('Logout successful', null, 200);
  }
}
