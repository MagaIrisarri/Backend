import { EntityManager } from '@mikro-orm/core';
import { VehicleType } from './VehicleType.Entity.js';
import { Repository } from '../../Shared/base.Repository.js';

export class VehicleTypeRepository implements Repository<VehicleType> {
  constructor(private readonly em: EntityManager) {}

  async findAll(): Promise<VehicleType[]> {
    return await this.em.find(VehicleType, { isActive: true });
  }

  async findOne(item: { id: string }): Promise<VehicleType | null> {
    return await this.em.findOne(VehicleType, { id: item.id, isActive: true });
  }

  async add(data: any): Promise<VehicleType> {
    const vehicleType = this.em.create(VehicleType, data);
    await this.em.flush();
    return vehicleType;
  }

  async update(id: string, data: any): Promise<VehicleType | null> {
    const vehicleType = await this.findOne({ id });
    if (!vehicleType) return null;

    this.em.assign(vehicleType, data);
    await this.em.flush();
    return vehicleType;
  }

  async remove(item: { id: string }): Promise<boolean> {
    const vehicleType = await this.findOne({ id: item.id });
    if (!vehicleType) return false;

    vehicleType.isActive = false;
    await this.em.flush();
    return true;
  }
}