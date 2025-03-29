import {
  Body,
  Controller,
  Delete,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { OwnerOrAdminGuard } from 'src/auth/guard/owner-or-admin.guard';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Mettre à jour un utilisateur' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID de l’utilisateur' })
  @UseGuards(JwtAuthGuard, OwnerOrAdminGuard)
  @Patch(':id')
  async update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @ApiOperation({ summary: 'Supprimer un utilisateur' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID de l’utilisateur' })
  @UseGuards(JwtAuthGuard, OwnerOrAdminGuard)
  @Delete(':id')
  async delete(@Param('id') id: number) {
    return this.userService.remove(id);
  }
}
