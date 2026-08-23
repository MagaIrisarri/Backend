import { EntityManager } from '@mikro-orm/core';
import { Model } from './Model.Entity.js';
import { Repository } from '../../Shared/base.Repository.js';

export class ModelRepository implements Repository<Model> {
  constructor(private em: EntityManager) {}

  async findAll(brandId?: string): Promise<Model[]> {
    const query: Record<string, any> = { isActive: true };
    if (brandId) query.brand = brandId;

    return await this.em.find(Model, query, {
      populate: ['brand', 'vehicleType'] as any,
      orderBy: { name: 'ASC' }
    });
  }

  async findOne(item: { id: string }): Promise<Model | null> {
    return await this.em.findOne(Model, { id: item.id, isActive: true }, {
      populate: ['brand', 'vehicleType'] as any
    });
  }

  async add(data: any): Promise<Model> {
    const model = this.em.create(Model, data);
    await this.em.flush();
    return model;
  }

  async update(id: string, data: any): Promise<Model | null> {
    const model = await this.em.findOne(Model, { id, isActive: true });
    if (!model) return null;

    if (data.name) model.name = data.name;
    if (data.brandId) model.brand = data.brandId;
    if (data.vehicleTypeId) model.vehicleType = data.vehicleTypeId;

    await this.em.flush();
    return model;
  }

  async remove(item: { id: string }): Promise<boolean> {
    const model = await this.em.findOne(Model, { id: item.id, isActive: true });
    if (!model) return false;

    model.isActive = false;
    await this.em.flush();
    return true;
  }
}