import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/services/users.service';
import { User } from '../../users/entities/user.entity';
import { RegisterResponse, Result } from '@common/interfaces/interfaces';
import { ResponseBuilder } from '@common/utils/response_builder/response.builder';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  /**
   * Validates user credentials
   * @param email User email
   * @param password User password
   * @returns User without password if valid, null otherwise
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  /**
   * Hashes password using bcrypt
   * @param password Plain password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Generates JWT token for user
   * @param user User object
   * @returns JWT access token
   */
  async generateToken(user: any): Promise<{ access_token: string }> {
    const payload = {
      email: user.email,
      sub: user.user_id,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  /**
   * Registers new user
   * @param userData User registration data
   * @returns Created user and JWT token
   */
  async register(userData: any): Promise<Result<RegisterResponse | null>> {
    try {
      const hashedPassword = await this.hashPassword(userData.password);
      const userWithHashedPassword = {
        ...userData,
        password: hashedPassword,
      };

      const user = await this.usersService.createUser(userWithHashedPassword);

      const token = await this.generateToken(user);
      return ResponseBuilder.success('User registered successfully', { access_token: token.access_token, user }, 201);
    } catch (error) {
      if (error instanceof ConflictException) {
        return ResponseBuilder.failed('User with this email already exists', 409);
      }
      throw new InternalServerErrorException('Registration failed: ' + error);
    }
  }

  /**
   * Logs in user
   * @param user User object (from passport strategy)
   * @returns JWT token
   */
  async login(user: any): Promise<{ access_token: string }> {
    return this.generateToken(user);
  }
}
