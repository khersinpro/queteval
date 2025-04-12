import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Document,
  MongoRepository,
  ObjectLiteral,
  UpdateFilter,
  UpdateOptions,
  UpdateResult,
} from 'typeorm';
import { ObjectId } from 'mongodb';
import { Village } from '../document/village.document';
import { DeepPartial } from 'typeorm';

@Injectable()
export class VillageRepository {
  constructor(
    @InjectRepository(Village, 'mongodb')
    private readonly villageRepository: MongoRepository<Village>,
  ) {}

  /**
   * Crée une instance de Village (sans sauvegarder)
   * Utile pour appliquer des logiques avant sauvegarde.
   */
  createInstance(data: DeepPartial<Village>): Village {
    return this.villageRepository.create(data);
  }

  /**
   * Sauvegarde une instance de Village (nouvelle ou existante)
   */
  async save(village: Village): Promise<Village> {
    return this.villageRepository.save(village);
  }

  /**
   * Crée et sauvegarde un nouveau village directement.
   */
  async createAndSave(data: DeepPartial<Village>): Promise<Village> {
    const villageInstance = this.createInstance(data);

    return this.villageRepository.save(villageInstance);
  }

  async findAll(): Promise<Village[]> {
    return this.villageRepository.find();
  }

  async findById(id: string): Promise<Village | null> {
    try {
      const objectId = new ObjectId(id);

      return await this.villageRepository.findOneBy({ _id: objectId });
    } catch (error) {
      console.error(`Error finding village by ID ${id}:`, error);
      return null;
    }
  }

  async update(
    id: string,
    patch: DeepPartial<Village>,
  ): Promise<Village | null> {
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      console.error(`Invalid ID format for update ${id}:`, error);
      return null;
    }

    const updateResult = await this.villageRepository.update(
      { _id: objectId },
      patch,
    );

    if (updateResult.affected === 0) {
      return null;
    }

    return await this.villageRepository.findOneBy({ _id: objectId });
  }

  async delete(id: string): Promise<Village | null> {
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      console.error(`Invalid ID format for delete ${id}:`, error);
      return null;
    }

    const villageToDelete = await this.villageRepository.findOneBy({
      _id: objectId,
    });

    if (!villageToDelete) {
      return null;
    }

    const deleteResult = await this.villageRepository.delete({ _id: objectId });

    if (deleteResult.affected === 0) {
      console.error(`Failed to delete village ${id} after finding it.`);
      return null;
    }

    return villageToDelete;
  }

  async findByUserId(userId: number): Promise<Village[]> {
    return this.villageRepository.find({ where: { userId: userId } });
  }

  /**
   * Exécute une opération updateOne native de MongoDB via le repository injecté.
   * @param filter Le filtre pour trouver le(s) document(s) à mettre à jour.
   * @param update L'opération de mise à jour (ex: { $set: { ... } }).
   * @param options Options natives du driver MongoDB (optionnel).
   * @returns Promise<UpdateResult> Le résultat de l'opération du driver MongoDB.
   */
  async updateOne(
    filter: ObjectLiteral,
    update: UpdateFilter<Document>,
    options?: UpdateOptions,
  ): Promise<Document | UpdateResult> {
    return await this.villageRepository.updateOne(filter, update, options);
  }
}
