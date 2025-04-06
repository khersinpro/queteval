import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Village, VillageDocument } from 'src/village/schema/village.schema';
import { BuildingConfigService } from 'src/game-config/service/building-config.service';
import {
  IJobScheduler,
  JOB_SCHEDULER,
} from '../../game-event/interface/job-scheduler.interface';
import {
  GameEvent,
  GameEventDocument,
} from 'src/game-event/schema/game-event.schema';
import { ConstructionQueueItem } from 'src/village/schema/construction-queue.schema';
import { GameEventType } from 'src/game-event/types/event.enum';
import { Building } from 'src/village/schema/building.schema';
import { GameEventStatus } from 'src/game-event/types/game-event-status.enum';
import {
  ResourceLevelConfig,
  StorageLevelConfig,
} from 'src/game-config/types/base-building-config';

const MAX_CONSTRUCTION_SLOTS = 3;

@Injectable()
export class BuildingService {
  private readonly logger = new Logger(BuildingService.name);

  constructor(
    @InjectModel(Village.name) private villageModel: Model<VillageDocument>,
    @InjectModel(GameEvent.name)
    private gameEventModel: Model<GameEventDocument>,
    @Inject(JOB_SCHEDULER) private jobScheduler: IJobScheduler,
    @Inject(forwardRef(() => BuildingConfigService))
    private buildingConfigService: BuildingConfigService,
  ) {}

  private hasSufficientResources(
    village: VillageDocument,
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
    village: VillageDocument,
    cost: { wood: number; clay: number; iron: number; crop: number },
  ): void {
    village.resources.wood.current -= cost.wood;
    village.resources.clay.current -= cost.clay;
    village.resources.iron.current -= cost.iron;
    village.resources.crop.current -= cost.crop;
    // Marquer comme modifié si on n'utilise pas directement save() sur le document racine après
    village.markModified('resources');
  }

  // --- scheduleCompletionJob (inchangé) ---
  private async scheduleCompletionJob(
    villageId: string,
    queueItem: ConstructionQueueItem,
  ): Promise<string | undefined> {
    const delay = queueItem.endTime.getTime() - Date.now();
    const jobId = `building-${villageId}-${queueItem.buildingInstanceId.toString()}-${queueItem.targetLevel}`;

    await this.jobScheduler.scheduleJob(
      GameEventType.BUILDING_COMPLETE,
      {
        villageId: villageId,
        buildingInstanceId: queueItem.buildingInstanceId.toString(),
        targetLevel: queueItem.targetLevel,
        gameEventId: queueItem.gameEventId.toString(),
      },
      {
        delay: delay > 0 ? delay : 0,
        jobId: jobId,
        removeOnComplete: true,
        removeOnFail: { age: 24 * 3600 },
      },
    );
    return jobId;
  }

  // --- Méthodes Principales (SANS sessions/transactions) ---

  async startConstruction(
    villageId: string,
    buildingName: string,
  ): Promise<VillageDocument> {
    this.logger.log(
      `[Village: ${villageId}] Tentative construction: ${buildingName}`,
    );
    const village = await this.villageModel.findById(villageId).exec();

    if (!village)
      throw new NotFoundException(`Village ${villageId} non trouvé.`);

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

    const startTime = new Date();
    const endTime = new Date(
      startTime.getTime() + levelConfig.upgrade_time * 1000,
    );

    const newBuildingInstanceId = new Types.ObjectId();
    let savedEvent: GameEventDocument | null = null;
    let addedQueueItemData: ConstructionQueueItem | null = null;

    try {
      this.deductResources(village, levelConfig.cost);

      const newBuilding = new Building();
      newBuilding._id = newBuildingInstanceId;
      newBuilding.name = buildingName;
      newBuilding.type = buildingConfig.type;
      newBuilding.level = 0;

      village.buildings.push(newBuilding);
      village.markModified('buildings');

      savedEvent = await this.gameEventModel.create({
        eventType: GameEventType.BUILDING_COMPLETE,
        status: GameEventStatus.SCHEDULED,
        originVillageId: village._id.toString(),
        startTime: startTime,
        endTime: endTime,
        buildingInstanceId: newBuildingInstanceId,
        targetLevel: targetLevel,
      });

      const gameEventId = savedEvent._id;

      addedQueueItemData = new ConstructionQueueItem();
      addedQueueItemData._id = gameEventId;
      addedQueueItemData.buildingInstanceId = newBuildingInstanceId;
      addedQueueItemData.buildingName = buildingName;
      addedQueueItemData.targetLevel = targetLevel;
      addedQueueItemData.startTime = startTime;
      addedQueueItemData.endTime = endTime;
      addedQueueItemData.gameEventId = gameEventId;

      village.constructionQueue.push(addedQueueItemData);
      village.markModified('constructionQueue');

      // Sauvegarder le village avec TOUS les changements d'un coup
      await village.save();
      this.logger.log(
        `[Village: ${villageId}] Construction ${buildingName} Lvl ${targetLevel} ajoutée.`,
      );
    } catch (error) {
      // Erreur pendant les opérations BDD
      this.logger.error(
        `[Village: ${villageId}] Erreur BDD startConstruction: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Note: L'état peut être incohérent ici (ex: event créé mais village non sauvegardé)
      throw new InternalServerErrorException(
        'Erreur serveur lors de la mise à jour du village.',
      );
    }

    // Planifier la tâche (opération externe à la BDD)

    // Utiliser les données qu'on avait préparées
    const queueItemToSchedule = addedQueueItemData;
    const jobId = await this.scheduleCompletionJob(
      village._id.toString(),
      queueItemToSchedule,
    );
    // Mettre à jour le jobId dans l'item de queue (opération BDD séparée)
    if (jobId) {
      await this.villageModel
        .updateOne(
          {
            _id: village._id,
            'constructionQueue._id': queueItemToSchedule._id,
          },
          { $set: { 'constructionQueue.$.jobId': jobId } },
        )
        .exec();
    }

    // A modifier
    return this.villageModel
      .findById(villageId)
      .exec()
      .then((village) => {
        if (!village) {
          throw new NotFoundException(`Village ${villageId} non trouvé.`);
        }
        return village;
      });
  }

  async startUpgrade(
    villageId: string,
    buildingInstanceId: string,
  ): Promise<Village> {
    this.logger.log(
      `[Village: ${villageId}] Tentative amélioration: ${buildingInstanceId}`,
    );
    const village = await this.villageModel.findById(villageId).exec();
    if (!village)
      throw new NotFoundException(`Village ${villageId} non trouvé.`);

    if (village.constructionQueue.length >= MAX_CONSTRUCTION_SLOTS) {
      throw new BadRequestException(
        `Limite de construction (${MAX_CONSTRUCTION_SLOTS}) atteinte.`,
      );
    }
    const building = village.buildings.find(
      (b) => b._id.toString() === buildingInstanceId,
    );

    if (!building)
      throw new NotFoundException(`Bâtiment ${buildingInstanceId} non trouvé.`);
    if (
      village.constructionQueue.some((item) =>
        item.buildingInstanceId.equals(building._id),
      )
    ) {
      throw new BadRequestException(
        'Une amélioration est en cours pour ce bâtiment.',
      );
    }

    const currentLevel = building.level;
    const targetLevel = currentLevel + 1;
    let levelConfig: ResourceLevelConfig | StorageLevelConfig | null = null;
    try {
      levelConfig = this.buildingConfigService.getBuildingLevelConfig(
        building.name,
        targetLevel,
      );
    } catch (error) {
      console.error(error);
      throw new BadRequestException(
        `Niveau ${targetLevel} introuvable pour ${building.name}`,
      );
    }

    if (!this.hasSufficientResources(village, levelConfig.cost))
      throw new BadRequestException('Ressources insuffisantes.');

    const startTime = new Date();
    const endTime = new Date(
      startTime.getTime() + levelConfig.upgrade_time * 1000,
    );

    let savedEvent: GameEventDocument | null = null;
    let addedQueueItemData: any = null;

    try {
      // Préparer les changements
      this.deductResources(village, levelConfig.cost);

      // Créer l'event persistant
      savedEvent = await this.gameEventModel.create({
        eventType: GameEventType.BUILDING_COMPLETE,
        status: GameEventStatus.SCHEDULED,
        originVillageId: village._id,
        startTime: startTime,
        endTime: endTime,
        buildingInstanceId: building._id,
        targetLevel: targetLevel,
      });

      // Créer l'item de queue
      addedQueueItemData = {
        _id: new Types.ObjectId(),
        buildingInstanceId: building._id,
        buildingName: building.name,
        targetLevel: targetLevel,
        startTime: startTime,
        endTime: endTime,
        gameEventId: savedEvent._id,
      };

      village.constructionQueue.push(
        addedQueueItemData as ConstructionQueueItem,
      );

      village.markModified('constructionQueue');

      await village.save();
      this.logger.log(
        `[Village: ${villageId}] Amélioration ${building.name} Lvl ${targetLevel} ajoutée. Event: ${savedEvent._id.toString()}`,
      );
    } catch (error) {
      this.logger.error(
        `[Village: ${villageId}] Erreur BDD startUpgrade: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Erreur serveur lors de la mise à jour du village.',
      );
    }

    // Planifier la tâche
    const queueItemToSchedule = addedQueueItemData as ConstructionQueueItem;

    const jobId = await this.scheduleCompletionJob(
      village._id.toString(),
      queueItemToSchedule,
    );
    if (jobId) {
      await this.villageModel
        .updateOne(
          {
            _id: village._id,
            'constructionQueue._id': queueItemToSchedule._id,
          },
          { $set: { 'constructionQueue.$.jobId': jobId } },
        )
        .exec();
    }

    return this.villageModel
      .findById(village._id)
      .exec()
      .then((village) => {
        if (!village)
          throw new NotFoundException(`Village ${villageId} non trouvé.`);
        return village;
      });
  }

  // TODO: cancelBuildingTask(...) reste à implémenter
}
