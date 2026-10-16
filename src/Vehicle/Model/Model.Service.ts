import { ModelRepository } from './Model.Repository.js';
import { Model } from './Model.Entity.js';

export class ModelService {
  constructor(private modelRepository: ModelRepository) {}

  async findAll(brandId?: string): Promise<Model[]> {
    return await this.modelRepository.findAll(brandId);
  }

  async findOne(id: string): Promise<Model | null> {
    return await this.modelRepository.findOne({ id });
  }
}
