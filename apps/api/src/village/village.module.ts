import { Module } from '@nestjs/common';
import { VillageService } from './service/village.service';
import { VillageController } from './controller/village.controller';
import { Village, VillageSchema } from './document/village.schema';
import { VillageRepository } from './repository/village.repository';
import { GameConfigModule } from '../game-config/game-config.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    GameConfigModule,
    MongooseModule.forFeature([
      { name: Village.name, schema: VillageSchema }, // Enregistrer uniquement le schéma racine
    ]),
  ],
  providers: [VillageService, VillageRepository],
  controllers: [VillageController],
  exports: [VillageService, VillageRepository],
})
export class VillageModule {}
