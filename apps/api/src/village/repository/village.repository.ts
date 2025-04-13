import { Injectable, Logger } from '@nestjs/common'; // Ajouter Logger si besoin
import { InjectModel } from '@nestjs/mongoose'; // Import Mongoose
import {
  Model,
  FilterQuery,
  UpdateQuery,
  UpdateWriteOpResult,
  MongooseUpdateQueryOptions,
} from 'mongoose'; // Import Mongoose types
import { ObjectId } from 'mongodb'; // Garder pour le typage si utile
import { Village, VillageDocument } from '../document/village.schema'; // Importer le schéma/document Mongoose

@Injectable()
export class VillageRepository {
  // Ajouter un logger si vous l'utilisez (comme dans l'ancien code pour les erreurs)
  private readonly logger = new Logger(VillageRepository.name);

  constructor(
    @InjectModel(Village.name) // Injecter le Modèle Mongoose principal
    private readonly villageModel: Model<VillageDocument>, // Utiliser le type Document Mongoose
  ) {}

  /**
   * Crée et sauvegarde un nouveau village directement.
   * Gère l'initialisation des valeurs par défaut via le schéma Mongoose.
   * @param data Données partielles pour créer le village.
   * @returns Le document Village sauvegardé.
   */
  async create(data: Partial<Village>): Promise<VillageDocument> {
    // Utiliser la méthode statique create du modèle Mongoose
    // Pas besoin de gérer les defaults ici s'ils sont dans le schéma
    try {
      const createdVillage = await this.villageModel.create(data);
      return createdVillage;
    } catch (error) {
      this.logger.error(`Error creating village: ${error}`);
      throw error; // Renvoyer l'erreur pour une gestion supérieure
    }
  }

  /**
   * Trouve tous les villages.
   */
  async findAll(): Promise<VillageDocument[]> {
    return this.villageModel.find().exec();
  }

  async findById(id: string | ObjectId): Promise<VillageDocument | null> {
    try {
      return await this.villageModel.findById(id).exec();
    } catch (
      error: unknown // <-- Typer en unknown
    ) {
      let errorMessage = 'Unknown error in findById';
      let errorStack: string | undefined = undefined;

      // Vérifier si c'est une instance d'Error standard
      if (error instanceof Error) {
        errorMessage = error.message;
        errorStack = error.stack;
        // Vérifier spécifiquement la CastError de Mongoose
        if (error.name === 'CastError') {
          this.logger.warn(
            `Invalid ID format for findById: ${typeof id === 'string' ? id : id.toString()}`,
          );
          return null; // Retourner null pour CastError
        }
      } else {
        // Gérer les cas où autre chose qu'une Error est jetée
        errorMessage = String(error);
      }

      this.logger.error(
        `Error finding village by ID ${typeof id === 'string' ? id : id.toString()}: ${errorMessage}`,
        errorStack, // Passer la stack trace si disponible
      );
      // Renvoyer l'erreur originale ou une nouvelle erreur standardisée
      throw error;
    }
  }

  // Appliquer une logique similaire pour les catch dans update() et delete()
  async update(
    id: string | ObjectId,
    patch: Partial<Village>,
    options?: MongooseUpdateQueryOptions,
  ): Promise<VillageDocument | null> {
    try {
      const query = this.villageModel.findByIdAndUpdate(id, patch);
      if (options) {
        query.setOptions(options);
      }
      return await query.exec();
    } catch (error: unknown) {
      let errorMessage = 'Unknown error in update';
      let errorStack: string | undefined = undefined;

      if (error instanceof Error) {
        errorMessage = error.message;
        errorStack = error.stack;
        if (error.name === 'CastError') {
          this.logger.warn(
            `Invalid ID format for update: ${typeof id === 'string' ? id : id.toString()}`,
          );
          return null;
        }
      } else {
        errorMessage = String(error);
      }
      this.logger.error(
        `Error updating village ${typeof id === 'string' ? id : id.toString()}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async delete(id: string | ObjectId): Promise<VillageDocument | null> {
    try {
      return await this.villageModel.findByIdAndDelete(id).exec();
    } catch (error: unknown) {
      // <-- Typer en unknown
      let errorMessage = 'Unknown error in delete';
      let errorStack: string | undefined = undefined;

      if (error instanceof Error) {
        errorMessage = error.message;
        errorStack = error.stack;
        if (error.name === 'CastError') {
          this.logger.warn(
            `Invalid ID format for delete: ${typeof id === 'string' ? id : id.toString()}`,
          );
          return null;
        }
      } else {
        errorMessage = String(error);
      }
      this.logger.error(
        `Error deleting village ${typeof id === 'string' ? id : id.toString()}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  /**
   * Trouve les villages appartenant à un utilisateur spécifique.
   */
  async findByUserId(userId: number): Promise<VillageDocument[]> {
    return this.villageModel.find({ userId: userId }).exec();
  }

  /**
   * Exécute une opération updateOne native de MongoDB via le modèle Mongoose injecté.
   * Retourne le résultat brut du driver. Utiliser pour opérations atomiques ($inc, $pull...).
   * @param filter Filtre Mongoose/MongoDB pour trouver le document.
   * @param update Opération de mise à jour Mongoose/MongoDB (ex: { $set: { ... }, $pull: { ... } }).
   * @param options Options Mongoose/natives (optionnel).
   * @returns Promise<UpdateWriteOpResult> Le résultat de l'opération Mongoose.
   */
  async updateOne(
    filter: FilterQuery<VillageDocument>, // Type Mongoose pour les filtres
    update: UpdateQuery<VillageDocument>, // Type Mongoose pour les updates ($set, $pull...)
    options?: MongooseUpdateQueryOptions, // Type Mongoose pour les options
  ): Promise<UpdateWriteOpResult> {
    return this.villageModel.updateOne(filter, update, options).exec();
  }

  /**
   * Supprime un élément du tableau constructionQueue en utilisant updateOne.
   * @param villageId L'ObjectId du village.
   * @param queueItemId L'ObjectId de l'item à retirer.
   * @returns Promise<UpdateWriteOpResult> Le résultat de l'opération Mongoose updateOne.
   */
  async pullFromConstructionQueue(
    villageId: ObjectId,
    queueItemId: ObjectId,
  ): Promise<UpdateWriteOpResult> {
    return this.updateOne(
      { _id: villageId },
      { $pull: { constructionQueue: { _id: queueItemId } } },
    );
  }
}
