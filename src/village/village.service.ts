import { Injectable } from '@nestjs/common';
import { VillageRepository } from './village.repository';
import { Village } from './schema/village.schema';
import { CreateVillageDto } from './dto/create-village.dto';
import { User } from 'src/user/user.entity';

@Injectable()
export class VillageService {
  constructor(private readonly villageRepository: VillageRepository) {}

  createVillage(data: CreateVillageDto, user: User): Promise<Village> {
    return this.villageRepository.create({
      userId: user.id,
      faction: data.faction,
      name: data.name,
    });
  }
}
