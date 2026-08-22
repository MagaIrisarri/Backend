import { EntityManager } from '@mikro-orm/core';
import { ServicePrice } from './ServicePrice.Entity.js';
import { Parking } from '../Parking/Parking.Entity.js';
import { ServiceCatalog } from '../ServiceCatalog/ServiceCatalog.Entity.js';

export class ServicePriceRepository {
  constructor(private em: EntityManager) {}

  async findParking(parkingId: string): Promise<Parking | null> {
    return await this.em.findOne(Parking, { id: parkingId, isActive: true });
  }

  async findServiceCatalog(serviceCatalogId: string): Promise<ServiceCatalog | null> {
    return await this.em.findOne(ServiceCatalog, { id: serviceCatalogId, isActive: true });
  }

  async findActive(parkingId: string, serviceCatalogId: string): Promise<ServicePrice | null> {
    return await this.em.findOne(
      ServicePrice,
      {
        parking: { id: parkingId },
        serviceCatalog: { id: serviceCatalogId },
        expirationDate: null,
      },
      { populate: ['serviceCatalog', 'parking'] as any }
    );
  }

  async findByParking(parkingId: string): Promise<ServicePrice[]> {
    return await this.em.find(
      ServicePrice,
      { parking: { id: parkingId } },
      { populate: ['serviceCatalog', 'parking'] as any }
    );
  }

  async findById(id: string): Promise<ServicePrice | null> {
    return await this.em.findOne(
      ServicePrice,
      { id },
      { populate: ['serviceCatalog', 'parking'] as any }
    );
  }

  async create(parking: Parking, serviceCatalog: ServiceCatalog, price: number): Promise<ServicePrice> {
    const newPrice = this.em.create(ServicePrice, {
      price,
      parking,
      serviceCatalog,
      expirationDate: null,
      startDate: new Date(),
    });
    await this.em.flush();
    return newPrice;
  }

  async deactivate(price: ServicePrice): Promise<void> {
    price.expirationDate = new Date();
    await this.em.flush();
  }
}