import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from '../services/auth.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { JwtRefreshGuard } from '../guards/jwt-refresh.guard';
import { AuditPublic } from '../../audit/decorators';
import {
  LoginResponse,
  RefreshResponse,
  RegisterResponse,
  Result,
} from '@common/interfaces/interfaces';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import {
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
} from '@common/constants/cookie.constants';

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
   * Logs in a user.
   *
   * Flow:
   *  1. Request arrives with { email, password } in the body.
   *  2. LocalAuthGuard intercepts and delegates to LocalStrategy.validate(),
   *     which calls authService.validateUser() to verify credentials with bcrypt.
   *     If invalid, a 401 is thrown before reaching this method.
   *  3. Passport attaches the validated user to request.user.
   *  4. @CurrentUser() reads request.user — no raw credentials ever reach here.
   *  5. Two JWTs are generated:
   *       - access_token  (15 min) → set as HttpOnly cookie + returned in body.
   *       - refresh_token (7 days) → set as HttpOnly cookie only (not in body).
   *
   * @param user Validated user injected by Passport via LocalAuthGuard
   * @param res  Express response used to set the HttpOnly cookies
   * @returns access_token and user info
   */
  @AuditPublic()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @CurrentUser() user: Omit<User, 'password'>,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Result<LoginResponse>> {
    const { tokens, result } = this.authService.login(user);
    res.cookie('access_token', tokens.access_token, ACCESS_COOKIE_OPTIONS);
    res.cookie('refresh_token', tokens.refresh_token, REFRESH_COOKIE_OPTIONS);
    return result;
  }

  /**
   * Refreshes access and refresh tokens
   * @param user Authenticated user object (from JwtRefreshGuard)
   * @param res Express response (passthrough)
   * @returns New access token
   */
  @AuditPublic()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(
    @CurrentUser() user: Omit<User, 'password'>,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Result<RefreshResponse>> {
    const { tokens, result } = await this.authService.refreshTokens(user);
    res.cookie('access_token', tokens.access_token, ACCESS_COOKIE_OPTIONS);
    res.cookie('refresh_token', tokens.refresh_token, REFRESH_COOKIE_OPTIONS);
    return result;
  }

  /**
   * Logs out the authenticated user.
   * @param res Express response (passthrough)
   * @returns Success message
   */
  @AuditPublic()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Result<null>> {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/auth' });
    return this.authService.logout(user.user_id);
  }
}
