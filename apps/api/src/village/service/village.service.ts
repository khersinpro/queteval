import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VillageRepository } from '../repository/village.repository'; // Votre repository Mongoose
import { Village, VillageDocument } from '../document/village.schema'; // Importer le schéma/document Mongoose
import { CreateVillageDto } from '../dto/create-village.dto';
// Utiliser une interface simple pour l'utilisateur ou un type approprié
// Évitez d'importer directement l'entité User de TypeORM ici si possible
interface UserInput {
  id: number; // Ou string si l'ID utilisateur est une string
  // Ajoutez d'autres champs si nécessaire pour la logique métier
}
import { ObjectId } from 'mongodb'; // Ou Types de mongoose
import { UpdateWriteOpResult } from 'mongoose'; // Pour le retour de updateOne/pull

@Injectable()
export class VillageService {
  // L'injection du repository reste la même grâce à l'IoC de NestJS
  constructor(private readonly villageRepository: VillageRepository) {}

  /**
   * Crée un nouveau village pour un utilisateur.
   * @param createData DTO contenant les informations de base (name, faction).
   * @param user L'objet utilisateur ou les informations nécessaires.
   * @returns Le document Village créé.
   */
  async createVillage(
    createData: CreateVillageDto,
    user: UserInput,
  ): Promise<VillageDocument> {
    // Appelle la méthode 'create' du repository Mongoose
    // Les valeurs par défaut (resources, etc.) sont gérées par le schéma Mongoose
    return this.villageRepository.create({
      userId: user.id,
      faction: createData.faction,
      name: createData.name,
    });
  }

  /**
   * Récupère tous les villages (à utiliser avec précaution si volumineux).
   */
  async getAllVillages(): Promise<VillageDocument[]> {
    return this.villageRepository.findAll();
  }

  /**
   * Récupère un village par son ID.
   * @param id ID du village (string).
   * @throws NotFoundException si le village n'est pas trouvé.
   * @returns Le document Village trouvé.
   */
  async getVillageById(id: string): Promise<VillageDocument> {
    // Le repository Mongoose gère la conversion string -> ObjectId
    const village = await this.villageRepository.findById(id);
    if (!village) {
      // Lever une exception standard NestJS si non trouvé
      throw new NotFoundException(`Village with ID ${id} not found.`);
    }
    return village;
  }

  /**
   * Récupère tous les villages d'un utilisateur spécifique.
   * @param userId ID de l'utilisateur.
   */
  async getVillagesByUserId(userId: number): Promise<VillageDocument[]> {
    return this.villageRepository.findByUserId(userId);
  }

  /**
   * Met à jour partiellement un village.
   * @param id ID du village (string).
   * @param updateData Données partielles à mettre à jour.
   * @throws NotFoundException si le village n'est pas trouvé pour la mise à jour.
   * @returns Le document Village mis à jour.
   */
  async updateVillage(
    id: string,
    updateData: Partial<Village>,
  ): Promise<VillageDocument> {
    // Utilise la méthode 'update' du repo (qui appelle findByIdAndUpdate)
    const updatedVillage = await this.villageRepository.update(id, updateData);
    if (!updatedVillage) {
      throw new NotFoundException(
        `Village with ID ${id} not found for update.`,
      );
    }
    return updatedVillage;
  }

  /**
   * Supprime un village par son ID.
   * @param id ID du village (string).
   * @throws NotFoundException si le village n'est pas trouvé pour la suppression.
   * @returns Objet indiquant le succès de la suppression.
   */
  async deleteVillage(id: string): Promise<{ deleted: boolean; id: string }> {
    const deletedVillage = await this.villageRepository.delete(id);
    if (!deletedVillage) {
      throw new NotFoundException(
        `Village with ID ${id} not found for deletion.`,
      );
    }
    // On retourne juste une confirmation, car le document est supprimé
    return { deleted: true, id: id };
  }

  // ----- EXEMPLE d'utilisation de la méthode spécifique $pull -----
  // (À placer ici ou dans un service plus approprié comme BuildingService)

  /**
   * Retire un item spécifique de la file de construction d'un village.
   * @param villageId ID du village (string).
   * @param queueItemId ID de l'item de queue à retirer (string).
   * @throws NotFoundException si le village n'est pas trouvé.
   * @returns boolean Indique si la suppression a affecté au moins un document.
   */
  async removeConstructionQueueItem(
    villageId: string,
    queueItemId: string,
  ): Promise<boolean> {
    let villageObjectId: ObjectId;
    let itemObjectId: ObjectId;
    try {
      villageObjectId = new ObjectId(villageId);
      itemObjectId = new ObjectId(queueItemId);
    } catch {
      throw new BadRequestException(
        "Format d'ID invalide pour le village ou l'item de queue.",
      );
    }

    // Appelle la méthode spécifique du repository
    const result: UpdateWriteOpResult =
      await this.villageRepository.pullFromConstructionQueue(
        villageObjectId,
        itemObjectId,
      );

    // Vérifier si la mise à jour a modifié quelque chose
    // Note: matchedCount pourrait être 1 mais modifiedCount 0 si l'item n'était pas trouvé dans le tableau
    if (result.matchedCount === 0) {
      throw new NotFoundException(
        `Village with ID ${villageId} not found for queue item removal.`,
      );
    }
    return result.modifiedCount > 0;
  }
}
