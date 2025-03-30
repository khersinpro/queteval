import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/user.entity';
import { UserRepository } from 'src/user/user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UserCredentialsDto } from './dto/user-credentials.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    userCredentials: UserCredentialsDto,
  ): Promise<User | null> {
    const user = await this.userRepository.findByEmail(userCredentials.email);

    if (
      user &&
      (await bcrypt.compare(userCredentials.password, user.password))
    ) {
      user.password = '';

      return user;
    }

    return null;
  }

  login(user: User): { access_token: string } {
    const payload = { email: user.email, sub: user.id };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(
    createUserDto: CreateUserDto,
    roles: string[] = ['USER'],
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      roles,
    });
  }
}
