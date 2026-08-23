import { BrandRepository } from './Brand.Repository.js';
import { Brand } from './Brand.Entity.js';

export class BrandService {
  constructor(private brandRepository: BrandRepository) {}

  async findAll(): Promise<Brand[]> {
    return await this.brandRepository.findAll();
  }

  async findOne(id: string): Promise<Brand | null> {
    return await this.brandRepository.findOne({ id });
  }

  async create(data: { name: string }): Promise<Brand> {
    return await this.brandRepository.add(data);
  }

  async update(id: string, data: any): Promise<Brand | null> {
    return await this.brandRepository.update(id, data);
  }

  async remove(id: string): Promise<boolean> {
    return await this.brandRepository.remove({ id });
  }
}