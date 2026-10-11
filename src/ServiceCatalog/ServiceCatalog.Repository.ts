import { EntityManager } from '@mikro-orm/core';
import { Repository } from '../Shared/base.Repository.js';
import { ServiceCatalog } from './ServiceCatalog.Entity.js';
import { ServicePrice } from '../ServicePrice/ServicePrice.Entity.js';

export class ServiceCatalogRepository implements Repository<ServiceCatalog> {
  constructor(private em: EntityManager) {}

  async findAll(): Promise<ServiceCatalog[]> {
    return await this.em.find(ServiceCatalog, { isActive: true });
  }

  async findOne(item: { id: string }): Promise<ServiceCatalog | null> {
    return await this.em.findOne(ServiceCatalog, { id: item.id, isActive: true });
  }

  async add(item: Partial<ServiceCatalog>): Promise<ServiceCatalog> {
    const serviceCatalog = this.em.create(ServiceCatalog, item as any);
    await this.em.flush();
    return serviceCatalog;
  }

  async update(id: string, item: Partial<ServiceCatalog>): Promise<ServiceCatalog | null> {
    const serviceCatalog = await this.em.findOne(ServiceCatalog, { id, isActive: true });
    if (!serviceCatalog) return null;

    this.em.assign(serviceCatalog, item);
    await this.em.flush();
    return serviceCatalog;
  }

  // Un servicio dado de baja deja de ofrecerse: en la misma transacción vencen sus precios vigentes en todas las cocheras.
  async remove(item: { id: string }): Promise<boolean> {
    return await this.em.transactional(async (em) => {
      const serviceCatalog = await em.findOne(ServiceCatalog, { id: item.id, isActive: true });
      if (!serviceCatalog) return false;
      serviceCatalog.isActive = false;
      await em.nativeUpdate(ServicePrice, { serviceCatalog: { id: item.id }, expirationDate: null }, { expirationDate: new Date() });
      return true;
    });
  }
}