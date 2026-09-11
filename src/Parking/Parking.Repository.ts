import { EntityManager } from '@mikro-orm/core';
import { Parking } from './Parking.Entity.js';
import { User } from '../User/User.Entity.js';
import { Repository } from '../Shared/base.Repository.js';

export class ParkingRepository implements Repository<Parking> {
  constructor(private em: EntityManager) {}

  async findAll(): Promise<Parking[]> {
    return await this.em.find(Parking, {}, { populate: ['owner', 'parkingpriceHistory', 'parkingSpaces'] as any });
  }

  async findActive(): Promise<Parking[]> {
    return await this.em.find(Parking, { isActive: true }, { populate: ['owner', 'parkingpriceHistory', 'parkingSpaces'] as any });
  }

  async findOne(item: { id: string }): Promise<Parking | null> {
    return await this.em.findOne(Parking, { id: item.id }, { populate: ['owner', 'parkingpriceHistory', 'parkingSpaces'] as any });
  }

  async findByOwnerId(ownerId: string): Promise<Parking[]> {
    return await this.em.find(Parking, { owner: { id: ownerId } }, { populate: ['owner', 'parkingpriceHistory', 'parkingSpaces'] as any });
  }

  async findByOwner(ownerId: string): Promise<Parking[]> {
    return await this.em.find(Parking, { owner: ownerId as any }, { populate: ['owner', 'parkingpriceHistory', 'parkingSpaces'] as any, orderBy: { name: 'ASC' } });
  }

  async add(data: any): Promise<Parking> {
    const parking = this.em.create(Parking, { ...data, isActive: false });
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

  async getUserById(userId: string): Promise<User | null> {
    return await this.em.findOne(User, { id: userId });
  }
}