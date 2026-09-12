import { EntityManager } from '@mikro-orm/core';
import { ParkingPrice } from './ParkingPrice.Entity.js';
import { Parking } from '../Parking/Parking.Entity.js';
import { VehicleType } from '../Vehicle/VehicleType/VehicleType.Entity.js';
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

    // 3. Coincidencia semántica con tipos comunes
    const trimmedUpper = trimmed.toUpperCase();
    if (trimmedUpper.includes('CAMION') || trimmedUpper.includes('UTIL') || trimmedUpper.includes('PICK')) {
      const truckMatch = all.find((t) => {
        const u = t.name.toUpperCase();
        return u.includes('UTIL') || u.includes('CAMION') || u.includes('PICK');
      });
      if (truckMatch) return truckMatch;
    }
    if (trimmedUpper.includes('MOTO')) {
      const motoMatch = all.find((t) => t.name.toUpperCase().includes('MOTO'));
      if (motoMatch) return motoMatch;
    }
    if (trimmedUpper.includes('AUTO') || trimmedUpper.includes('CAR')) {
      const autoMatch = all.find((t) => t.name.toUpperCase().includes('AUTO') || t.name.toUpperCase().includes('CAR'));
      if (autoMatch) return autoMatch;
    }

    return null;
  }

  private matchesType(typeA: string, typeB: string): boolean {
    const a = (typeA || '').trim().toLowerCase();
    const b = (typeB || '').trim().toLowerCase();
    if (a === b) return true;
    if ((a.includes('moto') || a.includes('bici')) && (b.includes('moto') || b.includes('bici'))) return true;
    if (
      (a.includes('camion') || a.includes('util') || a.includes('van') || a.includes('pick') || a.includes('suv')) &&
      (b.includes('camion') || b.includes('util') || b.includes('van') || b.includes('pick') || b.includes('suv'))
    ) return true;
    if ((a.includes('auto') || a.includes('car')) && (b.includes('auto') || b.includes('car'))) return true;
    return false;
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
      if (this.matchesType(p.vehicleType, vehicleTypeName)) {
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

    return activePrices.find((p) => this.matchesType(p.vehicleType, vehicleTypeName)) || null;
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
      // Determinar clave canónica para deduplicar histórico (ej: 'auto', 'moto', 'camioneta')
      const lower = p.vehicleType.toLowerCase();
      let key = lower;
      if (lower.includes('moto') || lower.includes('bici')) key = 'moto';
      else if (lower.includes('camion') || lower.includes('util') || lower.includes('van') || lower.includes('pick')) key = 'camioneta';
      else if (lower.includes('auto') || lower.includes('car')) key = 'auto';

      if (!byType.has(key)) {
        byType.set(key, p);
      }
    }
    return Array.from(byType.values());
  }
}