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
}
