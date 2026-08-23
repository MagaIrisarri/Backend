import { EntityManager } from '@mikro-orm/core';
import { Vehicle } from './Vehicle.Entity.js';
import { Model } from './Model/Model.Entity.js';
import { User } from '../User/User.Entity.js';
import { Repository } from '../Shared/base.Repository.js';

export class VehicleRepository implements Repository<Vehicle> {
  constructor(private readonly em: EntityManager) {}

  async findAll(): Promise<Vehicle[]> {
    return await this.em.find(Vehicle, { isActive: true },
      { populate: ['brand', 'model', 'vehicleType', 'insurance','client'] as any });
  }

  async findOne(item: { id: string }): Promise<Vehicle | null> {
    return await this.em.findOne(Vehicle, { id: item.id, isActive: true },
      { populate: ['brand', 'model', 'vehicleType', 'insurance','client'] as any });
  }

  async add(data: any): Promise<Vehicle> {
    const vehicle = this.em.create(Vehicle, data);
    await this.em.flush();
    return vehicle;
  }

  async update(id: string, data: any): Promise<Vehicle | null> {
    const vehicle = await this.em.findOne(Vehicle, { id, isActive: true });
    if (!vehicle) return null;

    this.em.assign(vehicle, data);
    await this.em.flush();
    return vehicle;
  }

  async remove(item: { id: string }): Promise<boolean> {
    const vehicle = await this.em.findOne(Vehicle, { id: item.id });
    if (!vehicle) return false;
    
    vehicle.isActive = false;
    await this.em.flush();
    return true;
  }

  async findActiveByUserId(userId: string): Promise<Vehicle[]> {
    return await this.em.find(Vehicle, { client: userId as any, isActive: true },
    { populate: ['brand', 'model', 'vehicleType', 'insurance', 'client']}
    );
  }

  async findModelWithDetails(modelId: string): Promise<Model | null> {
    return await this.em.findOne(Model, { id: modelId }, 
      { populate: ['vehicleType', 'brand']}
    );
  }

  getUserReference(userId: string): User {
    return this.em.getReference(User, userId);
  }
}