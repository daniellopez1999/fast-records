import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { AuditPublic } from '../../audit/decorators';
import { RegisterResponse, Result } from '@common/interfaces/interfaces';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registers a new user
   * Validates input with CreateUserDto and hashes password
   * Returns JWT access token on success
   *
   * @param createUserDto User registration data
   * @returns Created user with access token
   */
  @AuditPublic()
  @Post('register')
  async register(
    @Body()
    createUserDto: CreateUserDto,
  ): Promise<Result<RegisterResponse | null>> {
    return this.authService.register(createUserDto);
  }

  /**
   * Logs in a user
   * Uses LocalAuthGuard to validate credentials
   * Returns JWT access token on success
   *
   * @param user Authenticated user object (from LocalAuthGuard)
   * @returns Access token
   */
  @AuditPublic()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@CurrentUser() user: any): Promise<any> {
    return this.authService.login(user);
  }
}
