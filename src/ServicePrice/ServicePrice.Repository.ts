import { EntityManager } from '@mikro-orm/core';
import { ServicePrice } from './ServicePrice.Entity.js';
import { Parking } from '../Parking/Parking.Entity.js';
import { ServiceCatalog } from '../ServiceCatalog/ServiceCatalog.Entity.js';
import { Repository } from '../Shared/base.Repository.js';
import { Reservation } from '../Reservation/Reservation.Entity.js';
import { ACTIVE_RESERVATION_STATUSES } from '../Shared/constants/status.js';

// Reservas pendientes o en curso que tienen el servicio: el precio de una sucursal o, con `catalogId`, el servicio en cualquiera.
// La usan las dos bajas (precio y catálogo) para rechazarlas con 409.
export function activeReservationsUsing(em: EntityManager, by: { priceId: string } | { catalogId: string }): Promise<Reservation[]> {
  const services = 'priceId' in by ? { id: by.priceId } : { serviceCatalog: { id: by.catalogId } };
  return em.find(Reservation, { services, status: { $in: [...ACTIVE_RESERVATION_STATUSES] } },
    { populate: ['parkingSpace.parking'] as any, orderBy: { startTime: 'ASC' } });
}

export class ServicePriceRepository implements Repository<ServicePrice> {
  constructor(private em: EntityManager) {}

  activeReservationsUsing(priceId: string): Promise<Reservation[]> {
    return activeReservationsUsing(this.em, { priceId });
  }

  async findAll(): Promise<ServicePrice[]> {
    return await this.em.find( ServicePrice, {},
      { populate: ['serviceCatalog', 'parking']});
  }

  async findOne(item: { id: string }): Promise<ServicePrice | null> {
    return await this.em.findOne( ServicePrice, { id: item.id },
      { populate: ['serviceCatalog', 'parking'] });
  }

  async add(data: any): Promise<ServicePrice> {
    const newPrice = this.em.create(ServicePrice,
      { price: data.price,
        parking: data.parking,
        serviceCatalog: data.serviceCatalog,
        expirationDate: null,
        startDate: new Date()});
    await this.em.flush();
    return newPrice;
  }

  async update(id: string, data: any): Promise<ServicePrice | null> {
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

  async findServiceCatalog(serviceCatalogId: string): Promise<ServiceCatalog | null> {
    return await this.em.findOne(ServiceCatalog, { id: serviceCatalogId, isActive: true });
  }

  async findActive(parkingId: string, serviceCatalogId: string): Promise<ServicePrice | null> {
    return await this.em.findOne(ServicePrice,
      { parking: { id: parkingId },
        serviceCatalog: { id: serviceCatalogId },
        expirationDate: null,},
      { populate: ['serviceCatalog', 'parking']}
    );
  }

  async findByParking(parkingId: string): Promise<ServicePrice[]> {
    return await this.em.find(
      ServicePrice,
      { parking: { id: parkingId }, expirationDate: null },
      { populate: ['serviceCatalog', 'parking'] }
    );
  }
}