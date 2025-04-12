import { Module } from '@nestjs/common';
import { VillageService } from './service/village.service';
import { VillageController } from './controller/village.controller';
import { Village } from './document/village.document';
import { VillageRepository } from './repository/village.repository';
import { GameConfigModule } from '../game-config/game-config.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    GameConfigModule,
    TypeOrmModule.forFeature([Village], 'mongodb'),
  ],
  providers: [VillageService, VillageRepository, VillageService],
  controllers: [VillageController],
  exports: [VillageService, VillageRepository],
})
export class VillageModule {}
