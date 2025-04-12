import { Module } from '@nestjs/common';
import { VillageModule } from '../village/village.module';
import { GameConfigModule } from '../game-config/game-config.module';
import { GameJobPublisherModule } from '@app/game-job-publisher';

@Module({
  imports: [VillageModule, GameConfigModule, GameJobPublisherModule],
  providers: [],
  controllers: [],
})
export class BuildingModule {}
