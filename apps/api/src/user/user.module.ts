import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './controller/user.controller';
import { UserService } from './service/user.service';
import { UserRepository } from './repository/user.repository';
import { User } from './entity/user.entity';
import { UserStorage } from './storage/user.storage';

@Module({
  imports: [TypeOrmModule.forFeature([User], 'mysql')],
  controllers: [UserController],
  providers: [UserService, UserRepository, UserStorage],
  exports: [UserService, UserRepository, UserStorage],
})
export class UserModule {}
