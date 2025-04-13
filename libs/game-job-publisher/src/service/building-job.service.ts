import { Injectable, NotFoundException } from '@nestjs/common';
import { BuildingJobRepository } from '../repository/building-job.repository'; // Le repo Mongoose
import {
  BuildingJob,
  BuildingJobDocument,
} from '../document/building-job.schema'; // Les types Mongoose
import { ClientSession, UpdateQuery } from 'mongoose'; // Importer ClientSession pour les transactions
import { ObjectId } from 'mongodb';

// Interface optionnelle pour passer les options Mongoose (dont la session)
interface MongooseOptions {
  session?: ClientSession;
}

@Injectable()
export class BuildingJobService {
  constructor(
    private readonly buildingJobRepository: BuildingJobRepository, // L'injection reste la même
  ) {}

  /**
   * Crée un nouveau BuildingJob. Peut être exécuté dans une session.
   * @param jobData Données pour la création.
   * @param options Options Mongoose, peut contenir la session.
   */
  async create(
    jobData: Partial<BuildingJob>,
    options?: MongooseOptions, // Accepter les options
  ): Promise<BuildingJobDocument> {
    // Appeler la méthode create du repository Mongoose
    // IMPORTANT: Il faudra aussi adapter la méthode 'create' du REPOSITORY
    // pour qu'elle accepte et utilise la session !
    // Exemple: return this.buildingJobRepository.create(jobData, options);
    return this.buildingJobRepository.create(jobData, options); // Passer les options au repo
  }

  /**
   * Trouve tous les BuildingJobs. (Généralement pas besoin de session ici)
   */
  async findAll(): Promise<BuildingJobDocument[]> {
    // Note: find n'a généralement pas besoin de session sauf cas très spécifiques
    return this.buildingJobRepository.findAll();
  }

  /**
   * Trouve un BuildingJob par ID. Peut être exécuté dans une session.
   * @param id ID du job.
   * @param options Options Mongoose, peut contenir la session.
   */
  async findById(
    id: string,
    options?: MongooseOptions, // Accepter les options
  ): Promise<BuildingJobDocument | null> {
    // IMPORTANT: Adapter la méthode 'findById' du REPOSITORY pour utiliser la session !
    // Exemple: return this.buildingJobRepository.findById(id, options);
    return this.buildingJobRepository.findById(id, options);
  }

  /**
   * Met à jour un BuildingJob par ID. Peut être exécuté dans une session.
   * @param id ID du job.
   * @param patch Données partielles de mise à jour.
   * @param options Options Mongoose, peut contenir la session.
   */
  async update(
    id: string,
    // Utiliser UpdateQuery pour plus de flexibilité (permet $set, $inc etc.)
    // Ou garder Partial<BuildingJob> si vous ne faites que des $set implicites
    patch: UpdateQuery<BuildingJob>,
    options?: MongooseOptions, // Accepter les options
  ): Promise<BuildingJobDocument | null> {
    // IMPORTANT: Adapter la méthode 'update' du REPOSITORY pour utiliser la session !
    // Exemple: return this.buildingJobRepository.update(id, patch, options);
    return this.buildingJobRepository.update(id, patch, options);
  }

  /**
   * Supprime un BuildingJob par ID. Peut être exécuté dans une session.
   * @param id ID du job.
   * @param options Options Mongoose, peut contenir la session.
   */
  async delete(
    id: string,
    options?: MongooseOptions, // Accepter les options
  ): Promise<BuildingJobDocument | null> {
    // IMPORTANT: Adapter la méthode 'delete' du REPOSITORY pour utiliser la session !
    // Exemple: return this.buildingJobRepository.delete(id, options);
    return this.buildingJobRepository.delete(id, options);
  }

  // Retrait de la méthode 'save' générique qui n'a plus de sens avec Mongoose ici
  // async save(buildingJob: BuildingJob): Promise<BuildingJob> { ... }
}
