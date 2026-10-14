import { EntityManager } from '@mikro-orm/core';
import { Brand } from './Brand.Entity.js';

// Solo lectura: las marcas se agregan y reactivan con la importación del catálogo (Catalog.Repository).
export class BrandRepository {
  constructor(private em: EntityManager) {}

  async findAll(): Promise<Brand[]> {
    return await this.em.find(Brand, { isActive: true }, { orderBy: { name: 'ASC' } });
  }

  async findOne(item: { id: string }): Promise<Brand | null> {
    return await this.em.findOne(Brand, { id: item.id, isActive: true });
  }
}
