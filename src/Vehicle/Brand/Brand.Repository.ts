import { EntityManager } from '@mikro-orm/core';
import { Brand } from './Brand.Entity.js';

export class BrandRepository {
  constructor(private em: EntityManager) {}

  async findAll(): Promise<Brand[]> {
    return await this.em.find(Brand, { isActive: true }, { orderBy: { name: 'ASC' } });
  }

  async findById(id: string): Promise<Brand | null> {
    return await this.em.findOne(Brand, { id, isActive: true });
  }

  async create(data: { name: string }): Promise<Brand> {
    const brand = this.em.create(Brand, data);
    await this.em.flush();
    return brand;
  }

  async delete(id: string): Promise<boolean> {
    const brand = await this.em.findOne(Brand, { id, isActive: true });
    if (!brand) return false;

    brand.isActive = false;
    await this.em.flush();
    return true;
  }
}