import { ParkingPriceRepository } from './ParkingPrice.Repository.js';
import { ParkingPrice } from './ParkingPrice.Entity.js';
import { AppError } from '../Shared/utils/AppError.js';

export class ParkingPriceService {
  constructor(private repo: ParkingPriceRepository) {}

  async create(parkingId: string, data: { vehicleType: string; price: number }): Promise<ParkingPrice> {
    const parking = await this.repo.findParking(parkingId);
    if (!parking) throw new AppError('Estacionamiento no encontrado', 404);

    const officialType = await this.repo.findOfficialVehicleType(data.vehicleType);
    const vehicleTypeName = officialType ? officialType.name : data.vehicleType.trim();

    // Expirar cualquier tarifa activa previa de este tipo oficial
    await this.repo.expireActiveByVehicleType(parkingId, vehicleTypeName);

    return await this.repo.add({ 
      parking, 
      vehicleType: vehicleTypeName, 
      price: data.price 
    });
  }

  // Modificar una tarifa vence la vigente y crea una versión nueva (fecha de vigencia): el historial no se pisa.
  async update(id: string, data: { price: number; vehicleType?: string }): Promise<ParkingPrice> {
    const current = await this.repo.findOne({ id });
    if (!current || current.expirationDate !== null) {
      throw new AppError('Tarifa no encontrada o inactiva', 404);
    }
    await this.repo.remove({ id });
    return await this.create(current.parking.id, { vehicleType: data.vehicleType ?? current.vehicleType, price: data.price });
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

  async findActive(parkingId: string, vehicleType: string): Promise<ParkingPrice | null> {
    return await this.repo.findActive(parkingId, vehicleType);
  }
}