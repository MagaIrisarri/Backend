import { ParkingRepository } from './Parking.Repository.js';
import { Parking } from './Parking.Entity.js';
import { CreateParkingInput, UpdateParkingInput } from './Parking.Schema.js';

export class ParkingService {
  constructor(private repo: ParkingRepository) {}

  async createParking(data: CreateParkingInput): Promise<Parking> {
    return await this.repo.create(data);
  }

  async findAllParking(): Promise<Parking[]> {
    return await this.repo.findAll();
  }

  async findParkingById(id: string): Promise<Parking | null> {
    return await this.repo.findById(id);
  }

  async updateParking(id: string, data: UpdateParkingInput): Promise<Parking | null> {
    const parking = await this.repo.findById(id);
    if (!parking) return null;

    return await this.repo.update(parking, data);
  }

  async deleteParking(id: string): Promise<boolean> {
    const parking = await this.repo.findById(id);
    if (!parking) return false;

    await this.repo.deactivate(parking);
    return true;
  }
}