import { ServiceCatalogRepository } from "./ServiceCatalog.Repository.js";
import { ServiceCatalog } from "./ServiceCatalog.Entity.js";
import { assertNoActiveReservations } from "../ServicePrice/ServicePrice.Service.js";

export class ServiceCatalogService {
  constructor(private repo: ServiceCatalogRepository) {}

  async findAll(): Promise<ServiceCatalog[]> {
    return await this.repo.findAll();
  }

  async findOne(id: string): Promise<ServiceCatalog | null> {
    return await this.repo.findOne({ id });
  }

  async create(input: Partial<ServiceCatalog>): Promise<ServiceCatalog> {
    return await this.repo.add(input);
  }

  async update(id: string, input: Partial<ServiceCatalog>): Promise<ServiceCatalog | null> {
    return await this.repo.update(id, input);
  }

  // La baja del catálogo vence el servicio en todas las sucursales: no con reservas pendientes o en curso que lo tienen.
  async remove(id: string): Promise<boolean> {
    const service = await this.repo.findOne({ id });
    if (service) assertNoActiveReservations(service.name, await this.repo.activeReservationsUsing(id));
    return await this.repo.remove({ id });
  }
}
