import { ChildEntity, Column } from 'typeorm';
import { GAME_JOB_TYPES } from '../constant/game-job-types.enum';
import { AbstractGameJob } from './abstract/abstract-game-job.document';
import { ObjectId } from 'mongodb';

@ChildEntity(GAME_JOB_TYPES.BUILDING_JOB)
export class BuildingJob extends AbstractGameJob {
  @Column({ nullable: false })
  buildingInstanceId: ObjectId;

  @Column({ type: 'number', nullable: false })
  targetLevel: number;

  @Column({ type: 'timestamp', nullable: false })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: false })
  endTime: Date;
}
