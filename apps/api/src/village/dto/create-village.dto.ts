import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateVillageDto {
  @ApiProperty({
    example: 'MyVillage',
    description: 'Nom de la ville',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'MyFaction',
    description: 'Faction de la ville',
  })
  @IsNotEmpty()
  @IsString()
  faction: string;
}
