import {
  Entity,
  ObjectIdColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  TableInheritance,
  Index,
} from 'typeorm';
import { ObjectId } from 'mongodb';
import { GAME_JOB_TYPES } from '@app/game-job-publisher/constant/game-job-types.enum';
import { GAME_JOB_STATUS } from '@app/game-job-publisher/constant/game-job-status.enum';

@Entity('GameJob')
@TableInheritance({ column: { type: 'string', name: 'JobType' } })
export abstract class AbstractGameJob {
  @ObjectIdColumn()
  _id: ObjectId;

  @Index()
  @Column({
    type: 'enum',
    enum: GAME_JOB_TYPES,
    nullable: false,
  })
  JobType: GAME_JOB_TYPES;

  @Column({
    type: 'enum',
    enum: GAME_JOB_STATUS,
    default: GAME_JOB_STATUS.SCHEDULED,
    nullable: false,
  })
  status: GAME_JOB_STATUS;

  @Column({ nullable: false })
  originVillageId: ObjectId;

  @Column({ type: 'string', nullable: true })
  queuedJobId?: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column('simple-json', { nullable: true })
  result?: Record<string, any> | { error?: string; warning?: string };

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
