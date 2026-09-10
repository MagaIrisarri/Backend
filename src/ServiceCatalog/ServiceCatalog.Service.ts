import { Repository } from "../Shared/base.Repository.js";
import { ServiceCatalog } from "./ServiceCatalog.Entity.js";

export class ServiceCatalogService {
  constructor(private repo: Repository<ServiceCatalog>) {}

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

  async remove(id: string): Promise<boolean> {
    return await this.repo.remove({ id });
  }
}