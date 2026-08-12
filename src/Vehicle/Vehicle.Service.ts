import { EntityManager } from '@mikro-orm/core';
import { Vehicle } from './Vehicle.Entity.js';

export class VehicleService {
  constructor(private em: EntityManager) {}

  async createVehicle(data: any): Promise<Vehicle> {
    const vehicle = this.em.create(Vehicle, data);
    await this.em.flush();
    return vehicle;
  }

  async findAllVehicle(): Promise<Vehicle[]> {
    return await this.em.find(Vehicle, {});
  }

  async findVehicleById(params: { id: string }): Promise<Vehicle | null> {
    return await this.em.findOne(Vehicle, { id: params.id });
  }

  async updateVehicle(params: { id: string }, data: any): Promise<Vehicle | null> {
    const vehicle = await this.em.findOne(Vehicle, { id: params.id });
    
    if (!vehicle) return null;
    
    this.em.assign(vehicle, data);
    await this.em.flush();
    
    return vehicle;
  }

  async deleteVehicle(params: { id: string }): Promise<boolean> {
    const vehicle = await this.em.findOne(Vehicle, { id: params.id });
    
    if (!vehicle) return false;
    
    this.em.remove(vehicle);
    await this.em.flush();
    
    return true;
  }
}