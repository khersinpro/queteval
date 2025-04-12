import { Injectable } from '@nestjs/common';
import { BuildingJobRepository } from '../repository/building-job.repository';
import { BuildingJob } from '../document/building-job.document';

@Injectable()
export class BuildingJobService {
  constructor(private readonly buildingJobRepository: BuildingJobRepository) {}

  async findAll(): Promise<BuildingJob[]> {
    return this.buildingJobRepository.findAll();
  }

  async findById(id: string): Promise<BuildingJob | null> {
    return this.buildingJobRepository.findById(id);
  }

  async save(buildingJob: BuildingJob): Promise<BuildingJob> {
    return this.buildingJobRepository.save(buildingJob);
  }

  async update(
    id: string,
    patch: Partial<BuildingJob>,
  ): Promise<BuildingJob | null> {
    return this.buildingJobRepository.update(id, patch);
  }

  async delete(id: string): Promise<BuildingJob | null> {
    return this.buildingJobRepository.delete(id);
  }
}
