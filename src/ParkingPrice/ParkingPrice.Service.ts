import { ParkingPriceRepository } from './ParkingPrice.Repository.js';
import { ParkingPrice } from './ParkingPrice.Entity.js';

export class ParkingPriceService {
  constructor(private repo: ParkingPriceRepository) {}

  async createParkingPrice(
    parkingId: string,
    data: { vehicleType: string; price: number }
  ): Promise<ParkingPrice> {
    const parking = await this.repo.findParking(parkingId);
    if (!parking) {
      throw new Error('Estacionamiento no encontrado o inactivo');
    }

    const currentActivePrice = await this.repo.findActive(parkingId, data.vehicleType);
    if (currentActivePrice) {
      await this.repo.deactivate(currentActivePrice);
    }

    return await this.repo.create(parking, data.vehicleType, data.price);
  }

  async findPricesByParking(parkingId: string): Promise<ParkingPrice[]> {
    return await this.repo.findByParking(parkingId);
  }

  async findActivePrice(parkingId: string, vehicleType: string): Promise<ParkingPrice | null> {
    return await this.repo.findActive(parkingId, vehicleType);
  }

  async findPrice(id: string): Promise<ParkingPrice | null> {
    return await this.repo.findById(id);
  }

  async deactivatePrice(id: string): Promise<boolean> {
    const price = await this.repo.findById(id);
    if (!price || price.expirationDate !== null) {
      return false;
    }

    await this.repo.deactivate(price);
    return true;
  }
}