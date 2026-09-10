import { InsuranceRepository } from './Insurance.Repository.js';
import { Insurance } from './Insurance.Entity.js';

export class InsuranceService {
  constructor(private insuranceRepository: InsuranceRepository) {}

  async findAll(): Promise<Insurance[]> {
    return await this.insuranceRepository.findAll();
  }

  async findOne(id: string): Promise<Insurance | null> {
    return await this.insuranceRepository.findOne({ id });
  }

  async create(data: { name: string }): Promise<Insurance> {
    return await this.insuranceRepository.add(data);
  }

  async update(id: string, data: { name?: string }): Promise<Insurance | null> {
    return await this.insuranceRepository.update(id, data);
  }

  async remove(id: string): Promise<boolean> {
    return await this.insuranceRepository.remove({ id });
  }
}