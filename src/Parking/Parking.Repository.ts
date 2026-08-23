import { EntityManager } from '@mikro-orm/core';
import { Parking } from './Parking.Entity.js';
import { Repository } from '../Shared/base.Repository.js';

export class ParkingRepository implements Repository<Parking> {
    constructor(private em: EntityManager) {}

  async findAll(): Promise<Parking[]> {
    return await this.em.find(Parking, { isActive: true });
  }

  async findOne(item: { id: string }): Promise<Parking | null> {
    return await this.em.findOne(Parking, { id: item.id, isActive: true });
  }

  async add(data: any): Promise<Parking> {
    const parking = this.em.create(Parking, { ...data, isActive: true });
    await this.em.flush();
    return parking;
  }

  async update(id: string, data: any): Promise<Parking | null> {
    const parking = await this.findOne({ id });
    if (!parking) return null;

    this.em.assign(parking, data);
    await this.em.flush();
    return parking;
  }

async remove(item: { id: string }): Promise<boolean> {
    const parking = await this.findOne({ id: item.id });
    if (!parking) return false;

    parking.isActive = false;
    await this.em.flush();
    return true;
  }
}