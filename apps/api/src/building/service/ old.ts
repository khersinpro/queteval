// import {
//     BadRequestException,
//     Inject,
//     Injectable,
//     InternalServerErrorException,
//     Logger,
//     NotFoundException,
//   } from '@nestjs/common';
//   import { VillageRepository } from '../../village/repository/village.repository';
//   import { VillageService } from '../../village/service/village.service';
//   import { BuildingConfigService } from '../../game-config/service/building-config.service';
//   import { Village } from '../../village/document/village.schema';
//   import { Building } from '../../village/document/embedded/building.schema';
//   import { ConstructionQueueItem } from '../../village/document/embedded/construction-queue-item.schema';
//   import {
//     BUILDING_JOB_PUBLISHER,
//     IJobPublisher,
//   } from '@app/game-job-publisher/interface/job-publisher.interface';
//   import { BuildingJob } from '@app/game-job-publisher/document/building-job.schema';
//   import { GAME_JOB_STATUS } from '@app/game-job-publisher/constant/game-job-status.enum';
//   import { GAME_JOB_TYPES } from '@app/game-job-publisher/constant/game-job-types.enum';
//   import { BuildingJobService } from '@app/game-job-publisher/service/building-job.service';
//   import { DataSource, EntityManager } from 'typeorm';
//   import { InjectDataSource } from '@nestjs/typeorm';
  
//   const MAX_CONSTRUCTION_SLOTS = 3;
  
//   interface StartConstructionTransactionResult {
//     villageSavedState: Village;
//     savedBuildingJob: BuildingJob;
//     addedQueueItemData: ConstructionQueueItem; // L'instance ajoutée à la queue
//   }
  
//   @Injectable()
//   export class BuildingService {
//     private readonly logger = new Logger(BuildingService.name);
//     constructor(
//       private readonly villageRepository: VillageRepository,
//       private readonly villageService: VillageService,
//       private readonly buildingConfigService: BuildingConfigService,
//       @Inject(BUILDING_JOB_PUBLISHER)
//       private readonly buildingJobPublisher: IJobPublisher,
//       private buildingJobService: BuildingJobService,
//       @InjectDataSource('mongodb')
//       private readonly dataSource: DataSource,
//     ) {}
  
//     private hasSufficientResources(
//       village: Village,
//       cost: { wood: number; clay: number; iron: number; crop: number },
//     ): boolean {
//       return (
//         village.resources.wood.current >= cost.wood &&
//         village.resources.clay.current >= cost.clay &&
//         village.resources.iron.current >= cost.iron &&
//         village.resources.crop.current >= cost.crop
//       );
//     }
  
//     private deductResources(
//       village: Village,
//       cost: { wood: number; clay: number; iron: number; crop: number },
//     ): void {
//       village.resources.wood.current -= cost.wood;
//       village.resources.clay.current -= cost.clay;
//       village.resources.iron.current -= cost.iron;
//       village.resources.crop.current -= cost.crop;
//     }
  
//     async startConstruction(
//       villageId: string,
//       buildingName: string,
//     ): Promise<Village> {
//       this.logger.log(
//         `[Village: ${villageId}] Tentative construction: ${buildingName}`,
//       );
  
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
  
//       let txResult: StartConstructionTransactionResult; // Variable pour stocker le résultat
  
//       try {
//         // Assigner le résultat de la transaction
//         txResult =
//           await this.dataSource.transaction<StartConstructionTransactionResult>(
//             async (entityManager: EntityManager) => {
//               const villageInTx = await entityManager.findOneBy(Village, {
//                 _id: village._id,
//               });
//               if (!villageInTx)
//                 throw new NotFoundException(
//                   `Village ${villageId} disparu pendant la transaction.`,
//                 );
  
//               this.deductResources(villageInTx, levelConfig.cost);
  
//               const newBuilding = new Building();
//               newBuilding.name = buildingName;
//               newBuilding.type = buildingConfig.type;
//               newBuilding.level = 0;
//               const newBuildingInstanceId = newBuilding._id;
  
//               const buildingJobData = entityManager.create(BuildingJob, {
//                 buildingInstanceId: newBuildingInstanceId,
//                 originVillageId: villageInTx._id,
//                 targetLevel: targetLevel,
//                 startTime: startTime,
//                 endTime: endTime,
//                 status: GAME_JOB_STATUS.SCHEDULED,
//               });
//               const savedJob = await entityManager.save(
//                 BuildingJob,
//                 buildingJobData,
//               ); // Sauvegarder le job
  
//               const queueItemData = new ConstructionQueueItem();
//               queueItemData.buildingInstanceId = newBuildingInstanceId;
//               queueItemData.buildingName = buildingName;
//               queueItemData.targetLevel = targetLevel;
//               queueItemData.startTime = startTime;
//               queueItemData.endTime = endTime;
//               queueItemData.buildingJobId = savedJob._id; // Utiliser l'ID du job sauvegardé
  
//               villageInTx.buildings.push(newBuilding);
//               villageInTx.constructionQueue.push(queueItemData); // Ajouter l'instance
  
//               const savedVillage = await entityManager.save(Village, villageInTx); // Sauvegarder le village
  
//               // ** RETOURNER les objets nécessaires depuis le callback **
//               return {
//                 villageSavedState: savedVillage,
//                 savedBuildingJob: savedJob,
//                 addedQueueItemData: queueItemData, // Retourner l'instance ajoutée
//               };
//             }, // Fin du callback
//           ); // Fin de l'appel à transaction
//       } catch (error: unknown) {
//         this.logger.error(
//           `[Village: ${villageId}] Transaction startConstruction échouée`,
//         );
//         if (
//           error instanceof NotFoundException ||
//           error instanceof BadRequestException
//         )
//           throw error;
//         throw new InternalServerErrorException(
//           'Erreur serveur pendant la transaction.',
//         );
//       }
  
//       // --- Suite des opérations (txResult est défini et correctement typé ici) ---
//       // Pas besoin de vérifier si txResult est null, car une erreur aurait été levée
  
//       const { villageSavedState, savedBuildingJob, addedQueueItemData } =
//         txResult;
//       const buildingJobId = savedBuildingJob._id.toString();
//       const queueItemId = addedQueueItemData._id; // Récupérer l'ID de l'item de queue
  
//       // 2. Planifier le job BullMQ
//       let jobId: string | undefined;
//       try {
//         jobId = await this.buildingJobPublisher.scheduleJob({
//           job_type: GAME_JOB_TYPES.BUILDING_JOB,
//           payload: { database_job_id: buildingJobId },
//           options: {
//             delay: Math.max(0, endTime.getTime() - Date.now()),
//             removeOnComplete: true,
//             removeOnFail: { age: 24 * 3600 },
//           },
//         });
//       } catch (scheduleError) {
//         this.logger.error(
//           `[Village: ${villageId}] Échec planification job ${buildingJobId}: ${scheduleError}`,
//         );
//         // COMPENSATION
//         await this.buildingJobService.update(buildingJobId, {
//           status: GAME_JOB_STATUS.FAILED,
//         });
//         // await this.villageRepository.updateOne(
//         //   { _id: villageSavedState._id },
//         //   { $pull: { constructionQueue: { _id: queueItemId } } }, // Utiliser l'ID récupéré
//         // );
//         // ... autres compensations ...
//         throw new InternalServerErrorException(
//           'La construction a été enregistrée mais sa planification a échoué.',
//         );
//       }
  
//       // 3. Mettre à jour les jobIds
//       if (jobId) {
//         try {
//           const updateVillageResult = await this.villageRepository.updateOne(
//             { _id: villageSavedState._id, 'constructionQueue._id': queueItemId }, // Utiliser l'ID récupéré
//             { $set: { 'constructionQueue.$.jobId': jobId } },
//           );
//           const updateJobResult = await this.buildingJobService.update(
//             buildingJobId,
//             { queuedJobId: jobId },
//           );
  
//           if (updateVillageResult.affected > 0 && updateJobResult) {
//             this.logger.log(
//               `[Village: ${villageId}] JobId ${jobId} enregistré pour item ${queueItemId.toString()} et job ${buildingJobId}`,
//             );
//           } else {
//             this.logger.warn(
//               `[Village: ${villageId}] JobId ${jobId} non (entièrement) enregistré pour item ${queueItemId.toString()}/job ${buildingJobId}.`,
//             );
//           }
//         } catch (updateError) {
//           this.logger.error(
//             `[Village: ${villageId}] Erreur BDD updateJobId: ${updateError instanceof Error ? updateError.message : String(updateError)}`,
//             updateError instanceof Error ? updateError.stack : undefined,
//           );
//         }
//       }
  
//       // 4. Retourner l'état final
//       // findById est plus sûr pour avoir l'état le plus à jour possible après les MAJ jobId hors transaction.
//       return (
//         (await this.villageRepository.findById(villageId)) ?? villageSavedState
//       );
//     }
//   }
  