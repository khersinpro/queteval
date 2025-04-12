import { Processor, WorkerHost } from '@nestjs/bullmq';
import { GAME_QUEUES } from '@app/game-job-publisher/constant/game_queues.enum';

@Processor(GAME_QUEUES.UNIT_COMPLETED)
export class UnitCompletedProcessor extends WorkerHost {
  public async process(job) {
    console.log('UnitCompletedProcessor', job.data);
  }
}
