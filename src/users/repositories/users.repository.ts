import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async create(
    queryRunner: QueryRunner,
    userData: Partial<User>,
  ): Promise<User> {
    const user = this.repository.create(userData);
    return queryRunner.manager.save(User, user);
  }

  async findByEmail(
    queryRunner: QueryRunner,
    userData: Partial<User>,
    fieldsToSelect: (keyof User)[],
  ): Promise<User | null> {
    const existingEmail = await queryRunner.manager.findOne(User, {
      where: { email: userData.email },
      select: fieldsToSelect,
    });
    if (existingEmail) return existingEmail;
    return null;
  }
}
