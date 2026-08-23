import { EntityManager } from '@mikro-orm/core';
import { Vehicle } from './Vehicle.Entity.js';
import { Model } from './Model/Model.Entity.js';
import { User } from '../User/User.Entity.js';

export class VehicleRepository {
  constructor(private readonly em: EntityManager) {}

  
  async findActiveByUserId(userId: string): Promise<Vehicle[]> {
    return await this.em.find(Vehicle,
      { client: userId as any, isActive: true },
      { populate: ['brand', 'model', 'vehicleType', 'insurance', 'client'] }
    );
}
  async findModelWithDetails(modelId: string): Promise<Model | null> {
    return await this.em.findOne(Model, 
      { id: modelId }, 
      { populate: ['vehicleType', 'brand'] }
    );
  }

  getUserReference(userId: string): User {
    return this.em.getReference(User, userId);
  }

  create(vehicleData: any): Vehicle {
    return this.em.create(Vehicle, vehicleData);
  }

  async flush(): Promise<void> {
    await this.em.flush();
  }

  async findAllActive(): Promise<Vehicle[]> {
    return await this.em.find(Vehicle, 
      { isActive: true },
      { populate: ['brand', 'model', 'vehicleType', 'insurance','client'] }
    );
  }

  async findActiveById(id: string): Promise<Vehicle | null> {
    return await this.em.findOne(Vehicle,
       { id, isActive: true },
       { populate: ['brand', 'model', 'vehicleType', 'insurance','client'] }
    );
  }

  async findById(id: string): Promise<Vehicle | null> {
    return await this.em.findOne(Vehicle, { id });
  }

  // Asigna nuevos datos a un vehículo existente
  assign(vehicle: Vehicle, data: any): void {
    this.em.assign(vehicle, data);
  }
}