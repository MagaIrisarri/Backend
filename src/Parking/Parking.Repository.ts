import { EntityManager } from '@mikro-orm/core';
import { Parking } from './Parking.Entity.js';
import { CreateParkingInput, UpdateParkingInput } from './Parking.Schema.js';

export class ParkingRepository {
  constructor(private em: EntityManager) {}

  async findAll(): Promise<Parking[]> {
    return await this.em.find(Parking, { isActive: true });
  }

  async findById(id: string): Promise<Parking | null> {
    return await this.em.findOne(Parking, { id, isActive: true });
  }

  async create(data: CreateParkingInput): Promise<Parking> {
    const parking = this.em.create(Parking, {
      ...data,
      isActive: true,
    });
    await this.em.flush();
    return parking;
  }

  async update(parking: Parking, data: UpdateParkingInput): Promise<Parking> {
    this.em.assign(parking, data);
    await this.em.flush();
    return parking;
  }

  async deactivate(parking: Parking): Promise<void> {
    parking.isActive = false;
    await this.em.flush();
  }
}