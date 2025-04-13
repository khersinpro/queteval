import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
// Importer les dépendances Mongoose/NestJS
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose'; // Importer Connection Mongoose
// Importer les repositories/services adaptés à Mongoose
import { VillageRepository } from '../../village/repository/village.repository';
// import { VillageService } from '../../village/service/village.service'; // <- À évaluer si encore utile
import { BuildingConfigService } from '../../game-config/service/building-config.service';
import {
  Village,
  VillageDocument,
} from '../../village/document/village.schema'; // Doc Mongoose
import { ConstructionQueueItem } from '../../village/document/embedded/construction-queue-item.schema'; // Schéma Mongoose
import {
  BUILDING_JOB_PUBLISHER,
  IJobPublisher,
} from '@app/game-job-publisher/interface/job-publisher.interface';
import {
  BuildingJob,
  BuildingJobDocument,
} from '@app/game-job-publisher/document/building-job.schema'; // Doc Mongoose
import { GAME_JOB_STATUS } from '@app/game-job-publisher/constant/game-job-status.enum';
import { GAME_JOB_TYPES } from '@app/game-job-publisher/constant/game-job-types.enum';
import { BuildingJobService } from '@app/game-job-publisher/service/building-job.service'; // Service Mongoose
import { ObjectId } from 'mongodb';
import { Type } from 'class-transformer';

const MAX_CONSTRUCTION_SLOTS = 3;

interface StartConstructionTransactionResult {
  savedBuildingJob: BuildingJobDocument;
  addedQueueItem: ConstructionQueueItem; // L'instance ajoutée (avec son ID)
  villageId: ObjectId; // Pour référence post-transaction
  // Pas besoin de retourner villageSavedState si on re-fetch à la fin
}

@Injectable()
export class BuildingService {
  private readonly logger = new Logger(BuildingService.name);
  constructor(
    // Injecter les repositories/services adaptés à Mongoose
    private readonly villageRepository: VillageRepository,
    // private readonly villageService: VillageService, // Evaluer si nécessaire
    private readonly buildingConfigService: BuildingConfigService,
    @Inject(BUILDING_JOB_PUBLISHER)
    private readonly buildingJobPublisher: IJobPublisher,
    private readonly buildingJobService: BuildingJobService, // S'assurer qu'il utilise Mongoose
    @InjectConnection() private readonly connection: Connection, // Injecter la connexion Mongoose
  ) {}

  private hasSufficientResources(
    village: Village,
    cost: { wood: number; clay: number; iron: number; crop: number },
  ): boolean {
    return (
      village.resources.wood.current >= cost.wood &&
      village.resources.clay.current >= cost.clay &&
      village.resources.iron.current >= cost.iron &&
      village.resources.crop.current >= cost.crop
    );
  }

  private deductResources(
    village: Village,
    cost: { wood: number; clay: number; iron: number; crop: number },
  ): void {
    village.resources.wood.current -= cost.wood;
    village.resources.clay.current -= cost.clay;
    village.resources.iron.current -= cost.iron;
    village.resources.crop.current -= cost.crop;
  }

  async startConstruction(
    villageId: string,
    buildingName: string,
  ): Promise<VillageDocument> {
    // Retourne un Document Mongoose
    this.logger.log(
      `[Village: ${villageId}] Tentative construction: ${buildingName}`,
    );

    // --- Vérifications initiales (hors transaction) ---
    const initialVillage = await this.villageRepository.findById(villageId);
    if (!initialVillage)
      throw new NotFoundException(`Village ${villageId} non trouvé.`);
    if (initialVillage.constructionQueue.length >= MAX_CONSTRUCTION_SLOTS)
      throw new BadRequestException(/* ... */);
    const buildingConfig =
      this.buildingConfigService.getBuildingConfig(buildingName);
    if (!buildingConfig) throw new NotFoundException(/* ... */);
    const targetLevel = 1;
    const levelConfig = this.buildingConfigService.getBuildingLevelConfig(
      buildingName,
      targetLevel,
    );
    if (!this.hasSufficientResources(initialVillage, levelConfig.cost))
      throw new BadRequestException(/* ... */);

    const startTime = new Date();
    const endTime = new Date(
      startTime.getTime() + levelConfig.upgrade_time * 1000,
    );

    // --- Transaction Mongoose ---
    const session = await this.connection.startSession(); // Démarrer une session
    let txResult: StartConstructionTransactionResult | null = null;
    try {
      txResult =
        await session.withTransaction<StartConstructionTransactionResult>(
          async (sess) => {
            // --- Début du callback ---
            console.log('Session started');
            // 1. Créer BuildingJob
            const buildingJobData: Partial<BuildingJob> = {
              buildingInstanceId: new Types.ObjectId(),
              originVillageId: initialVillage._id,
              targetLevel: 1, // targetLevel = 1 pour nouvelle construction
              startTime: startTime,
              endTime: endTime,
              status: GAME_JOB_STATUS.SCHEDULED,
              JobType: GAME_JOB_TYPES.BUILDING_JOB,
            };
            console.log('BuildingJob created');
            // Utiliser une variable locale pour le job sauvegardé
            const savedJob = await this.buildingJobService.create(
              buildingJobData,
              { session: sess },
            );
            console.log('BuildingJob saved');
            const newBuildingInstanceId = savedJob.buildingInstanceId;
            console.log('BuildingJob saved');
            // 2. Préparer embedded docs
            const newBuildingData = {
              // Utiliser objet simple pour $push
              _id: newBuildingInstanceId,
              name: buildingName,
              type: buildingConfig.type,
              level: 0,
            };

            const queueItem = new ConstructionQueueItem(); // Le constructeur initialise _id
            queueItem._id = new Types.ObjectId();
            queueItem.buildingInstanceId = newBuildingInstanceId;
            queueItem.buildingName = buildingName;
            queueItem.targetLevel = 1; // targetLevel = 1
            queueItem.startTime = startTime;
            queueItem.endTime = endTime;
            queueItem.buildingJobId = savedJob._id;
            // queuedAt est géré par le schéma

            // 3. Update Village atomique
            const villageUpdateResult = await this.villageRepository.updateOne(
              { _id: initialVillage._id },
              {
                $inc: {
                  'resources.wood.current': -levelConfig.cost.wood,
                  'resources.clay.current': -levelConfig.cost.clay,
                  'resources.iron.current': -levelConfig.cost.iron,
                  'resources.crop.current': -levelConfig.cost.crop,
                },
                $push: {
                  buildings: newBuildingData, // Passer l'objet simple
                  constructionQueue: queueItem, // Passer l'instance (Mongoose l'extrait)
                },
              },
              { session: sess }, // Utiliser les options de la méthode updateOne du repo
            );

            if (villageUpdateResult.matchedCount === 0)
              throw new NotFoundException(/*...*/);
            if (villageUpdateResult.modifiedCount === 0)
              throw new InternalServerErrorException(/*...*/);

            this.logger.log(
              `[Village: ${villageId}] Opérations BDD transactionnelles réussies.`,
            );

            // 4. RETOURNER les données nécessaires
            return {
              savedBuildingJob: savedJob,
              addedQueueItem: queueItem, // Retourner l'instance avec son ID généré
              villageId: initialVillage._id,
            };
            // --- Fin du callback ---
          },
        ); // Fin de withTransaction
    } catch (error) {
      this.logger.error(
        `[Village: ${villageId}] Transaction startConstruction échouée: ${error}`,
        error,
      );
      // Pas besoin de abortTransaction avec withTransaction
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException(
        'Erreur serveur pendant la transaction BDD.',
      );
    } finally {
      await session.endSession(); // Toujours terminer la session
    }
    // --- Suite des opérations ---
    // Vérifier txResult (il ne sera null que si une erreur est survenue AVANT l'appel à withTransaction ou si withTransaction retourne null)
    if (!txResult) {
      this.logger.error(
        `[Village: ${villageId}] Résultat de transaction manquant après try/catch.`,
      );
      throw new InternalServerErrorException(
        'État incohérent après la transaction (résultat manquant).',
      );
    }

    // Les types sont maintenant corrects ! Pas besoin d'assertions 'as Type'.

    console.log({txResult});
    const { savedBuildingJob, addedQueueItem } = txResult;
    const buildingJobId = savedBuildingJob._id.toString();
    const queueItemId = addedQueueItem._id; // Utiliser l'ID de l'objet retourné

    // 2. Planifier le job BullMQ
    let jobId: string | undefined;
    try {
      jobId = await this.buildingJobPublisher.scheduleJob({
        job_type: GAME_JOB_TYPES.BUILDING_JOB,
        payload: { database_job_id: buildingJobId },
        options: {
          delay: Math.max(0, endTime.getTime() - Date.now()),
          removeOnComplete: true,
          removeOnFail: { age: 24 * 3600 },
        },
      });

      console.log({jobId});
    } catch (scheduleError) {
      this.logger.error(
        `[Village: ${villageId}] Échec planification job ${buildingJobId}: ${scheduleError}`,
      );
      // COMPENSATION
      await this.buildingJobService.update(buildingJobId, {
        status: GAME_JOB_STATUS.FAILED,
      });
      await this.villageRepository.pullFromConstructionQueue(
        txResult.villageId,
        queueItemId,
      );
      // ... autres compensations ...
      throw new InternalServerErrorException(
        'La construction a été enregistrée mais sa planification a échoué.',
      );
    }

    // 3. Mettre à jour les jobIds (best effort)
    if (jobId) {
      try {
        const village_Id_For_Update = txResult.villageId; // Utiliser l'ID retourné
        const updateVillageResult = await this.villageRepository.updateOne(
          { _id: village_Id_For_Update, 'constructionQueue._id': queueItemId },
          { $set: { 'constructionQueue.$.jobId': jobId } },
        );
        const updateJobResult = await this.buildingJobService.update(
          buildingJobId,
          { queuedJobId: jobId },
        );

        if (updateVillageResult.modifiedCount > 0 && updateJobResult) {
          this.logger.log(
            `[Village: ${villageId}] JobId ${jobId} enregistré pour item ${queueItemId.toString()} et job ${buildingJobId}`,
          );
        } else {
          this.logger.warn(
            `[Village: ${villageId}] JobId ${jobId} non enregistré pour item ${queueItemId.toString()} et job ${buildingJobId}.`,
          );
        }
      } catch (updateError) {
        this.logger.error(
          `[Village: ${villageId}] Erreur lors de l'enregistrement du jobId ${jobId} pour item ${queueItemId.toString()} et job ${buildingJobId}: ${updateError}`,
        );
      }
    }

    // 4. Retourner l'état final (re-fetch est plus sûr)
    const finalVillage = await this.villageRepository.findById(villageId);
    if (!finalVillage) {
      throw new InternalServerErrorException(
        "Incohérence: Village disparu après l'opération.",
      );
    }
    return finalVillage;
  }
}
