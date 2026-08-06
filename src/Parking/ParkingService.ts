import { Parking } from "./ParkingEntity.js";
import { CreateParkingDto, ParkingIdDto, UpdateParkingDto } from "./ParkingDto.js";

export class ParkingService {
  private parkings: Parking[] = [];

  async createParking(data: CreateParkingDto): Promise<Parking> {
    const newParking = new Parking(
      data.id,
      data.locality,
      data.postalCode,
      data.address,
      data.carCapacity,
      data.motorcycleCapacity
    );
    this.parkings.push(newParking);
    return newParking;
  }

  async findAllParking(): Promise<Parking[] | null> {
    return this.parkings.length > 0 ? this.parkings : null;
  }

  async findParkingById(id: ParkingIdDto): Promise<Parking | null> {
    return this.parkings.find(p => p.id === id.id) ?? null;
  }

  async updateParking(id: ParkingIdDto, data: UpdateParkingDto): Promise<Parking | null> {
    const index = this.parkings.findIndex(p => p.id === id.id);
    if(index !== -1) {
      this.parkings[index] = { ...this.parkings[index], ...data };
      return this.parkings[index];
    }
    return null;
  }

  async deleteParking(id: ParkingIdDto): Promise<boolean> {
    const index = this.parkings.findIndex(p => p.id === id.id);
    if (index !== -1) {
      this.parkings.splice(index, 1);
      return true;
    }
    return false;
  }

}