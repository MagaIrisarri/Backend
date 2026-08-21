import { EntityManager } from '@mikro-orm/core';
import { Insurance } from './Insurance.Entity.js';

export class InsuranceRepository {
  constructor(private em: EntityManager) {}

  async findAll(): Promise<Insurance[]> {
    return await this.em.find(Insurance, {}, { orderBy: { name: 'ASC' } });
  }

  async findById(id: string): Promise<Insurance | null> {
    return await this.em.findOne(Insurance, { id });
  }

  async create(data: { name: string }): Promise<Insurance> {
    const insurance = this.em.create(Insurance, data);
    await this.em.flush();
    return insurance;
  }

  async delete(id: string): Promise<boolean> {
    const insurance = await this.em.findOne(Insurance, { id });
    if (!insurance) return false;

    this.em.remove(insurance);
    await this.em.flush();
    return true;
  }
}