import { ConflictException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UsersRepository } from '../repositories/users.repository';
import { UserWithoutPassword } from '@common/interfaces/interfaces';

@Injectable()
export class UsersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly usersRepository: UsersRepository,
  ) { }

  findAll() {
    return [];
  }

  async createUser(userData: any): Promise<UserWithoutPassword> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.usersRepository.findByEmail(
        queryRunner,
        userData,
        ['email']
      );

      // If user exists, enters if statement, otherwise creates user
      if (user) {
        throw new ConflictException('User with this email already exists');
      }

      const userCreated = await this.usersRepository.create(
        queryRunner,
        userData,
      );
      await queryRunner.commitTransaction();

      // Exclude password and timestamps
      const { ...userWithoutSensitiveData } = userCreated;
      return userWithoutSensitiveData as UserWithoutPassword;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
