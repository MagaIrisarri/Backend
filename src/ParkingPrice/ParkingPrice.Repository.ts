import { EntityManager } from '@mikro-orm/core';
import { ParkingPrice } from './ParkingPrice.Entity.js';
import { Parking } from '../Parking/Parking.Entity.js';
import { Repository } from '../Shared/base.Repository.js';

export class ParkingPriceRepository implements Repository<ParkingPrice> {
  constructor(private em: EntityManager) {}

  // --- Métodos de la Interfaz Genérica ---

  async findAll(): Promise<ParkingPrice[]> {
    return await this.em.find(ParkingPrice, {}, { populate: ['parking'] as any });
  }

  async findOne(item: { id: string }): Promise<ParkingPrice | null> {
    return await this.em.findOne(
      ParkingPrice,
      { id: item.id },
      { populate: ['parking'] as any }
    );
  }

  async add(data: any): Promise<ParkingPrice> {
    const newPrice = this.em.create(ParkingPrice, {
      price: data.price,
      vehicleType: data.vehicleType,
      parking: data.parking,
      expirationDate: null,
      startDate: new Date(),
    });
    await this.em.flush();
    return newPrice;
  }

  async update(id: string, data: any): Promise<ParkingPrice | null> {
    const price = await this.findOne({ id });
    if (!price) return null;

    this.em.assign(price, data);
    await this.em.flush();
    return price;
  }

  async remove(item: { id: string }): Promise<boolean> {
    const price = await this.findOne({ id: item.id });
    if (!price || price.expirationDate !== null) return false;

    price.expirationDate = new Date();
    await this.em.flush();
    return true;
  }

  // --- Métodos Específicos del Negocio ---

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
}