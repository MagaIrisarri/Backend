import { ModelRepository } from './Model.Repository.js';
import { Model } from './Model.Entity.js';

export class ModelService {
  constructor(private modelRepository: ModelRepository) {}

  async createModel(data: any): Promise<Model> {
    const modelData = {
      name: data.name,
      brand: data.brandId,
      vehicleType: data.vehicleTypeId
    };
    return await this.modelRepository.create(modelData);
  }

  async findAllModels(brandId?: string): Promise<Model[]> {
    return await this.modelRepository.findAll(brandId);
  }

  async findModelById(params: { id: string }): Promise<Model | null> {
    return await this.modelRepository.findById(params.id);
  }

  async updateModel(params: { id: string }, data: any): Promise<Model | null> {
    return await this.modelRepository.update(params.id, data);
  }

  async deleteModel(params: { id: string }): Promise<boolean> {
    return await this.modelRepository.delete(params.id);
  }
}