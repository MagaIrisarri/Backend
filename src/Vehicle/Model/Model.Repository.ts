import { EntityManager } from '@mikro-orm/core';
import { Model } from './Model.Entity.js';

export class ModelRepository {
  constructor(private em: EntityManager) {}

  async create(data: any): Promise<Model> {
    const model = this.em.create(Model, data);
    await this.em.flush();
    return model;
  }

  async findAll(brandId?: string): Promise<Model[]> {
    const query = brandId ? { brand: brandId } : {};
    return await this.em.find(Model, query, {
      populate: ['brand', 'vehicleType'],
      orderBy: { name: 'ASC' }
    });
  }

  async findById(id: string): Promise<Model | null> {
    return await this.em.findOne(Model, { id }, {
      populate: ['brand', 'vehicleType']
    });
  }

  async update(id: string, data: any): Promise<Model | null> {
    const model = await this.em.findOne(Model, { id });
    if (!model) return null;

    if (data.name) model.name = data.name;
    if (data.brandId) model.brand = data.brandId;
    if (data.vehicleTypeId) model.vehicleType = data.vehicleTypeId;

    await this.em.flush();
    return model;
  }

  async delete(id: string): Promise<boolean> {
    const model = await this.em.findOne(Model, { id });
    if (!model) return false;

    this.em.remove(model);
    await this.em.flush();
    return true;
  }
}