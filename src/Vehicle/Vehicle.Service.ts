import { Vehicle } from './Vehicle.Entity.js';
import { VehicleRepository } from './Vehicle.Repository.js';

export class VehicleService {
  constructor(private readonly vehicleRepository: VehicleRepository) {}
  
  async findVehiclesByUserId(userId: string): Promise<Vehicle[]> {
  return await this.vehicleRepository.findActiveByUserId(userId);
  }

  async createVehicle(data: any, userId: string): Promise<Vehicle> {
  const model = await this.vehicleRepository.findModelWithDetails(data.modelId);
    
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
      client: this.vehicleRepository.getUserReference(userId),
    };

    const vehicle = this.vehicleRepository.create(vehicleData);
    await this.vehicleRepository.flush();
    
    return vehicle;
  }

  async findAllVehicle(): Promise<Vehicle[]> {
    return await this.vehicleRepository.findAllActive();
  }

  async findVehicleById(params: { id: string }): Promise<Vehicle | null> {
    return await this.vehicleRepository.findActiveById(params.id);
  }

  async updateVehicle(params: { id: string }, data: any): Promise<Vehicle | null> {
    const vehicle = await this.vehicleRepository.findById(params.id);
    
    if (!vehicle) return null;
    
    this.vehicleRepository.assign(vehicle, data);
    await this.vehicleRepository.flush();
    
    return vehicle;
  }

  async deleteVehicle(params: { id: string }): Promise<boolean> {
    const vehicle = await this.vehicleRepository.findById(params.id);
    
    if (!vehicle) return false;
    
    vehicle.isActive = false;
    await this.vehicleRepository.flush();
    
    return true;
  }
}