// import {
//     BadRequestException,
//     forwardRef,
//     Inject,
//     Injectable,
//     InternalServerErrorException,
//     Logger,
//     NotFoundException,
//   } from '@nestjs/common';
//   // Imports TypeORM et MongoDB
//   import { InjectRepository } from '@nestjs/typeorm';
//   import { MongoRepository } from 'typeorm';
//   import { ObjectId } from 'mongodb';
//   // Entités TypeORM (assurez-vous que les chemins sont corrects)
//   import { Village } from '../../village/entities/village.entity';
//   import { GameEvent } from '../../game-event/entities/game-event.entity';
//   import { Building } from '../../village/models/building.model'; // Modèle imbriqué TypeORM
//   import { ConstructionQueueItem } from '../../village/models/construction-queue.item.model'; // Modèle imbriqué TypeORM
//   // Interfaces et Services (inchangés)
//   import { BuildingConfigService } from '../../game-config/service/building-config.service';
//   import {
//     IJobScheduler,
//     JOB_SCHEDULER,
//   } from '../../game-event/interface/job-scheduler.interface';
//   // Enums et Types (inchangés, mais assurez-vous qu'ils sont importés)
//   import { GameEventType } from '../../game-event/types/event.enum';
//   import { GameEventStatus } from '../../game-event/types/game-event-status.enum';
//   import {
//     ResourceLevelConfig,
//     StorageLevelConfig,
//   } from '../../game-config/types/base-building-config';
//   // Supposons l'existence d'un GameEventRepository (similaire au VillageRepository traduit)
//   import { GameEventRepository } from '../../game-event/repository/game-event.repository'; // À créer/adapter
//   import { VillageRepository } from '../../village/repository/village.repository'; // Le repository traduit précédemment
  
//   const MAX_CONSTRUCTION_SLOTS = 3;
  
//   @Injectable()
//   export class BuildingService {
//     private readonly logger = new Logger(BuildingService.name);
  
//     constructor(
//       // Injection des repositories TypeORM
//       // Ajoutez le nom de connexion si nécessaire ('mongodb')
//       @InjectRepository(Village) private villageRepository: VillageRepository, // Utiliser le repo spécifique si créé
//       @InjectRepository(GameEvent) private gameEventRepository: GameEventRepository, // Utiliser un repo spécifique si créé
  
//       @Inject(JOB_SCHEDULER) private jobScheduler: IJobScheduler,
//       @Inject(forwardRef(() => BuildingConfigService))
//       private buildingConfigService: BuildingConfigService,
//     ) {}
  
//     // Logique inchangée, mais type mis à jour
//     private hasSufficientResources(
//       village: Village, // Type mis à jour
//       cost: { wood: number; clay: number; iron: number; crop: number },
//     ): boolean {
//       // Accès via l'entité TypeORM
//       return (
//         village.resources.wood.current >= cost.wood &&
//         village.resources.clay.current >= cost.clay &&
//         village.resources.iron.current >= cost.iron &&
//         village.resources.crop.current >= cost.crop
//       );
//     }
  
//     // Logique inchangée, mais type mis à jour et markModified supprimé
//     private deductResources(
//       village: Village, // Type mis à jour
//       cost: { wood: number; clay: number; iron: number; crop: number },
//     ): void {
//       village.resources.wood.current -= cost.wood;
//       village.resources.clay.current -= cost.clay;
//       village.resources.iron.current -= cost.iron;
//       village.resources.crop.current -= cost.crop;
//       // PAS de markModified nécessaire avec TypeORM + save()
//     }
  
//     // --- scheduleCompletionJob (inchangé conceptuellement, vérifier types ID) ---
//     private async scheduleCompletionJob(
//       villageId: string, // Garder string ici car souvent utilisé comme clé simple
//       queueItem: ConstructionQueueItem, // Type mis à jour
//     ): Promise<string | undefined> {
//       const delay = queueItem.endTime.getTime() - Date.now();
//       // Assurez-vous que les IDs sont bien des ObjectId avant de les convertir si nécessaire
//       const buildingInstanceIdStr = queueItem.buildingInstanceId.toString();
//       const gameEventIdStr = queueItem.gameEventId.toString();
  
//       const jobId = `building-${villageId}-${buildingInstanceIdStr}-${queueItem.targetLevel}`;
  
//       await this.jobScheduler.scheduleJob(
//         GameEventType.BUILDING_COMPLETE, // Assurez-vous que cet enum correspond
//         {
//           villageId: villageId,
//           buildingInstanceId: buildingInstanceIdStr,
//           targetLevel: queueItem.targetLevel,
//           gameEventId: gameEventIdStr,
//         },
//         {
//           delay: delay > 0 ? delay : 0,
//           jobId: jobId,
//           removeOnComplete: true,
//           removeOnFail: { age: 24 * 3600 },
//         },
//       );
//       this.logger.log(`[Village: ${villageId}] Job ${jobId} planifié pour ${queueItem.endTime}`);
//       return jobId;
//     }
  
//     // --- Méthodes Principales (Traduites pour TypeORM) ---
  
//     async startConstruction(
//       villageId: string,
//       buildingName: string,
//     ): Promise<Village> { // Retourne l'entité TypeORM
//       this.logger.log(
//         `[Village: ${villageId}] Tentative construction: ${buildingName}`,
//       );
//       // Utiliser le repository traduit (qui gère ObjectId)
//       const village = await this.villageRepository.findById(villageId);
  
//       if (!village)
//         throw new NotFoundException(`Village ${villageId} non trouvé.`);
  
//       // Logique de vérification métier inchangée
//       if (village.constructionQueue.length >= MAX_CONSTRUCTION_SLOTS) {
//         throw new BadRequestException(
//           `Limite de ${MAX_CONSTRUCTION_SLOTS} constructions atteinte.`,
//         );
//       }
  
//       const buildingConfig =
//         this.buildingConfigService.getBuildingConfig(buildingName);
//       if (!buildingConfig)
//         throw new NotFoundException(`Config pour '${buildingName}' introuvable.`);
  
//       const targetLevel = 1;
//       const levelConfig = this.buildingConfigService.getBuildingLevelConfig(
//         buildingName,
//         targetLevel,
//       );
  
//       if (!this.hasSufficientResources(village, levelConfig.cost)) {
//         throw new BadRequestException('Ressources insuffisantes.');
//       }
  
//       // Logique de temps inchangée
//       const startTime = new Date();
//       const endTime = new Date(
//         startTime.getTime() + levelConfig.upgrade_time * 1000,
//       );
  
//       // Utiliser les classes TypeORM
//       const newBuilding = new Building(); // Constructeur initialise l'_id
//       newBuilding.name = buildingName;
//       newBuilding.type = buildingConfig.type;
//       newBuilding.level = 0; // Le bâtiment commence niveau 0, sera niveau 1 à la fin
  
//       const newBuildingInstanceId = newBuilding._id; // Récupérer l'ID généré
  
//       let savedEvent: GameEvent | null = null;
//       let addedQueueItemData: ConstructionQueueItem | null = null;
  
//       try {
//         // Appliquer les changements sur l'objet village
//         this.deductResources(village, levelConfig.cost);
//         village.buildings.push(newBuilding); // Ajouter le nouveau bâtiment
  
//         // Créer et sauvegarder l'événement associé via son repository
//         const eventData = this.gameEventRepository.createInstance({ // Utiliser le repo GameEvent
//           eventType: GameEventType.BUILDING_COMPLETE, // Assurez-vous que l'enum est correct
//           status: GameEventStatus.SCHEDULED,
//           originVillageId: village._id, // Utiliser l'ObjectId
//           startTime: startTime,
//           endTime: endTime,
//           // Spécifique à l'event de construction/upgrade si défini dans GameEvent ou ses enfants
//           buildingInstanceId: newBuildingInstanceId,
//           targetLevel: targetLevel,
//         });
//         savedEvent = await this.gameEventRepository.save(eventData);
  
//         const gameEventId = savedEvent._id; // Récupérer l'ObjectId de l'event sauvegardé
  
//         // Créer l'item de queue (utiliser le constructeur TypeORM)
//         addedQueueItemData = new ConstructionQueueItem(); // Le constructeur initialise l'_id
//         addedQueueItemData.buildingInstanceId = newBuildingInstanceId;
//         addedQueueItemData.buildingName = buildingName;
//         addedQueueItemData.targetLevel = targetLevel;
//         addedQueueItemData.startTime = startTime;
//         addedQueueItemData.endTime = endTime;
//         addedQueueItemData.gameEventId = gameEventId; // Assigner l'ID de l'event sauvegardé
  
//         village.constructionQueue.push(addedQueueItemData);
  
//         // Sauvegarder l'entité Village racine avec TOUS les changements (ressources, buildings, queue)
//         await this.villageRepository.save(village); // Appel save sur le repository
//         this.logger.log(
//           `[Village: ${villageId}] Construction ${buildingName} Lvl ${targetLevel} ajoutée à la queue. Event: ${gameEventId.toString()}`,
//         );
  
//       } catch (error) {
//         this.logger.error(
//           `[Village: ${villageId}] Erreur BDD startConstruction: ${error instanceof Error ? error.message : String(error)}`,
//           error instanceof Error ? error.stack : undefined,
//         );
//         // Ici, l'état peut être incohérent si l'event a été créé mais le village non sauvegardé.
//         // Une transaction serait idéale pour garantir l'atomicité.
//         throw new InternalServerErrorException(
//           'Erreur serveur lors de la mise à jour du village.',
//         );
//       }
  
//       // Planifier la tâche BullMQ (opération externe)
//       const queueItemToSchedule = addedQueueItemData; // Utiliser l'objet créé
//       const jobId = await this.scheduleCompletionJob(
//         village._id.toString(), // ID du village en string
//         queueItemToSchedule,
//       );
  
//       // Mettre à jour le jobId dans l'item de queue (opération BDD séparée)
//       if (jobId) {
//         try {
//           // Utiliser updateOne du MongoRepository (nécessite typeorm >= 0.3 et mongodb driver >= 4)
//           // ou une méthode custom dans votre VillageRepository qui fait cela.
//           await this.villageRepository.updateOne(
//             { // Filtre pour trouver le village ET l'item spécifique dans le tableau
//               _id: village._id,
//               'constructionQueue._id': queueItemToSchedule._id,
//             },
//             { // Opérateur $set pour modifier le champ jobId de l'élément trouvé
//               $set: { 'constructionQueue.$.jobId': jobId }
//             },
//           );
//            this.logger.log(`[Village: ${villageId}] JobId ${jobId} enregistré pour item ${queueItemToSchedule._id.toString()}`);
//         } catch(updateError) {
//            this.logger.error(`[Village: ${villageId}] Erreur MAJ jobId ${jobId} pour item ${queueItemToSchedule._id.toString()}: ${updateError}`);
//            // Gérer l'erreur (ex: tenter de replanifier ?)
//         }
//       }
  
//       // Retourner le village potentiellement mis à jour (avec le jobId)
//       // findById gère la non-existence
//       return await this.villageRepository.findById(villageId) ?? village; // Retourne la version fraîche ou celle en mémoire
//     }
  
//     async startUpgrade(
//       villageId: string,
//       buildingInstanceId: string,
//     ): Promise<Village> { // Retourne l'entité TypeORM
//       this.logger.log(
//         `[Village: ${villageId}] Tentative amélioration: ${buildingInstanceId}`,
//       );
//       const village = await this.villageRepository.findById(villageId);
//       if (!village)
//         throw new NotFoundException(`Village ${villageId} non trouvé.`);
  
//       if (village.constructionQueue.length >= MAX_CONSTRUCTION_SLOTS) {
//         throw new BadRequestException(
//           `Limite de construction (${MAX_CONSTRUCTION_SLOTS}) atteinte.`,
//         );
//       }
  
//       // Trouver le bâtiment dans le tableau (comparaison d'ObjectId)
//       let buildingObjectId: ObjectId;
//        try {
//          buildingObjectId = new ObjectId(buildingInstanceId);
//        } catch(e){
//          throw new BadRequestException(`Format ID bâtiment invalide: ${buildingInstanceId}`);
//        }
  
//       const building = village.buildings.find(
//         (b) => b._id.equals(buildingObjectId), // Utiliser .equals() pour comparer les ObjectId
//       );
  
//       if (!building)
//         throw new NotFoundException(`Bâtiment ${buildingInstanceId} non trouvé dans le village.`);
  
//       // Vérifier si une tâche existe déjà pour ce bâtiment (comparaison d'ObjectId)
//       if (
//         village.constructionQueue.some((item) =>
//           item.buildingInstanceId.equals(building._id),
//         )
//       ) {
//         throw new BadRequestException(
//           'Une amélioration est déjà en cours pour ce bâtiment.',
//         );
//       }
  
//       const currentLevel = building.level;
//       const targetLevel = currentLevel + 1;
//       let levelConfig: ResourceLevelConfig | StorageLevelConfig | null = null;
//       try {
//         levelConfig = this.buildingConfigService.getBuildingLevelConfig(
//           building.name,
//           targetLevel,
//         );
//       } catch (error) {
//         this.logger.error(`Erreur config level: ${error}`);
//         throw new BadRequestException(
//           `Niveau ${targetLevel} introuvable ou invalide pour ${building.name}.`,
//         );
//       }
  
//       if (!this.hasSufficientResources(village, levelConfig.cost))
//         throw new BadRequestException('Ressources insuffisantes.');
  
//       const startTime = new Date();
//       const endTime = new Date(
//         startTime.getTime() + levelConfig.upgrade_time * 1000,
//       );
  
//       let savedEvent: GameEvent | null = null;
//       let addedQueueItemData: ConstructionQueueItem | null = null;
  
//       try {
//         this.deductResources(village, levelConfig.cost);
  
//         const eventData = this.gameEventRepository.createInstance({
//           eventType: GameEventType.BUILDING_COMPLETE, // Ajuster si nécessaire
//           status: GameEventStatus.SCHEDULED,
//           originVillageId: village._id,
//           startTime: startTime,
//           endTime: endTime,
//           buildingInstanceId: building._id, // Utiliser l'ObjectId du bâtiment existant
//           targetLevel: targetLevel,
//         });
//         savedEvent = await this.gameEventRepository.save(eventData);
  
//         addedQueueItemData = new ConstructionQueueItem(); // Le constructeur initialise _id
//         addedQueueItemData.buildingInstanceId = building._id; // Utiliser l'ObjectId du bâtiment existant
//         addedQueueItemData.buildingName = building.name;
//         addedQueueItemData.targetLevel = targetLevel;
//         addedQueueItemData.startTime = startTime;
//         addedQueueItemData.endTime = endTime;
//         addedQueueItemData.gameEventId = savedEvent._id; // ID de l'event créé
  
//         village.constructionQueue.push(addedQueueItemData);
  
//         // Sauvegarder l'entité racine Village
//         await this.villageRepository.save(village);
//         this.logger.log(
//           `[Village: ${villageId}] Amélioration ${building.name} Lvl ${targetLevel} ajoutée à la queue. Event: ${savedEvent._id.toString()}`,
//         );
//       } catch (error) {
//          this.logger.error(
//           `[Village: ${villageId}] Erreur BDD startUpgrade: ${error instanceof Error ? error.message : String(error)}`,
//           error instanceof Error ? error.stack : undefined,
//         );
//         // Encore une fois, risque d'incohérence sans transaction
//         throw new InternalServerErrorException(
//           'Erreur serveur lors de la mise à jour du village.',
//         );
//       }
  
//       // Planifier la tâche BullMQ
//       const queueItemToSchedule = addedQueueItemData;
//       const jobId = await this.scheduleCompletionJob(
//         village._id.toString(),
//         queueItemToSchedule,
//       );
  
//       // Mettre à jour le jobId dans l'item de queue
//        if (jobId) {
//          try {
//            await this.villageRepository.updateOne(
//              {
//                _id: village._id,
//                'constructionQueue._id': queueItemToSchedule._id,
//              },
//              { $set: { 'constructionQueue.$.jobId': jobId } },
//            );
//            this.logger.log(`[Village: ${villageId}] JobId ${jobId} enregistré pour item ${queueItemToSchedule._id.toString()}`);
//          } catch(updateError) {
//             this.logger.error(`[Village: ${villageId}] Erreur MAJ jobId ${jobId} pour item ${queueItemToSchedule._id.toString()}: ${updateError}`);
//             // Gérer l'erreur
//          }
//        }
  
//       // Retourner le village mis à jour
//       return await this.villageRepository.findById(villageId) ?? village;
//     }
  
//     // TODO: La méthode cancelBuildingTask(...) doit aussi être traduite.
//     // Elle impliquera de trouver le village, l'item dans la queue,
//     // annuler le job BullMQ via this.jobScheduler.removeJob(jobId),
//     // mettre à jour/supprimer l'event associé (GameEvent),
//     // supprimer l'item de la queue, potentiellement rembourser les ressources,
//     // et sauvegarder le village. L'atomicité sera un défi ici aussi sans transaction.
//   }