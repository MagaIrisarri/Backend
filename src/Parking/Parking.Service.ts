import { ParkingRepository } from './Parking.Repository.js';
import { Parking } from './Parking.Entity.js';
import { CreateParkingInput, UpdateParkingInput } from './Parking.Schema.js';

export class ParkingService {
  constructor(private repo: ParkingRepository) {}

  async create(data: CreateParkingInput): Promise<Parking> {
    return await this.repo.add(data);
  }

  async findAll(): Promise<Parking[]> {
    return await this.repo.findAll();
  }

  async findOne(id: string): Promise<Parking | null> {
    return await this.repo.findOne({ id }); 
  }

  async update(id: string, data: UpdateParkingInput): Promise<Parking | null> {
    return await this.repo.update(id, data);
  }

  async remove(id: string): Promise<boolean> {
    // Delegamos directo al repo pasando el formato de objeto
    return await this.repo.remove({ id });
  }
}