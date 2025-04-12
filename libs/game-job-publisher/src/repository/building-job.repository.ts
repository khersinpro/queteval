import { InjectRepository } from '@nestjs/typeorm';
import { BuildingJob } from '../document/building-job.document';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';

export class BuildingJobRepository {
  constructor(
    @InjectRepository(BuildingJob, 'mongodb')
    private readonly buildingJobRepository: MongoRepository<BuildingJob>,
  ) {}

  async findAll(): Promise<BuildingJob[]> {
    return this.buildingJobRepository.find();
  }

  async findById(id: string | ObjectId): Promise<BuildingJob | null> {
    if (typeof id === 'string') {
      id = new ObjectId(id);
    }

    return await this.buildingJobRepository.findOneBy({ _id: id });
  }

  async save(buildingJob: BuildingJob): Promise<BuildingJob> {
    return this.buildingJobRepository.save(buildingJob);
  }

  async update(
    id: string | ObjectId,
    patch: Partial<BuildingJob>,
  ): Promise<BuildingJob | null> {
    if (typeof id === 'string') {
      id = new ObjectId(id);
    }

    const updateResult = await this.buildingJobRepository.update(
      { _id: id },
      patch,
    );

    if (updateResult.affected === 0) {
      return null;
    }

    return await this.buildingJobRepository.findOneBy({ _id: id });
  }

  async delete(id: string | ObjectId): Promise<BuildingJob | null> {
    if (typeof id === 'string') {
      id = new ObjectId(id);
    }

    const buildingJobToDelete = await this.buildingJobRepository.findOneBy({
      _id: id,
    });

    if (!buildingJobToDelete) {
      return null;
    }

    const deleteResult = await this.buildingJobRepository.delete({ _id: id });

    if (deleteResult.affected === 0) {
      console.error(
        `Failed to delete building job ${id.toString()} after finding it.`,
      );
      return null;
    }

    return buildingJobToDelete;
  }
}
