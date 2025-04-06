// src/game-events/game-events.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { GameBuildingEventProcessor } from './processors/game-building-event.processor'; // Le worker/processor
import { VillageModule } from '../village/village.module'; // Pour VillageModel
import { BuildingModule } from '../building/building.module'; // Potentiellement pour des helpers
import { UnitModule } from '../unit/unit.module'; // Potentiellement pour scheduleNextUnit
import { MongooseModule } from '@nestjs/mongoose';
import {
  BuildingEventSchema,
  GameEvent,
  GameEventSchema,
} from './schema/game-event.schema';
import { GameEventType } from './types/event.enum';
import { GameQueue } from './types/queue-enum';
import {
  IJobScheduler,
  JOB_SCHEDULER,
} from './interface/job-scheduler.interface';
import { BullMqJobSchedulerService } from './service/bullmq-scheduler.service';
import { GameConfigModule } from 'src/game-config/game-config.module';

// Définit le nom de la queue de manière centralisée
export const GAME_EVENTS_QUEUE = 'game-events';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: GameEvent.name, // <- provider "GameEventModel"
        useFactory: () => {
          const schema = GameEventSchema;
          // Déclare le discri "BuildingEvent"
          schema.discriminator('BuildingEvent', BuildingEventSchema);
          return schema;
        },
      },
      {
        name: 'BuildingEvent',  // <- provider "BuildingEventModel"
        useFactory: () => {
          // On peut réutiliser BuildingEventSchema
          // Astuce: mettre le même .discriminatorKey si besoin
          return BuildingEventSchema;
        },
      },
    ]),
    BullModule.registerQueue({
      name: GAME_EVENTS_QUEUE,
    }),
    BullModule.registerQueue({
      name: GameQueue.BUILDING,
    }),
    BullModule.registerQueue({
      name: GameQueue.UNIT,
    }),
    forwardRef(() => VillageModule),
    forwardRef(() => BuildingModule),
    forwardRef(() => UnitModule),
    GameConfigModule,
  ],
  providers: [
    GameBuildingEventProcessor,
    { provide: JOB_SCHEDULER, useValue: BullMqJobSchedulerService },
  ],
  // On peut exporter la constante du nom de la queue si utile
  exports: [MongooseModule, JOB_SCHEDULER],
})
export class GameEventModule {}
