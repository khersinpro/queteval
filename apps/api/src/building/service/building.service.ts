import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { VillageRepository } from '../../village/repository/village.repository';
import { VillageService } from '../../village/service/village.service';
import { BuildingConfigService } from '../../game-config/service/building-config.service';
import { Village } from '../../village/document/village.document';
import { Building } from '../../village/document/embbeded/building.document';
import { ConstructionQueueItem } from '../../village/document/embbeded/construction-queue.document';
import {
  BUILDING_JOB_PUBLISHER,
  IJobPublisher,
} from '@app/game-job-publisher/interface/job-publisher.interface';
import { BuildingJob } from '@app/game-job-publisher/document/building-job.document';
import { GAME_JOB_STATUS } from '@app/game-job-publisher/constant/game-job-status.enum';
import { GAME_JOB_TYPES } from '@app/game-job-publisher/constant/game-job-types.enum';
import { BuildingJobService } from '@app/game-job-publisher/service/building-job.service';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

const MAX_CONSTRUCTION_SLOTS = 3;

@Injectable()
export class BuildingService {
  private readonly logger = new Logger(BuildingService.name);
  constructor(
    private readonly villageRepository: VillageRepository,
    private readonly villageService: VillageService,
    private readonly buildingConfigService: BuildingConfigService,
    @Inject(BUILDING_JOB_PUBLISHER)
    private readonly buildingJobPublisher: IJobPublisher,
    private buildingJobService: BuildingJobService,
    @InjectDataSource('mongodb')
    private readonly dataSource: DataSource,
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
  ): Promise<Village> {
    this.logger.log(
      `[Village: ${villageId}] Tentative construction: ${buildingName}`,
    );

    const village = await this.villageRepository.findById(villageId);

    if (!village)
      throw new NotFoundException(`Village ${villageId} non trouvé.`);

    // Logique de vérification métier inchangée
    if (village.constructionQueue.length >= MAX_CONSTRUCTION_SLOTS) {
      throw new BadRequestException(
        `Limite de ${MAX_CONSTRUCTION_SLOTS} constructions atteinte.`,
      );
    }

    const buildingConfig =
      this.buildingConfigService.getBuildingConfig(buildingName);

    if (!buildingConfig)
      throw new NotFoundException(`Config pour '${buildingName}' introuvable.`);

    const targetLevel = 1;
    const levelConfig = this.buildingConfigService.getBuildingLevelConfig(
      buildingName,
      targetLevel,
    );

    if (!this.hasSufficientResources(village, levelConfig.cost)) {
      throw new BadRequestException('Ressources insuffisantes.');
    }

    // Logique de temps inchangée
    const startTime = new Date();
    const endTime = new Date(
      startTime.getTime() + levelConfig.upgrade_time * 1000,
    );

    const newBuilding = new Building();
    newBuilding.name = buildingName;
    newBuilding.type = buildingConfig.type;
    newBuilding.level = 0;

    const newBuildingInstanceId = newBuilding._id; // Récupérer l'ID généré

    let buildingJob: BuildingJob | null = null;
    let addedQueueItemData: ConstructionQueueItem | null = null;

    try {
      // Appliquer les changements sur l'objet village
      this.deductResources(village, levelConfig.cost);
      village.buildings.push(newBuilding); // Ajouter le nouveau bâtiment

      // // Créer et sauvegarder l'événement associé via son repository
      // const eventData = this.gameEventRepository.createInstance({
      //   // Utiliser le repo GameEvent
      //   eventType: GameEventType.BUILDING_COMPLETE, // Assurez-vous que l'enum est correct
      //   status: GameEventStatus.SCHEDULED,
      //   originVillageId: village._id, // Utiliser l'ObjectId
      //   startTime: startTime,
      //   endTime: endTime,
      //   // Spécifique à l'event de construction/upgrade si défini dans GameEvent ou ses enfants
      //   buildingInstanceId: newBuildingInstanceId,
      //   targetLevel: targetLevel,
      // });
      // savedEvent = await this.gameEventRepository.save(eventData);

      // const gameEventId = savedEvent._id; // Récupérer l'ObjectId de l'event sauvegardé

      // Création du job de construction
      buildingJob = new BuildingJob();
      buildingJob.buildingInstanceId = newBuildingInstanceId;
      buildingJob.originVillageId = village._id;
      buildingJob.targetLevel = targetLevel;
      buildingJob.startTime = startTime;
      buildingJob.endTime = endTime;
      buildingJob.status = GAME_JOB_STATUS.SCHEDULED;

      await this.buildingJobService.save(buildingJob);

      // Créer l'item de queue (utiliser le constructeur TypeORM)
      addedQueueItemData = new ConstructionQueueItem(); // Le constructeur initialise l'_id
      addedQueueItemData.buildingInstanceId = newBuildingInstanceId;
      addedQueueItemData.buildingName = buildingName;
      addedQueueItemData.targetLevel = targetLevel;
      addedQueueItemData.startTime = startTime;
      addedQueueItemData.endTime = endTime;
      addedQueueItemData.buildingJobId = buildingJob._id; // Assigner l'ID de l'event sauvegardé

      village.constructionQueue.push(addedQueueItemData);

      // Sauvegarder l'entité Village racine avec TOUS les changements (ressources, buildings, queue)
      await this.villageRepository.save(village); // Appel save sur le repository
      this.logger.log(
        `[Village: ${villageId}] Construction ${buildingName} Lvl ${targetLevel} ajoutée à la queue. Event: ${gameEventId.toString()}`,
      );
    } catch (error) {
      this.logger.error(
        `[Village: ${villageId}] Erreur BDD startConstruction: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Ici, l'état peut être incohérent si l'event a été créé mais le village non sauvegardé.
      // Une transaction serait idéale pour garantir l'atomicité.
      throw new InternalServerErrorException(
        'Erreur serveur lors de la mise à jour du village.',
      );
    }

    const jobId = await this.buildingJobPublisher.scheduleJob({
      job_type: GAME_JOB_TYPES.BUILDING_JOB,
      payload: {
        database_job_id: buildingJob._id.toString(),
      },
      options: {
        delay: endTime.getTime() - Date.now(),
        removeOnComplete: true,
        removeOnFail: { age: 24 * 3600 },
      },
    });

    if (jobId) {
      // Assurez-vous que l'item de queue et son ID existent avant de continuer
      if (!addedQueueItemData || !addedQueueItemData._id) {
        this.logger.error(
          `[Village: ${villageId}] Impossible de mettre à jour jobId: addedQueueItemData ou son _id est manquant.`,
        );
        // Vous pourriez vouloir lever une erreur ici ou gérer ce cas autrement
      } else {
        const queueItemId = addedQueueItemData._id; // Récupérer le vrai ObjectId

        try {
          const updateResult = await this.villageRepository.updateOne(
            {
              _id: village._id,
              'constructionQueue._id': queueItemId,
            },
            {
              $set: { 'constructionQueue.$.jobId': jobId },
            },
          );

          await this.buildingJobService.update(buildingJob._id.toString(), {
            queuedJobId: jobId,
          });

          // Vérifier le résultat de la mise à jour (optionnel mais utile pour le debug)
          if (updateResult.affected === 0) {
            // Si rien ne correspond au filtre (village ou item non trouvé)
            this.logger.warn(
              `[Village: ${villageId}] Aucun village/item trouvé pour la mise à jour du jobId pour l'item ${queueItemId.toString()}`,
            );
          } else {
            // Succès
            this.logger.log(
              `[Village: ${villageId}] JobId ${jobId} enregistré pour item ${queueItemId.toString()}`,
            );
          }
        } catch (updateError) {
          this.logger.error(
            `[Village: ${villageId}] Erreur MAJ jobId ${jobId} pour item ${queueItemId.toString()}: ${updateError instanceof Error ? updateError.message : updateError}`,
            updateError instanceof Error ? updateError.stack : undefined,
          );
          // Gérer l'erreur de manière appropriée
          // Faut-il annuler le job BullMQ ici ?
        }
      }
    }

    // Retourner une version fraîche du village depuis la BDD est plus sûr
    // car l'objet 'village' en mémoire peut ne pas refléter la mise à jour du jobId
    // si on ne l'a pas mis à jour manuellement après l'appel à updateOne.
    const freshVillage = await this.villageRepository.findById(villageId);
    if (!freshVillage) {
      this.logger.error(
        `[Village: ${villageId}] Village non trouvé après tentative de MAJ du jobId.`,
      );
      // Retourner l'état précédent ou lever une erreur ? Ici on retourne l'état en mémoire (potentiellement sans jobId)
      return village;
    }
    return freshVillage;
  }
}
