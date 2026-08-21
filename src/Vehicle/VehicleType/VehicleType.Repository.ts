import { EntityManager } from '@mikro-orm/core';
import { VehicleType } from './VehicleType.Entity.js';

export class VehicleTypeRepository {
  constructor(private readonly em: EntityManager) {}

  async findAll() {
    return await this.em.find(VehicleType, {});
  }

  create(data: any) {
    return this.em.create(VehicleType, data);
  }

  async findById(id: string) {
    return await this.em.findOne(VehicleType, { id });
  }

  remove(vehicleType: VehicleType) {
    this.em.remove(vehicleType);
  }

  async flush() {
    await this.em.flush();
  }
}