import { EntityManager } from '@mikro-orm/core';
import { Vehicle } from './Vehicle.Entity.js';
import { Model } from './Model/Model.Entity.js';
import { User } from '../User/User.Entity.js';

export class VehicleService {
  constructor(private readonly em: EntityManager) {}

  async createVehicle(data: any, userId: string): Promise<Vehicle> {
    const model = await this.em.findOne(Model, 
      { id: data.modelId }, 
      { populate: ['vehicleType', 'brand'] }
    );
    if (!model) {
      throw new Error("El modelo seleccionado no existe en la base de datos.");
    }
   
    if (model.brand.id !== data.brandId) {
      throw new Error("Marca y modelo no coinciden");
    }


    const vehicleData = {
      ...data,               
      brand: data.brandId,   
      model: data.modelId,
      vehicleType: model.vehicleType.id,
      insurance: data.insuranceId,
      client: this.em.getReference(User, userId as any),
    };

    const vehicle = this.em.create(Vehicle, vehicleData);
    await this.em.flush();
    
    return vehicle;
  }

  async findAllVehicle(): Promise<Vehicle[]> {
    return await this.em.find(Vehicle, 
      {isActive: true},
      { populate: ['brand', 'model', 'vehicleType', 'insurance'] });
  }

  async findVehicleById(params: { id: string }): Promise<Vehicle | null> {
    return await this.em.findOne(Vehicle,
       { id: params.id, isActive: true },
       { populate: ['brand', 'model', 'vehicleType', 'insurance'] });
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
    
    vehicle.isActive = false;
    await this.em.flush();
    
    return true;
  }
}