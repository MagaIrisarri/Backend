import { EntityManager } from '@mikro-orm/core';
import { ParkingPrice } from './ParkingPrice.Entity.js';
import { Parking } from '../Parking/Parking.Entity.js';
import { VehicleType } from '../Vehicle/VehicleType/VehicleType.Entity.js';
import { categorizeVehicleType, matchesVehicleType } from '../Shared/utils/vehicleTypes.js';
import { Repository } from '../Shared/base.Repository.js';

export class ParkingPriceRepository implements Repository<ParkingPrice> {
  constructor(private em: EntityManager) {}

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

  async findParking(parkingId: string): Promise<Parking | null> {
    return await this.em.findOne(Parking, { id: parkingId });
  }

  async findOfficialVehicleType(name: string): Promise<VehicleType | null> {
    const trimmed = (name || '').trim();
    if (!trimmed) return null;

    // 1. Buscar coincidencia exacta en el catálogo oficial cargado por el admin
    const all = await this.em.find(VehicleType, {});
    const exact = all.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (exact) return exact;

    // 2. Coincidencia semántica con tipos comunes
    const cat = categorizeVehicleType(trimmed);
    const semMatch = all.find((t) => categorizeVehicleType(t.name) === cat);
    if (semMatch) return semMatch;

    return null;
  }

  async expireActiveByVehicleType(parkingId: string, vehicleTypeName: string): Promise<void> {
    const activePrices = await this.em.find(
      ParkingPrice,
      {
        parking: { id: parkingId },
        expirationDate: null,
      }
    );

    const now = new Date();
    let updated = false;
    for (const p of activePrices) {
      if (matchesVehicleType(p.vehicleType, vehicleTypeName)) {
        p.expirationDate = now;
        updated = true;
      }
    }
    if (updated) {
      await this.em.flush();
    }
  }

  async findActive(parkingId: string, vehicleTypeName: string): Promise<ParkingPrice | null> {
    const activePrices = await this.em.find(
      ParkingPrice,
      {
        parking: { id: parkingId },
        expirationDate: null,
      },
      { populate: ['parking'] as any, orderBy: { startDate: 'DESC' } }
    );

    return activePrices.find((p) => matchesVehicleType(p.vehicleType, vehicleTypeName)) || null;
  }

  async findByParking(parkingId: string): Promise<ParkingPrice[]> {
    const prices = await this.em.find(
      ParkingPrice,
      { parking: { id: parkingId }, expirationDate: null },
      { populate: ['parking'] as any, orderBy: { startDate: 'DESC' } }
    );

    // Deduplicar respetando la tarifa más reciente de cada categoría
    const byType = new Map<string, ParkingPrice>();
    for (const p of prices) {
      const key = categorizeVehicleType(p.vehicleType);

      if (!byType.has(key)) {
        byType.set(key, p);
      }
    }
    return Array.from(byType.values());
  }
}