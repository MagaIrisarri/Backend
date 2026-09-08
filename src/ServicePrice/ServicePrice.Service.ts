import { ServicePriceRepository } from './ServicePrice.Repository.js';
import { ServicePrice } from './ServicePrice.Entity.js';
import { AppError } from '../Shared/utils/AppError.js';

export class ServicePriceService {
  constructor(private repo: ServicePriceRepository) {}

  async findAll(): Promise<ServicePrice[]> {
    return await this.repo.findAll();
  }

  async findOne(id: string): Promise<ServicePrice | null> {
    return await this.repo.findOne({ id });
  }

  async create(parkingId: string, serviceCatalogId: string, price: number): Promise<ServicePrice> {
    const parking = await this.repo.findParking(parkingId);
    if (!parking) throw new AppError("Estacionamiento no encontrado", 400);

    const serviceCatalog = await this.repo.findServiceCatalog(serviceCatalogId);
    if (!serviceCatalog) throw new AppError("Servicio no encontrado", 400);

    const currentActivePrice = await this.repo.findActive(parkingId, serviceCatalogId);
    if (currentActivePrice) {
      await this.repo.remove({ id: currentActivePrice.id });
    }

    return await this.repo.add({ parking, serviceCatalog, price });
  }

  async findPricesByParking(parkingId: string): Promise<ServicePrice[]> {
    return await this.repo.findByParking(parkingId);
  }

  async findActivePrice(parkingId: string, serviceCatalogId: string): Promise<ServicePrice | null> {
    return await this.repo.findActive(parkingId, serviceCatalogId);
  }

  async remove(id: string): Promise<boolean> {
    return await this.repo.remove({ id });
  }
}