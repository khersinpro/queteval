import { Module } from '@nestjs/common';
import { BuildingService } from './service/building.service';
import { BuildingController } from './controller/building.controller';
import { VillageModule } from 'src/village/village.module';
import { GameConfigModule } from 'src/game-config/game-config.module';
import { GameEventModule } from 'src/game-event/game-event.module';

@Module({
  imports: [VillageModule, GameConfigModule, GameEventModule],
  providers: [BuildingService],
  controllers: [BuildingController],
})
export class BuildingModule {}
