/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Village, VillageDocument } from '../../village/schema/village.schema';
import { GameEventType } from '../types/event.enum';
import { BuildingConfigService } from '../../game-config/service/building-config.service';
import { GameQueue } from '../types/queue-enum';
import { BuildingEvent } from '../schema/game-event.schema';

interface BuildingCompletePayload {
  villageId: string;
  buildingInstanceId: string;
  targetLevel: number;
  gameEventId: string;
}

@Processor(GameQueue.BUILDING)
export class GameBuildingEventProcessor extends WorkerHost {
  private readonly logger = new Logger('GameBuildingEventProcessor');

  constructor(
    @InjectModel(Village.name)
    private villageModel: Model<VillageDocument>,
    @InjectModel(BuildingEvent.name)
    private buildingEventModel: Model<BuildingEvent>,
    private buildingConfigService: BuildingConfigService,
  ) {
    super();
  }

  async process(
    job: Job<BuildingCompletePayload, any, GameEventType>,
  ): Promise<any> {
    this.logger.log(
      `Processing job ${job.id} type ${job.name} from queue ${GameQueue.BUILDING}`,
    );
    const gameEventId = job.data.gameEventId;

    try {
      if (job.name === GameEventType.BUILDING_COMPLETE) {
        await this.handleBuildingComplete(job as Job<BuildingCompletePayload>);
      } else {
        this.logger.warn(
          `Job ${job.id}: Unexpected job type ${job.name} in queue ${GameQueue.BUILDING}`,
        );
      }
      this.logger.log(`Job ${job.id} type ${job.name} completed successfully.`);
      return {};
    } catch (error) {
      this.logger.error(
        `Job ${job.id} type ${job.name} FAILED: ${error.message}`,
        error.stack,
      );

      if (gameEventId) {
        try {
          await this.buildingEventModel
            .updateOne(
              { _id: gameEventId, status: { $ne: 'FAILED' } },
              {
                $set: {
                  status: 'FAILED',
                  result: { error: `Processing failed: ${error.message}` },
                },
              },
            )
            .exec();
        } catch (dbError) {
          this.logger.error(
            `Error updating GameEvent ${gameEventId} to FAILED: ${dbError.message}`,
            dbError.stack,
          );
        }
      }
      throw error;
    }
  }

  // Logique métier pour la fin de construction/amélioration
  private async handleBuildingComplete(
    job: Job<BuildingCompletePayload>,
  ): Promise<void> {
    const { villageId, buildingInstanceId, targetLevel, gameEventId } =
      job.data;

    const gameEvent = await this.buildingEventModel
      .findOneAndUpdate(
        { _id: gameEventId, status: 'SCHEDULED' },
        { $set: { status: 'COMPLETED', completedAt: new Date() } },
        { new: true },
      )
      .exec();

    if (!gameEvent) {
      return;
    }

    this.logger.log(`GameEvent ${gameEventId} marked as COMPLETED.`);

    // 2. Logique métier Village
    const village = await this.villageModel.findById(villageId).exec();
    if (!village) throw new Error(`Village ${villageId} not found.`);

    const buildingIndex = village.buildings.findIndex(
      (b) => b._id.toString() === buildingInstanceId,
    );

    if (buildingIndex === -1) {
      return;
    }

    const building = village.buildings[buildingIndex];

    building.level = targetLevel;
    building.state = 'idle';
    village.markModified(`buildings.${buildingIndex}`);

    // 3. Recalcul Production
    const buildingConfig = this.buildingConfigService.getBuildingConfig(
      building.name,
    );
    if (buildingConfig?.type === 'resource' /* || other condition */) {
      this.recalculateProductionRates(village);
      village.markModified('resources');
    }

    await village.save();
    this.logger.log(
      `Job ${job.id}: Village ${villageId} updated. Building ${buildingInstanceId} level ${targetLevel}.`,
    );
  }

  private recalculateProductionRates(village: Village): void {
    console.log(village);
  }
}
