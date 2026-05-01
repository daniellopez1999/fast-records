import { Injectable, Res } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UsersRepository } from '../repositories/users.repository';
import { ResponseBuilder } from "@common/utils/response_builder/response.builder"
import { User } from '../entities/user.entity';
import { Result, UserWithoutPassword } from '@common/interfaces/interfaces';

@Injectable()
export class UsersService {
  constructor(private readonly dataSource: DataSource, private readonly usersRepository: UsersRepository) { }

  findAll() {
    return [];
  }

  async createUser(userData: any): Promise<Result<UserWithoutPassword>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.usersRepository.findByEmail(queryRunner, userData);

      // If user exists, enters if statement, otherwise creates user
      if (user) {
        return ResponseBuilder.build("User Email already exists", user, false, 400);
      }

      const userCreated = await this.usersRepository.create(queryRunner, userData);
      await queryRunner.commitTransaction();
      return ResponseBuilder.build("User created successfully", userCreated, true, 201);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}

