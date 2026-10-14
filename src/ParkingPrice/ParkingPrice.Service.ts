import { ParkingPriceRepository } from './ParkingPrice.Repository.js';
import { ParkingPrice } from './ParkingPrice.Entity.js';
import { AppError } from '../Shared/utils/AppError.js';

export class ParkingPriceService {
  constructor(private repo: ParkingPriceRepository) {}

  // R-30: una tarifa por tipo de vehículo; la nueva vence la vigente de ese tipo (precios versionados).
  async create(parkingId: string, data: { vehicleTypeId: string; price: number }): Promise<ParkingPrice> {
    const parking = await this.repo.findParking(parkingId);
    if (!parking) throw new AppError('Estacionamiento no encontrado', 404);

    const vehicleType = await this.repo.findVehicleType(data.vehicleTypeId);
    if (!vehicleType) throw new AppError('Tipo de vehículo no encontrado o dado de baja', 404);

    await this.repo.expireActiveByVehicleType(parkingId, vehicleType.id);
    return await this.repo.add({ parking, vehicleType, price: data.price });
  }

  // Modificar una tarifa vence la vigente y crea una versión nueva (fecha de vigencia): el historial no se pisa.
  async update(id: string, data: { price: number }): Promise<ParkingPrice> {
    const current = await this.repo.findOne({ id });
    if (!current || current.expirationDate !== null) {
      throw new AppError('Tarifa no encontrada o inactiva', 404);
    }
    await this.repo.remove({ id });
    return await this.create(current.parking.id, { vehicleTypeId: current.vehicleType.id, price: data.price });
  }

  async findOne(id: string): Promise<ParkingPrice | null> {
    return await this.repo.findOne({ id });
  }

  async remove(id: string): Promise<boolean> {
    return await this.repo.remove({ id });
  }

  async findByParking(parkingId: string): Promise<ParkingPrice[]> {
    return await this.repo.findByParking(parkingId);
  }

  async findActive(parkingId: string, vehicleTypeId: string): Promise<ParkingPrice | null> {
    return await this.repo.findActive(parkingId, vehicleTypeId);
  }
}
