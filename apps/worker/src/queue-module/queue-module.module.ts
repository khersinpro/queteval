import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { BuildingCompletedProcessor } from './processor/building-completed.processor';
import { UnitCompletedProcessor } from './processor/unit-completed.processor';
import { GAME_QUEUES } from '../../../../libs/game-job-publisher/src/constant/game_queues.enum';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: GAME_QUEUES.BUILDING_COMPLETED },
      { name: GAME_QUEUES.UNIT_COMPLETED },
    ),
  ],
  providers: [BuildingCompletedProcessor, UnitCompletedProcessor],
  exports: [BuildingCompletedProcessor, UnitCompletedProcessor],
})
export class QueueModuleModule {}
