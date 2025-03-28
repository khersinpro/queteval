import { Body, Controller, Delete, Patch } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch()
  update(@Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(1, updateUserDto);
  }

  @Delete()
  delete() {
    return this.userService.remove(1);
  }
}
