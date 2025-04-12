import { GAME_JOB_TYPES } from '../constant/game-job-types.enum';

/**
 * @description ScheduledJob représente un job à publier
 * @property job_type Le type du job à publier (ATTACK_JOB, BUILDING_JOB ...)
 * @property payload Le payload du job à publie (les paramètres du job)
 * @property options Les options du job à publier (delay, removeOnComplete, removeOnFail)
 */
export interface ScheduledJob {
  job_type: GAME_JOB_TYPES;
  payload: {
    database_job_id: string;
  };
  options: {
    delay: number;
    removeOnComplete?: boolean | number | object;
    removeOnFail?: boolean | number | object;
  };
}

/**
 * @description IJobPublisher fournit un service pour publier des jobs
 */
export interface IJobPublisher {
  /**
   * @description Ajoute un job à la queue
   * @param scheduledJob Le job à publier
   */
  scheduleJob(scheduledJob: ScheduledJob): Promise<string>;

  /**
   * @description Supprime un job de la queue
   * @param scheduledJobId L'id du job à supprimer
   */
  removeJob(scheduledJobId: string): Promise<void>;
}

/**
 * @description JOB_PUBLISHER fournit un service pour publier des jobs
 */
export const JOB_PUBLISHER = Symbol('JOB_PUBLISHER');

/**
 * @description BUILDING_JOB_PUBLISHER fournit un service pour publier des jobs de construction
 */
export const BUILDING_JOB_PUBLISHER = Symbol('BUILDING_JOB_PUBLISHER');

/**
 * @description UNIT_JOB_PUBLISHER fournit un service pour publier des jobs d'attaque
 */
export const ATTACK_JOB_PUBLISHER = Symbol('ATTACK_JOB_PUBLISHER');
