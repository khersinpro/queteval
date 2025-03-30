import { Module } from '@nestjs/common';
import { VillageService } from './village.service';
import { VillageController } from './village.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Village, VillageSchema } from './schema/village.schema';
import { VillageRepository } from './village.repository';
import { GameConfigModule } from 'src/game-config/game-config.module';

@Module({
  imports: [
    GameConfigModule,
    MongooseModule.forFeature([{ name: Village.name, schema: VillageSchema }]),
  ],
  providers: [VillageService, VillageRepository, VillageService],
  controllers: [VillageController],
})
export class VillageModule {}
