import { Result, UserWithoutPassword } from '@common/interfaces/interfaces';
import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from '../../users/services/users.service';
import { AuditPublic } from 'src/audit/decorators';

@Controller('auth')
export class AuthController {
  constructor(private readonly usersService: UsersService) { }
  /**
   * Calls the createUser method in the UsersService to register a new user. 
   * It takes the user data from the request body and returns the result of the user creation process.
   * @param userData 
   * @returns 
   */
  @AuditPublic()
  @Post('register')
  register(@Body() userData: any): Promise<Result<UserWithoutPassword>> {
    return this.usersService.createUser(userData);
  }

}
