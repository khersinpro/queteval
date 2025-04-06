import { GameEventType } from '../types/event.enum';

export interface ScheduleJobOptions {
  delay: number; // Millisecondes
  jobId?: string;
  removeOnComplete?: boolean | number | object;
  removeOnFail?: boolean | number | object;
}

export interface IJobScheduler {
  scheduleJob<T = any>(
    jobType: GameEventType | string, // Le type d'événement (utilisé pour le nom du job et le routage)
    payload: T,
    options: ScheduleJobOptions,
  ): Promise<void>;

  removeJob(jobId: string): Promise<void>; // Simplifié: jobId doit être unique ou le système doit savoir chercher
}

export const JOB_SCHEDULER = Symbol('IJobScheduler');
