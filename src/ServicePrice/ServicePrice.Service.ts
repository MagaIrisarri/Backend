import { ServicePriceRepository } from './ServicePrice.Repository.js';
import { ServicePrice } from './ServicePrice.Entity.js';

export class ServicePriceService {
  constructor(private repo: ServicePriceRepository) {}

  async createServicePrice(parkingId: string, serviceCatalogId: string, price: number): Promise<ServicePrice> {
    const parking = await this.repo.findParking(parkingId);
    if (!parking) throw new Error("Estacionamiento no encontrado o inactivo");

    const serviceCatalog = await this.repo.findServiceCatalog(serviceCatalogId);
    if (!serviceCatalog) throw new Error("Servicio no encontrado o inactivo");

    const currentActivePrice = await this.repo.findActive(parkingId, serviceCatalogId);
    if (currentActivePrice) {
      await this.repo.deactivate(currentActivePrice);
    }

    return await this.repo.create(parking, serviceCatalog, price);
  }

  async findPricesByParking(parkingId: string): Promise<ServicePrice[]> {
    return await this.repo.findByParking(parkingId);
  }

  async findActivePrice(parkingId: string, serviceCatalogId: string): Promise<ServicePrice | null> {
    return await this.repo.findActive(parkingId, serviceCatalogId);
  }

  async findById(id: string): Promise<ServicePrice | null> {
    return await this.repo.findById(id);
  }

  async deactivatePrice(id: string): Promise<boolean> {
    const price = await this.repo.findById(id);
    if (!price || price.expirationDate !== null) return false;

    await this.repo.deactivate(price);
    return true;
  }
}