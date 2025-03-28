import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserCredentialsDto } from './dto/user-credentials.dto';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from 'src/user/user.entity';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Connexion utilisateur' })
  @ApiBody({ type: UserCredentialsDto })
  @ApiResponse({ status: 201, description: 'User connected successfully' })
  @ApiResponse({ status: 400, description: 'Invalid credentials' })
  @Post('login')
  async login(@Body() userCredentials: UserCredentialsDto) {
    const user = await this.authService.validateUser(userCredentials);
    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @ApiOperation({ summary: "Inscription d'un nouvel utilisateur" })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @Post('register')
  async register(@Body() userDto: CreateUserDto) {
    const user = await this.authService.register(userDto);
    return this.authService.login(user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les infos du user connecté' })
  @ApiResponse({ status: 200, description: 'User information retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: User) {
    return user;
  }
}
