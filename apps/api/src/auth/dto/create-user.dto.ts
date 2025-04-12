import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: "Email de l'utilisateur",
  })
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: "Mot de passe de l'utilisateur",
  })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @MinLength(6, {
    message: 'Le mot de passe doit contenir au moins 6 caractères',
  })
  password: string;

  @ApiProperty({ example: 'john_doe', description: "Nom d'utilisateur" })
  @IsString({
    message: "Le nom d'utilisateur doit être une chaîne de caractères",
  })
  @MinLength(3, {
    message: "Le nom d'utilisateur doit contenir au moins 3 caractères",
  })
  username: string;
}
