import { EntityManager } from '@mikro-orm/core';
import { ParkingPrice } from './ParkingPrice.Entity.js';
import { Parking } from '../Parking/Parking.Entity.js';

export class ParkingPriceRepository {
  constructor(private em: EntityManager) {}

  async findParking(parkingId: string): Promise<Parking | null> {
    return await this.em.findOne(Parking, { id: parkingId, isActive: true });
  }

  async findActive(parkingId: string, vehicleType: string): Promise<ParkingPrice | null> {
    return await this.em.findOne(
      ParkingPrice,
      {
        parking: { id: parkingId },
        vehicleType,
        expirationDate: null,
      },
      { populate: ['parking'] as any }
    );
  }

  async findByParking(parkingId: string): Promise<ParkingPrice[]> {
    return await this.em.find(
      ParkingPrice,
      { parking: { id: parkingId } },
      { populate: ['parking'] as any }
    );
  }

  async findById(id: string): Promise<ParkingPrice | null> {
    return await this.em.findOne(
      ParkingPrice,
      { id },
      { populate: ['parking'] as any }
    );
  }

  async create(parking: Parking, vehicleType: string, price: number): Promise<ParkingPrice> {
    const newPrice = this.em.create(ParkingPrice, {
      price,
      vehicleType,
      parking,
      expirationDate: null,
      startDate: new Date(),
    });
    await this.em.flush();
    return newPrice;
  }

  async deactivate(price: ParkingPrice): Promise<void> {
    price.expirationDate = new Date();
    await this.em.flush();
  }
}