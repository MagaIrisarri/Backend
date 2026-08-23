import { EntityManager } from '@mikro-orm/core';
import { Brand } from './Brand.Entity.js';
import { Repository } from '../../Shared/base.Repository.js';

export class BrandRepository implements Repository<Brand> {
  constructor(private em: EntityManager) {}

  async findAll(): Promise<Brand[]> {
    return await this.em.find(Brand, { isActive: true }, { orderBy: { name: 'ASC' } });
  }

  async findOne(item: { id: string }): Promise<Brand | null> {
    return await this.em.findOne(Brand, { id: item.id, isActive: true });
  }

  async add(data: { name: string }): Promise<Brand> {
    const brand = this.em.create(Brand, data);
    await this.em.flush();
    return brand;
  }

  async update(id: string, data: { name?: string }): Promise<Brand | null> {
    const brand = await this.findOne({ id });
    if (!brand) return null;

    this.em.assign(brand, data);
    await this.em.flush();
    return brand;
  }

  async remove(item: { id: string }): Promise<boolean> {
    const brand = await this.findOne({ id: item.id });
    if (!brand) return false;

    brand.isActive = false;
    await this.em.flush();
    return true;
  }
}