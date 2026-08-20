import { EntityManager } from '@mikro-orm/core';
import { Model } from './Model.Entity.js';

export class ModelService {
  constructor(private em: EntityManager) {}

  async createModel(data: any): Promise<Model> {
    const modelData = {
      name: data.name,
      brand: data.brandId,             
      vehicleType: data.vehicleTypeId  
    };

    const model = this.em.create(Model, modelData);
    await this.em.flush();
    
    return model;
  }

  
  async findAllModels(brandId?: string): Promise<Model[]> {
    
    
    const query = brandId ? { brand: brandId } : {};

    return await this.em.find(
      Model, 
      query,
      { 
        populate: ['brand', 'vehicleType'], // Trae los nombres en vez de solo UUID
        orderBy: { name: 'ASC' }            
      }
    );
  }

 
  async findModelById(params: { id: string }): Promise<Model | null> {
    return await this.em.findOne(
      Model, 
      { id: params.id },
      { populate: ['brand', 'vehicleType'] }
    );
  }

 
  async updateModel(params: { id: string }, data: any): Promise<Model | null> {
    const model = await this.em.findOne(Model, { id: params.id });
    
    if (!model) return null;
    
 
    if (data.name) model.name = data.name;
    if (data.brandId) model.brand = data.brandId;
    if (data.vehicleTypeId) model.vehicleType = data.vehicleTypeId;

    await this.em.flush();
    
    return model;
  }

 
  async deleteModel(params: { id: string }): Promise<boolean> {
    const model = await this.em.findOne(Model, { id: params.id });
    
    if (!model) return false;
    
    this.em.remove(model);
    await this.em.flush();
    
    return true;
  }
}