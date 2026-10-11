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
    await this.assertPlateFree(data.plate);
    const model = await this.resolveModel(data.brandId, data.modelId);

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

  private async assertPlateFree(plate: string, exceptId?: string): Promise<void> {
    const other = await this.vehicleRepository.findActiveByPlate(plate);
    if (other && other.id !== exceptId) throw new AppError(`Ya hay un vehículo activo con la patente ${plate}`, 409);
  }

  private async resolveModel(brandId: string, modelId: string) {
    const model = await this.vehicleRepository.findModelWithDetails(modelId);
    if (!model) {
      throw new AppError("El modelo seleccionado no existe en la base de datos.", 404);
    }
    if (model.brand.id !== brandId) {
      throw new AppError("Marca y modelo no coinciden", 400);
    }
    return model;
  }

  async update(id: string, data: any): Promise<Vehicle | null> {
    const vehicle = await this.vehicleRepository.findOne({ id });
    if (!vehicle) return null;

    const { brandId, modelId, insuranceId, ...changes } = data;
    if (changes.plate !== undefined) await this.assertPlateFree(changes.plate, id);
    if (brandId !== undefined || modelId !== undefined) {
      const model = await this.resolveModel(brandId ?? vehicle.brand.id, modelId ?? vehicle.model.id);
      // R-25: la plaza de una reserva activa es del tipo del vehículo; cambiarlo la dejaría en una plaza incompatible.
      if (model.vehicleType.id !== vehicle.vehicleType.id && await this.vehicleRepository.countActiveReservations(id)) {
        throw new AppError("No se puede cambiar el tipo de un vehículo con reservas pendientes, confirmadas o en curso", 400);
      }
      Object.assign(changes, { brand: model.brand, model, vehicleType: model.vehicleType });
    }
    if (insuranceId !== undefined) changes.insurance = insuranceId;

    return await this.vehicleRepository.update(id, changes);
  }

  // Como R-20: un vehículo con reservas pendientes, confirmadas o en curso no se da de baja.
  async remove(id: string): Promise<boolean> {
    const n = await this.vehicleRepository.countActiveReservations(id);
    if (n) throw new AppError(`No se puede dar de baja: el vehículo tiene ${n} reserva(s) pendiente(s), confirmada(s) o en curso. Cancelalas o esperá a que terminen.`, 409);
    return await this.vehicleRepository.remove({ id });
  }

  async findActiveByUserId(userId: string): Promise<Vehicle[]> {
    return await this.vehicleRepository.findActiveByUserId(userId);
  }

}