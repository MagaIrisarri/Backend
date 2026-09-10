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

  async create(data: any): Promise<Model> {
    const modelData = { name: data.name, brand: data.brandId, vehicleType: data.vehicleTypeId };
    return await this.modelRepository.add(modelData);
  }

  async update(id: string, data: any): Promise<Model | null> {
    return await this.modelRepository.update(id, data);
  }

  async remove(id: string): Promise<boolean> {
    return await this.modelRepository.remove({ id });
  }
}