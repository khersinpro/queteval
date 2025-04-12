import { Injectable } from '@nestjs/common';
import { VillageRepository } from '../repository/village.repository';
import { Village } from '../document/village.document';
import { CreateVillageDto } from '../dto/create-village.dto';
import { User } from '../../user/entity/user.entity';

@Injectable()
export class VillageService {
  constructor(private readonly villageRepository: VillageRepository) {}

  createVillage(data: CreateVillageDto, user: User): Promise<Village> {
    return this.villageRepository.createAndSave({
      userId: user.id,
      faction: data.faction,
      name: data.name,
    });
  }
}
