import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Village } from './schema/village.schema';

@Injectable()
export class VillageRepository {
  constructor(
    @InjectModel(Village.name)
    private readonly villageModel: Model<Village>,
  ) {}

  async create(data: Partial<Village>): Promise<Village> {
    const created = new this.villageModel(data);
    return created.save();
  }

  async findAll(): Promise<Village[]> {
    return this.villageModel.find().exec();
  }

  async findById(id: string): Promise<Village | null> {
    return this.villageModel.findById(id).exec();
  }

  async update(id: string, patch: Partial<Village>): Promise<Village | null> {
    return this.villageModel.findByIdAndUpdate(id, patch, { new: true }).exec();
  }

  async delete(id: string): Promise<Village | null> {
    return this.villageModel.findByIdAndDelete(id).exec();
  }
}
