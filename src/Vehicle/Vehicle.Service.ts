import { Vehicle } from './Vehicle.Entity.js';
import { VehicleRepository } from './Vehicle.Repository.js';
import { AppError } from '../Shared/utils/AppError.js';

export class VehicleService {
  constructor(private readonly vehicleRepository: VehicleRepository) {}
  
  async findAll(): Promise<Vehicle[]> {
    return await this.vehicleRepository.findAll();
  }

  async findOne(id: string): Promise<Vehicle | null> {
    return await this.vehicleRepository.findOne({ id });
  }

  async findVehiclesByUserId(userId: string): Promise<Vehicle[]> {
    return await this.vehicleRepository.findActiveByUserId(userId);
  }

  async create(data: any, userId: string): Promise<Vehicle> {
    const user = await this.vehicleRepository.getUserById(userId);
    if (!user || user.status !== 'ACTIVO') {
      throw new AppError("Cliente no encontrado o inactivo", 404);
    }

    if (user.type === 'EMPLEADO') {
      throw new AppError("No se pueden asignar vehículos a usuarios con rol exclusivo de EMPLEADO", 403);
    }
    const model = await this.vehicleRepository.findModelWithDetails(data.modelId);
    
    if (!model) {
      throw new AppError("El modelo seleccionado no existe en la base de datos.", 404);
    }
   
    if (model.brand.id !== data.brandId) {
      throw new AppError("Marca y modelo no coinciden", 400);
    }

    const vehicleData = {
      ...data,               
      brand: data.brandId,   
      model: data.modelId,
      vehicleType: model.vehicleType.id,
      insurance: data.insuranceId,
      client: this.vehicleRepository.getUserReference(userId),
      isActive: true};

    return await this.vehicleRepository.add(vehicleData);
  }

  async update(id: string, data: any): Promise<Vehicle | null> {
    return await this.vehicleRepository.update(id, data);
  }

  async remove(id: string): Promise<boolean> {
    return await this.vehicleRepository.remove({ id });
  }

  async findActiveByUserId(userId: string): Promise<Vehicle[]> {
    return await this.vehicleRepository.findActiveByUserId(userId);
  }

}