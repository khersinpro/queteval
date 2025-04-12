import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { GAME_QUEUES } from '../constant/game_queues.enum';

@Injectable()
export class UnitJobPublisherService {
  constructor(
    @InjectQueue(GAME_QUEUES.UNIT_COMPLETED) private readonly unitQueue: Queue,
  ) {}

  public async scheduleJob() {
    const job = await this.unitQueue.add('unit-completed', {
      unitId: 'unit-id',
      buildingId: 'building-id',
    });

    console.log('UnitJobPublisherService', job);
  }
}
