import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
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

  async scheduleJob(scheduledJob: ScheduledJob): Promise<string> {
    const job = await this.buildingQueue.add(
      scheduledJob.job_type,
      scheduledJob.payload,
      scheduledJob.options,
    );

    if (!job || !job.id) {
      throw new InternalServerErrorException(
        'Erreur serveur lors de la création de la tâche.',
      );
    }

    return job.id;
  }

  async removeJob(scheduledJobId: string): Promise<void> {
    const job = await this.buildingQueue.getJob(scheduledJobId);
    if (job) {
      await job.remove();
      console.log(`Removed ATTACK job: ${scheduledJobId}`);
    }
  }
}
