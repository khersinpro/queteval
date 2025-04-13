import { Module } from '@nestjs/common';
import { BuildingJobPublisherService } from './publisher/building-job-publisher.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AbstractGameJob,
  AbstractGameJobSchema,
} from './document/abstract/abstract-game-job.schema';
import { BuildingJob, BuildingJobSchema } from './document/building-job.schema';
import { BUILDING_JOB_PUBLISHER } from './interface/job-publisher.interface';
import { BullModule } from '@nestjs/bullmq';
import { GAME_QUEUES } from './constant/game_queues.enum';
import { BuildingJobRepository } from './repository/building-job.repository';
import { BuildingJobService } from './service/building-job.service';
import { MongooseModule } from '@nestjs/mongoose';
import { GAME_JOB_TYPES } from './constant/game-job-types.enum';

@Module({
  imports: [
    MongooseModule.forFeature([
      // Enregistrer le schéma de BASE
      {
        name: AbstractGameJob.name, // Nom utilisé pour l'injection de modèle (@InjectModel)
        schema: AbstractGameJobSchema,
        // Déclarer les discriminateurs (types enfants)
        discriminators: [
          {
            name: GAME_JOB_TYPES.BUILDING_JOB, // La VALEUR du discriminateur
            schema: BuildingJobSchema, // Le Schéma Mongoose de l'enfant
          },
          // Ajoutez ici d'autres types de jobs s'ils existent
          // { name: GAME_JOB_TYPES.ATTACK_JOB, schema: AttackJobSchema },
        ],
      },
    ]),
    BullModule.registerQueue(
      { name: GAME_QUEUES.BUILDING_COMPLETED },
      { name: GAME_QUEUES.UNIT_COMPLETED },
    ),
  ],
  providers: [
    BuildingJobRepository,
    BuildingJobService,
    { provide: BUILDING_JOB_PUBLISHER, useClass: BuildingJobPublisherService },
  ],
  exports: [BUILDING_JOB_PUBLISHER, BuildingJobService],
})
export class GameJobPublisherModule {}
