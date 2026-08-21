import { BrandRepository } from './Brand.Repository.js';
import { Brand } from './Brand.Entity.js';

export class BrandService {
  constructor(private brandRepository: BrandRepository) {}

  async findAll(): Promise<Brand[]> {
    return await this.brandRepository.findAll();
  }

  async create(data: { name: string }): Promise<Brand> {
    return await this.brandRepository.create(data);
  }

  async delete(id: string): Promise<boolean> {
    return await this.brandRepository.delete(id);
  }
}