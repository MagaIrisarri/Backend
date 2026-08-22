import { EntityManager } from '@mikro-orm/core';
import { Insurance } from './Insurance.Entity.js';

export class InsuranceRepository {
  constructor(private em: EntityManager) {}

  async findAll(): Promise<Insurance[]> {
    return await this.em.find(Insurance, { isActive: true }, { orderBy: { name: 'ASC' } });
  }

  async findById(id: string): Promise<Insurance | null> {
    return await this.em.findOne(Insurance, { id, isActive: true });
  }

  async create(data: { name: string }): Promise<Insurance> {
    const insurance = this.em.create(Insurance, data);
    await this.em.flush();
    return insurance;
  }

  async delete(id: string): Promise<boolean> {
    const insurance = await this.em.findOne(Insurance, { id, isActive: true });
    if (!insurance) return false;

    insurance.isActive = false;
    await this.em.flush();
    return true;
  }
}