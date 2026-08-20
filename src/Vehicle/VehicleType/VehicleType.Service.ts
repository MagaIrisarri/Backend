import { EntityManager } from '@mikro-orm/core';
import { VehicleType } from './VehicleType.Entity.js';

export class VehicleTypeService {
  constructor(private readonly em: EntityManager) {}

  async findAll() {
    return await this.em.find(VehicleType, {});
  }

  async create(data: any) {
    const vehicleType = this.em.create(VehicleType, data);
    await this.em.flush();
    return vehicleType;
  }

  async delete(id: string) {
    const vehicleType = await this.em.findOne(VehicleType, { id });
    if (!vehicleType) return false;
    
    this.em.remove(vehicleType);
    await this.em.flush();
    return true;
  }
}