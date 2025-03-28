import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CreateUserDto } from '../auth/dto/create-user.dto';
import { User } from './user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(createUserDto: CreateUserDto) {
    return await this.userRepository.create(createUserDto);
  }

  async findByEmail(email: string) {
    return await this.userRepository.findByEmail(email);
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) throw new NotFoundException(`User with id: ${id} not found`);

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    return await this.userRepository.update(id, updateUserDto);
  }

  async remove(id: number) {
    await this.userRepository.delete(id);
  }
}
