import { VehicleTypeRepository } from './VehicleType.Repository.js';
import { VehicleType } from './VehicleType.Entity.js';

export class VehicleTypeService {
  constructor(private readonly repository: VehicleTypeRepository) {}

  async findAll(): Promise<VehicleType[]> {
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<VehicleType | null> {
    return await this.repository.findOne({ id });
  }

  async create(data: any): Promise<VehicleType> {
    return await this.repository.add(data);
  }

  async update(id: string, data: any): Promise<VehicleType | null> {
    return await this.repository.update(id, data);
  }

  async remove(id: string): Promise<boolean> {
    return await this.repository.remove({ id });
  }
}