import { Module } from '@nestjs/common';
import { BuildingJobPublisherService } from './publisher/building-job-publisher.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AbstractGameJob } from './document/abstract/abstract-game-job.document';
import { BuildingJob } from './document/building-job.document';
import { BUILDING_JOB_PUBLISHER } from './interface/job-publisher.interface';
import { BullModule } from '@nestjs/bullmq';
import { GAME_QUEUES } from './constant/game_queues.enum';
import { BuildingJobRepository } from './repository/building-job.repository';
import { BuildingJobService } from './service/building-job.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AbstractGameJob, BuildingJob], 'mongodb'),
    BullModule.registerQueue(
      { name: GAME_QUEUES.BUILDING_COMPLETED },
      { name: GAME_QUEUES.UNIT_COMPLETED },
    ),
  ],
  providers: [
    BuildingJobRepository,
    BuildingJobService,
    { provide: BUILDING_JOB_PUBLISHER, useValue: BuildingJobPublisherService },
  ],
  exports: [BUILDING_JOB_PUBLISHER],
})
export class GameJobPublisherModule {}
