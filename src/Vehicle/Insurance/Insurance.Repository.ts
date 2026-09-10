import { EntityManager } from '@mikro-orm/core';
import { Insurance } from './Insurance.Entity.js';
import { Repository } from '../../Shared/base.Repository.js';

export class InsuranceRepository implements Repository<Insurance> {
  constructor(private em: EntityManager) {}

  async findAll(): Promise<Insurance[]> {
    return await this.em.find(Insurance, { isActive: true }, { orderBy: { name: 'ASC' } });
  }

  async findOne(item: { id: string }): Promise<Insurance | null> {
    return await this.em.findOne(Insurance, { id: item.id, isActive: true });
  }

  async add(data: { name: string }): Promise<Insurance> {
    const insurance = this.em.create(Insurance, data);
    await this.em.flush();
    return insurance;
  }

  async update(id: string, data: { name?: string }): Promise<Insurance | null> {
    const insurance = await this.findOne({ id });
    if (!insurance) return null;

    this.em.assign(insurance, data);
    await this.em.flush();
    return insurance;
  }

  async remove(item: { id: string }): Promise<boolean> {
    const insurance = await this.findOne({ id: item.id });
    if (!insurance) return false;

    insurance.isActive = false;
    await this.em.flush();
    return true;
  }
}