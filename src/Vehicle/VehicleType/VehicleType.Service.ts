import { VehicleTypeRepository } from './VehicleType.Repository.js';

export class VehicleTypeService {
  constructor(private readonly repository: VehicleTypeRepository) {}

  async findAll() {
    return await this.repository.findAll();
  }

  async create(data: any) {
    const vehicleType = this.repository.create(data);
    await this.repository.flush();
    return vehicleType;
  }

  async delete(id: string) {
    const vehicleType = await this.repository.findById(id);
    if (!vehicleType) return false;
    
    this.repository.remove(vehicleType);
    await this.repository.flush();
    return true;
  }
}