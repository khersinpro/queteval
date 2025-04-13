// src/building/dto/start-construction.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator'; // Assurez-vous d'installer class-validator et class-transformer

export class CreateBuildingDto {
  @ApiProperty({
    description: "Le nom interne ou 'slug' du type de bâtiment à construire.",
    example: 'main_building', // Ou 'barracks', 'warehouse', etc.
  })
  @IsString()
  @IsNotEmpty()
  buildingName: string;
}
