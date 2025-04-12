import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { GAME_QUEUES } from '../constant/game_queues.enum';
import {
  IJobPublisher,
  ScheduledJob,
} from '../interface/job-publisher.interface';

@Injectable()
export class BuildingJobPublisherService implements IJobPublisher {
  constructor(
    @InjectQueue(GAME_QUEUES.BUILDING_COMPLETED)
    private readonly buildingQueue: Queue<ScheduledJob['payload']>,
  ) {}

  async scheduleJob(scheduledJob: ScheduledJob): Promise<void> {
    await this.buildingQueue.add(
      scheduledJob.job_type,
      scheduledJob.payload,
      scheduledJob.options,
    );
  }

  async removeJob(scheduledJobId: string): Promise<void> {
    const job = await this.buildingQueue.getJob(scheduledJobId);
    if (job) {
      await job.remove();
      console.log(`Removed ATTACK job: ${scheduledJobId}`);
    }
  }
}
