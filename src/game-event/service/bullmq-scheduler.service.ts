import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import {
  IJobScheduler,
  ScheduleJobOptions,
} from '../interface/job-scheduler.interface';

import { GameQueue } from '../types/queue-enum';
import { GameEventType } from '../types/event.enum';

@Injectable()
export class BullMqJobSchedulerService
  implements IJobScheduler, OnModuleDestroy
{
  private readonly logger = new Logger(BullMqJobSchedulerService.name);
  private readonly queues: Map<GameQueue, Queue>;

  constructor(
    @InjectQueue(GameQueue.BUILDING) private buildingQueue: Queue,
    @InjectQueue(GameQueue.UNIT) private unitQueue: Queue,
  ) {
    this.queues = new Map<GameQueue, Queue>();
    this.queues.set(GameQueue.BUILDING, this.buildingQueue);
    this.queues.set(GameQueue.UNIT, this.unitQueue);
  }

  private getQueueForJobType(jobType: GameEventType | string): Queue {
    switch (jobType as GameEventType) {
      case GameEventType.BUILDING_COMPLETE:
        return this.buildingQueue;

      case GameEventType.UNIT_COMPLETE:
        return this.unitQueue;

      default:
        this.logger.error(`No queue mapping found for job type: ${jobType}`);
        throw new Error(`No queue configured for job type ${jobType}`);
    }
  }

  // Planifie le job dans la queue appropriée
  async scheduleJob<T = any>(
    jobType: GameEventType | string,
    payload: T,
    options: ScheduleJobOptions,
  ): Promise<void> {
    const targetQueue = this.getQueueForJobType(jobType);
    const {
      delay,
      jobId,
      removeOnComplete = true,
      removeOnFail = { age: 24 * 3600 },
    } = options;

    try {
      const job: Job<T> | undefined = await targetQueue.add(jobType, payload, {
        delay: delay > 0 ? delay : 0,
        jobId: jobId,
        removeOnComplete: removeOnComplete,
        removeOnFail: removeOnFail,
      });
      this.logger.log(
        `Job ${job?.id ?? jobId ?? 'auto'} type ${jobType} scheduled on queue '${targetQueue.name}' with delay ${delay}ms`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to schedule job ${jobId || 'auto'} type ${jobType} on queue '${targetQueue.name}': ${error}`,
        error,
      );
      throw error;
    }
  }

  // Supprime un job (simplifié, suppose jobId unique ou cherche partout)
  async removeJob(jobId: string): Promise<void> {
    this.logger.warn(
      `Attempting to remove job ${jobId}. This implementation might be inefficient if the queue isn't known.`,
    );
    let removed = false;
    for (const [queueName, queue] of this.queues.entries()) {
      try {
        const job = (await queue.getJob(jobId)) as Job | null;
        if (job) {
          await job.remove();
          this.logger.log(`Job ${jobId} removed from queue '${queueName}'.`);
          removed = true;
          break; // Sortir si trouvé (suppose jobId unique)
        }
      } catch (error) {
        this.logger.error(
          `Error removing job ${jobId} from queue '${queueName}': ${error}`,
        );
      }
    }
    if (!removed) {
      this.logger.warn(
        `Job ${jobId} not found in any known queue for removal.`,
      );
    }
  }

  // Nettoyage à la destruction du module
  async onModuleDestroy() {
    this.logger.log('Closing BullMQ queue connections...');
    await Promise.allSettled(
      Array.from(this.queues.values()).map((q) => q.close()),
    ).catch((e) => this.logger.error('Error closing queues:', e));
    this.logger.log('BullMQ queue connections closed.');
  }
}
