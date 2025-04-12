import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { GAME_QUEUES } from '@app/game-job-publisher/constant/game_queues.enum';

@Processor(GAME_QUEUES.BUILDING_COMPLETED)
export class BuildingCompletedProcessor extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    console.log('BuildingCompletedProcessor', job.data);
  }
}
