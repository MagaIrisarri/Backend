import { EntityManager } from '@mikro-orm/core';
import { ParkingPrice } from './ParkingPrice.Entity.js';
import { Parking } from '../Parking/Parking.Entity.js';
import { VehicleType } from '../Vehicle/VehicleType/VehicleType.Entity.js';
import { Repository } from '../Shared/base.Repository.js';

// R-30: las tarifas van por el id del tipo de vehículo, no por su nombre ni su categoría.
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

  async findVehicleType(id: string): Promise<VehicleType | null> {
    return await this.em.findOne(VehicleType, { id, isActive: true });
  }

  async expireActiveByVehicleType(parkingId: string, vehicleTypeId: string): Promise<void> {
    const active = await this.em.find(ParkingPrice, { parking: { id: parkingId }, vehicleType: vehicleTypeId, expirationDate: null });
    if (!active.length) return;
    const now = new Date();
    for (const p of active) p.expirationDate = now;
    await this.em.flush();
  }

  async findActive(parkingId: string, vehicleTypeId: string): Promise<ParkingPrice | null> {
    return await this.em.findOne(
      ParkingPrice,
      { parking: { id: parkingId }, vehicleType: vehicleTypeId, expirationDate: null },
      { populate: ['parking'] as any, orderBy: { startDate: 'DESC' } }
    );
  }

  // Tarifa para cobrar la salida (R-14): la vigente o, si el dueño la dio de baja con el vehículo adentro, la última que tuvo ese tipo.
  async findForCheckout(parkingId: string, vehicleTypeId: string): Promise<ParkingPrice | null> {
    const active = await this.findActive(parkingId, vehicleTypeId);
    if (active) return active;
    return await this.em.findOne(ParkingPrice, { parking: { id: parkingId }, vehicleType: vehicleTypeId },
      { orderBy: { expirationDate: 'DESC', startDate: 'DESC' } });
  }

  // Las vigentes de la cochera, una por tipo (la más reciente si quedó más de una).
  async findByParking(parkingId: string): Promise<ParkingPrice[]> {
    const prices = await this.em.find(
      ParkingPrice,
      { parking: { id: parkingId }, expirationDate: null },
      { populate: ['parking'] as any, orderBy: { startDate: 'DESC' } }
    );
    const byType = new Map<string, ParkingPrice>();
    for (const p of prices) if (!byType.has(p.vehicleType.id)) byType.set(p.vehicleType.id, p);
    return Array.from(byType.values());
  }
}
