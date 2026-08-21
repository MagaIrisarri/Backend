import { InsuranceRepository } from './Insurance.Repository.js';
import { Insurance } from './Insurance.Entity.js';

export class InsuranceService {
  constructor(private insuranceRepository: InsuranceRepository) {}

  async findAll(): Promise<Insurance[]> {
    return await this.insuranceRepository.findAll();
  }

  async create(data: { name: string }): Promise<Insurance> {
    return await this.insuranceRepository.create(data);
  }

  async delete(id: string): Promise<boolean> {
    return await this.insuranceRepository.delete(id);
  }
}