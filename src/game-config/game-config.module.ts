import { Module } from '@nestjs/common';
import { GameConfigService } from './service/game-config.service';
import { BuildingConfigService } from './service/building-config.service';

@Module({
  providers: [GameConfigService, BuildingConfigService],
  exports: [GameConfigService, BuildingConfigService],
})
export class GameConfigModule {}
