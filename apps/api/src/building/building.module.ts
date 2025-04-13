import { Module } from '@nestjs/common';
import { VillageModule } from '../village/village.module';
import { GameConfigModule } from '../game-config/game-config.module';
import { GameJobPublisherModule } from '@app/game-job-publisher';
import { BuildingService } from './service/building.service';
import { BuildingController } from './controller/building.controller';

@Module({
  imports: [VillageModule, GameConfigModule, GameJobPublisherModule],
  providers: [BuildingService],
  controllers: [BuildingController],
})
export class BuildingModule {}
