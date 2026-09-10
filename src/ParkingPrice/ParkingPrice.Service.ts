import { ParkingPriceRepository } from './ParkingPrice.Repository.js';
import { ParkingPrice } from './ParkingPrice.Entity.js';
import { AppError } from '../Shared/utils/AppError.js';

export class ParkingPriceService {
  constructor(private repo: ParkingPriceRepository) {}

  async create(parkingId: string, data: { vehicleType: string; price: number }): Promise<ParkingPrice> {
    const parking = await this.repo.findParking(parkingId);
    if (!parking) throw new AppError('Estacionamiento no encontrado o inactivo', 400);

    const currentActivePrice = await this.repo.findActive(parkingId, data.vehicleType);
    if (currentActivePrice) {
      await this.repo.remove({ id: currentActivePrice.id });
    }

    return await this.repo.add({ 
      parking, 
      vehicleType: data.vehicleType, 
      price: data.price 
    });
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