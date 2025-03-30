import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { VillageService } from './village.service';
import { Village } from './schema/village.schema';
import { CreateVillageDto } from './dto/create-village.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/user/user.entity';
import { BuildingConfigService } from 'src/game-config/building-config.service';
import { ResourceBuildingConfig } from 'src/game-config/types/base-building-config';

@ApiTags('Village')
@ApiBearerAuth()
@Controller('village')
export class VillageController {
  constructor(
    private readonly villageService: VillageService,
    private readonly buildingConfigService: BuildingConfigService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createVillage(
    @Body() data: CreateVillageDto,
    @CurrentUser() user: User,
  ): Promise<Village> {
    console.log(data);
    return this.villageService.createVillage(data, user);
  }

  @Get('test-get-config')
  testGetConfig() {
    const config =
      this.buildingConfigService.getBuildingConfig<ResourceBuildingConfig>(
        'Clay Pit',
      );
    return config;
  }
}
