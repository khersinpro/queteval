import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { VillageService } from '../service/village.service';
import { Village } from '../document/village.schema';
import { CreateVillageDto } from '../dto/create-village.dto';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guard/roles.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../user/entity/user.entity';
import { BuildingConfigService } from '../../game-config/service/building-config.service';
import { ResourceBuildingConfig } from '../../game-config/types/base-building-config';

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
  // @Roles('ADMIN')
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
