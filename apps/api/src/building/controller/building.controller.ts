// src/building/controller/building.controller.ts

import {
  Controller,
  Post,
  Body,
  Param,
  Inject,
  UseGuards, // Potentiellement pour l'authentification/autorisation
  HttpCode,
  HttpStatus,
  ParseUUIDPipe, // Ou ParseObjectIdPipe si vous créez un pipe custom
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth, // Si vous utilisez l'authentification JWT Bearer
} from '@nestjs/swagger';
import { BuildingService } from '../service/building.service'; // Adapter le chemin
import { CreateBuildingDto } from '../dto/create-building.dto';
import {
  Village,
  VillageDocument,
} from '../../village/document/village.schema'; // Importer le Doc Mongoose pour le type de retour Swagger
// Importer un Guard si nécessaire
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'; // Exemple

@ApiTags('Villages - Buildings & Construction') // Groupe dans Swagger UI
@Controller('villages/:villageId/buildings') // Route de base liée à un village
export class BuildingController {
  constructor(private readonly buildingService: BuildingService) {}

  @Post() // Crée une nouvelle instance de bâtiment OU démarre une construction/amélioration
  @HttpCode(HttpStatus.ACCEPTED) // 202 Accepted est souvent approprié pour une tâche asynchrone
  @ApiOperation({
    summary: "Lance la construction ou l'amélioration d'un bâtiment",
    description:
      'Ajoute une tâche à la file de construction du village spécifié. Requiert des ressources et un slot de construction libre.',
  })
  @ApiParam({
    name: 'villageId',
    description: 'ID du village concerné',
    type: String,
  })
  @ApiBody({
    type: CreateBuildingDto,
    description: 'Nom du bâtiment à construire/améliorer',
  })
  @ApiResponse({
    status: 202,
    description: 'Tâche de construction/amélioration ajoutée à la file.',
    type: Village,
  }) // Utiliser la classe Village ici, Swagger comprendra
  @ApiResponse({
    status: 400,
    description:
      'Requête invalide (ex: ressources manquantes, file pleine, niveau max atteint)',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' }) // Si guard utilisé
  @ApiResponse({
    status: 403,
    description: 'Non autorisé (ex: pas le propriétaire du village)',
  }) // Si autorisation gérée
  @ApiResponse({
    status: 404,
    description: 'Village ou configuration du bâtiment non trouvé',
  })
  async startBuildingOrUpgrade(
    // Utiliser un Pipe pour valider/transformer l'ID si nécessaire (ex: ParseObjectIdPipe custom)
    @Param('villageId' /*, ParseObjectIdPipe */) villageId: string,
    @Body() dto: CreateBuildingDto,
    // Ajouter @Req() req si vous avez besoin d'accéder à l'utilisateur authentifié depuis le guard
    // @Req() req: any,
  ): Promise<VillageDocument> {
    return this.buildingService.startConstruction(villageId, dto.buildingName);
  }
}
