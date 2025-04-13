import { Injectable, Logger } from '@nestjs/common'; // Importer Logger si besoin
import { InjectModel } from '@nestjs/mongoose';
// Importer les types Mongoose nécessaires, y compris ClientSession
import { Model, ClientSession, UpdateQuery } from 'mongoose';
import {
  AbstractGameJob,
  AbstractGameJobDocument,
} from '../document/abstract/abstract-game-job.schema';
import {
  BuildingJob,
  BuildingJobDocument,
} from '../document/building-job.schema';
import { GAME_JOB_TYPES } from '@app/game-job-publisher/constant/game-job-types.enum';
import { ObjectId } from 'mongodb';

// Interface simple pour les options, principalement pour la session
interface MongooseOptions {
  session?: ClientSession;
}

@Injectable()
export class BuildingJobRepository {
  private readonly logger = new Logger(BuildingJobRepository.name); // Ajouter logger si utilisé

  constructor(
    @InjectModel(AbstractGameJob.name)
    // Il est plus sûr de typer avec le document de BASE ici
    private readonly abstractJobModel: Model<BuildingJobDocument>,
  ) {}

  /**
   * Crée un nouveau document BuildingJob en base.
   * @param jobData Données partielles pour créer le job.
   * @param options Options Mongoose, peut contenir la session.
   * @returns Le document BuildingJob sauvegardé.
   */
  async create(
    jobData: Partial<BuildingJob>,
    options?: MongooseOptions,
  ): Promise<BuildingJobDocument> {
    const dataToCreate = {
      ...jobData,
      JobType: GAME_JOB_TYPES.BUILDING_JOB,
    };
    // La méthode statique create accepte les options de session
    // Elle retourne un tableau, même pour un seul document créé
    const createdJobs = await this.abstractJobModel.create(
      [dataToCreate],
      options ? options : {},
    );
    return createdJobs[0]; // Caster le premier élément retourné
  }

  /**
   * Trouve tous les documents qui sont des BuildingJob.
   * @param options Options Mongoose, peut contenir la session.
   */
  async findAll(options?: MongooseOptions): Promise<BuildingJobDocument[]> {
    return (await this.abstractJobModel
      .find(
        {
          JobType: GAME_JOB_TYPES.BUILDING_JOB,
        },
        options,
      )
      .exec()) as BuildingJobDocument[];
  }

  /**
   * Trouve un BuildingJob par son ID MongoDB.
   * @param id ID (string ou ObjectId).
   * @param options Options Mongoose, peut contenir la session.
   * @returns Le document trouvé ou null.
   */
  async findById(
    id: string | ObjectId,
    options?: MongooseOptions,
  ): Promise<BuildingJobDocument | null> {
    try {
      const job = await this.abstractJobModel.findById(id, options).exec();

      if (job && job.JobType === GAME_JOB_TYPES.BUILDING_JOB) {
        return job as BuildingJobDocument;
      }
      return null;
    } catch (error: unknown) {
      // Garder la gestion d'erreur type-safe
      this.handleMongoError(
        error,
        `findById: ${typeof id === 'string' ? id : id.toString()}`,
      );
      return null; // Retourner null après log/gestion si CastError
    }
  }

  /**
   * Met à jour un BuildingJob existant.
   * @param id ID du job à mettre à jour.
   * @param patch Données partielles ou opération de mise à jour ($set, $inc...).
   * @param options Options Mongoose, peut contenir la session.
   * @returns Le document BuildingJob mis à jour ou null si non trouvé/pas du bon type.
   */
  async update(
    id: string | ObjectId,
    patch: UpdateQuery<BuildingJob>, // Utiliser UpdateQuery pour permettre les opérateurs $
    options?: MongooseOptions,
  ): Promise<BuildingJobDocument | null> {
    try {
      const mongooseOptions = {
        new: true, // Garder pour retourner le doc mis à jour
        session: options?.session, // Ajouter la session
      };
      const updatedJob = await this.abstractJobModel
        .findOneAndUpdate(
          {
            // Filtre
            _id: id,
            JobType: GAME_JOB_TYPES.BUILDING_JOB,
          },
          patch, // Appliquer le patch/update directement
          mongooseOptions, // Passer les options combinées
        )
        .exec();

      return updatedJob as BuildingJobDocument | null;
    } catch (error: unknown) {
      this.handleMongoError(
        error,
        `update: ${typeof id === 'string' ? id : id.toString()}`,
      );
      return null;
    }
  }

  /**
   * Supprime un BuildingJob par son ID.
   * @param id ID du job à supprimer.
   * @param options Options Mongoose, peut contenir la session.
   * @returns Le document BuildingJob qui a été supprimé ou null si non trouvé/pas du bon type.
   */
  async delete(
    id: string | ObjectId,
    options?: MongooseOptions,
  ): Promise<BuildingJobDocument | null> {
    try {
      const mongooseOptions = {
        session: options?.session, // Ajouter la session
      };
      const deletedJob = await this.abstractJobModel
        .findOneAndDelete(
          {
            // Filtre
            _id: id,
            JobType: GAME_JOB_TYPES.BUILDING_JOB,
          },
          mongooseOptions, // Passer les options
        )
        .exec();

      return deletedJob as BuildingJobDocument | null;
    } catch (error: unknown) {
      this.handleMongoError(
        error,
        `delete: ${typeof id === 'string' ? id : id.toString()}`,
      );
      return null;
    }
  }

  /**
   * Trouve le job de construction actif pour une instance de bâtiment donnée.
   * @param buildingInstanceId ObjectId de l'instance de bâtiment.
   * @param options Options Mongoose, peut contenir la session.
   */
  async findActiveByInstanceId(
    buildingInstanceId: ObjectId,
    options?: MongooseOptions, // Accepter les options
  ): Promise<BuildingJobDocument | null> {
    const query = this.abstractJobModel.findOne({
      JobType: GAME_JOB_TYPES.BUILDING_JOB,
      buildingInstanceId: buildingInstanceId,
    });

    if (options) {
      query.setOptions(options);
    }

    return await query.exec();
  }

  // Helper privé pour gérer les erreurs CastError et autres
  private handleMongoError(error: unknown, context: string): void {
    if (error instanceof Error) {
      if (error.name === 'CastError') {
        this.logger.warn(`Invalid ID format in ${context}`);
        // Pour findById/update/delete, on retourne null, donc pas besoin de throw ici
        return;
      }
      this.logger.error(`Error in ${context}: ${error.message}`, error.stack);
    } else {
      this.logger.error(`Unknown error in ${context}`);
    }
    // Renvoyer l'erreur pour que la transaction échoue ou que le service la gère
    throw error;
  }
}
