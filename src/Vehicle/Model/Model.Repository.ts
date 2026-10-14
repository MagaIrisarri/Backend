import { EntityManager } from '@mikro-orm/core';
import { Model } from './Model.Entity.js';

// Solo lectura: los modelos se agregan y reactivan con la importación del catálogo (Catalog.Repository).
export class ModelRepository {
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
}
