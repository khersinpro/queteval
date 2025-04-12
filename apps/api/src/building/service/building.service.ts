import {
  BadRequestException,
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

const MAX_CONSTRUCTION_SLOTS = 3;

@Injectable()
export class BuildingService {
  private readonly logger = new Logger(BuildingService.name);
  constructor(
    private readonly villageRepository: VillageRepository,
    private readonly villageService: VillageService,
    private readonly buildingConfigService: BuildingConfigService,
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

  // async startConstruction(
  //   villageId: string,
  //   buildingName: string,
  // ): Promise<Village> {
  //   this.logger.log(
  //     `[Village: ${villageId}] Tentative construction: ${buildingName}`,
  //   );

  //   const village = await this.villageRepository.findById(villageId);

  //   if (!village)
  //     throw new NotFoundException(`Village ${villageId} non trouvé.`);

  //   // Logique de vérification métier inchangée
  //   if (village.constructionQueue.length >= MAX_CONSTRUCTION_SLOTS) {
  //     throw new BadRequestException(
  //       `Limite de ${MAX_CONSTRUCTION_SLOTS} constructions atteinte.`,
  //     );
  //   }

  //   const buildingConfig =
  //     this.buildingConfigService.getBuildingConfig(buildingName);
  //   if (!buildingConfig)
  //     throw new NotFoundException(`Config pour '${buildingName}' introuvable.`);

  //   const targetLevel = 1;
  //   const levelConfig = this.buildingConfigService.getBuildingLevelConfig(
  //     buildingName,
  //     targetLevel,
  //   );

  //   if (!this.hasSufficientResources(village, levelConfig.cost)) {
  //     throw new BadRequestException('Ressources insuffisantes.');
  //   }

  //   // Logique de temps inchangée
  //   const startTime = new Date();
  //   const endTime = new Date(
  //     startTime.getTime() + levelConfig.upgrade_time * 1000,
  //   );

  //   // Utiliser les classes TypeORM
  //   const newBuilding = new Building(); // Constructeur initialise l'_id
  //   newBuilding.name = buildingName;
  //   newBuilding.type = buildingConfig.type;
  //   newBuilding.level = 0; // Le bâtiment commence niveau 0, sera niveau 1 à la fin

  //   const newBuildingInstanceId = newBuilding._id; // Récupérer l'ID généré

  //   let savedEvent: GameEvent | null = null;
  //   let addedQueueItemData: ConstructionQueueItem | null = null;

  //   try {
  //     // Appliquer les changements sur l'objet village
  //     this.deductResources(village, levelConfig.cost);
  //     village.buildings.push(newBuilding); // Ajouter le nouveau bâtiment

  //     // Créer et sauvegarder l'événement associé via son repository
  //     const eventData = this.gameEventRepository.createInstance({
  //       // Utiliser le repo GameEvent
  //       eventType: GameEventType.BUILDING_COMPLETE, // Assurez-vous que l'enum est correct
  //       status: GameEventStatus.SCHEDULED,
  //       originVillageId: village._id, // Utiliser l'ObjectId
  //       startTime: startTime,
  //       endTime: endTime,
  //       // Spécifique à l'event de construction/upgrade si défini dans GameEvent ou ses enfants
  //       buildingInstanceId: newBuildingInstanceId,
  //       targetLevel: targetLevel,
  //     });
  //     savedEvent = await this.gameEventRepository.save(eventData);

  //     const gameEventId = savedEvent._id; // Récupérer l'ObjectId de l'event sauvegardé

  //     // Créer l'item de queue (utiliser le constructeur TypeORM)
  //     addedQueueItemData = new ConstructionQueueItem(); // Le constructeur initialise l'_id
  //     addedQueueItemData.buildingInstanceId = newBuildingInstanceId;
  //     addedQueueItemData.buildingName = buildingName;
  //     addedQueueItemData.targetLevel = targetLevel;
  //     addedQueueItemData.startTime = startTime;
  //     addedQueueItemData.endTime = endTime;
  //     addedQueueItemData.gameEventId = gameEventId; // Assigner l'ID de l'event sauvegardé

  //     village.constructionQueue.push(addedQueueItemData);

  //     // Sauvegarder l'entité Village racine avec TOUS les changements (ressources, buildings, queue)
  //     await this.villageRepository.save(village); // Appel save sur le repository
  //     this.logger.log(
  //       `[Village: ${villageId}] Construction ${buildingName} Lvl ${targetLevel} ajoutée à la queue. Event: ${gameEventId.toString()}`,
  //     );
  //   } catch (error) {
  //     this.logger.error(
  //       `[Village: ${villageId}] Erreur BDD startConstruction: ${error instanceof Error ? error.message : String(error)}`,
  //       error instanceof Error ? error.stack : undefined,
  //     );
  //     // Ici, l'état peut être incohérent si l'event a été créé mais le village non sauvegardé.
  //     // Une transaction serait idéale pour garantir l'atomicité.
  //     throw new InternalServerErrorException(
  //       'Erreur serveur lors de la mise à jour du village.',
  //     );
  //   }

  //   // Planifier la tâche BullMQ (opération externe)
  //   const queueItemToSchedule = addedQueueItemData; // Utiliser l'objet créé
  //   const jobId = await this.scheduleCompletionJob(
  //     village._id.toString(), // ID du village en string
  //     queueItemToSchedule,
  //   );

  //   // Mettre à jour le jobId dans l'item de queue (opération BDD séparée)
  //   if (jobId) {
  //     try {
  //       // Utiliser updateOne du MongoRepository (nécessite typeorm >= 0.3 et mongodb driver >= 4)
  //       // ou une méthode custom dans votre VillageRepository qui fait cela.
  //       await this.villageRepository.updateOne(
  //         {
  //           // Filtre pour trouver le village ET l'item spécifique dans le tableau
  //           _id: village._id,
  //           'constructionQueue._id': queueItemToSchedule._id,
  //         },
  //         {
  //           // Opérateur $set pour modifier le champ jobId de l'élément trouvé
  //           $set: { 'constructionQueue.$.jobId': jobId },
  //         },
  //       );
  //       this.logger.log(
  //         `[Village: ${villageId}] JobId ${jobId} enregistré pour item ${queueItemToSchedule._id.toString()}`,
  //       );
  //     } catch (updateError) {
  //       this.logger.error(
  //         `[Village: ${villageId}] Erreur MAJ jobId ${jobId} pour item ${queueItemToSchedule._id.toString()}: ${updateError}`,
  //       );
  //       // Gérer l'erreur (ex: tenter de replanifier ?)
  //     }
  //   }

  //   // Retourner le village potentiellement mis à jour (avec le jobId)
  //   // findById gère la non-existence
  //   return (await this.villageRepository.findById(villageId)) ?? village; // Retourne la version fraîche ou celle en mémoire
  // }
}
