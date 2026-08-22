import { EntityManager } from '@mikro-orm/core';
import { VehicleType } from './VehicleType.Entity.js';

export class VehicleTypeRepository {
  constructor(private readonly em: EntityManager) {}

  async findAll() {
    return await this.em.find(VehicleType, { isActive: true });
  }

  create(data: any) {
    return this.em.create(VehicleType, data);
  }

  async findById(id: string) {
    return await this.em.findOne(VehicleType, { id, isActive: true });
  }

  async delete(id: string): Promise<boolean> {
    const vehicleType = await this.findById(id);
    if (!vehicleType) return false;

    vehicleType.isActive = false;
    await this.em.flush();
    return true;
  }

  async flush() {
    await this.em.flush();
  }
}