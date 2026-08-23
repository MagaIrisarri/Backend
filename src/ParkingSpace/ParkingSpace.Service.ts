import { ParkingSpaceRepository } from "./ParkingSpace.Repository.js";
import { ParkingSpace, SpaceState } from "./ParkingSpace.Entity.js";
import { ParkingRepository } from "../Parking/Parking.Repository.js";

export class ParkingSpaceService {
  constructor(
    private spaceRepo: ParkingSpaceRepository,
    private parkingRepo: ParkingRepository
  ) {}

  async findByParking(parkingId: string): Promise<ParkingSpace[]> {
    return await this.spaceRepo.findByParking(parkingId);
  }

  async findAvailable(parkingId: string, vehicleType?: string): Promise<ParkingSpace[]> {
    return await this.spaceRepo.findAvailableByParking(parkingId, vehicleType);
  }

  async findOne(id: string): Promise<ParkingSpace | null> {
    return await this.spaceRepo.findOne({ id });
  }

  async create(parkingId: string, data: { spaceCode: string; vehicleType: string }): Promise<ParkingSpace> {
    const parking = await this.parkingRepo.findOne({ id: parkingId });
    if (!parking) throw new Error("Estacionamiento no encontrado o inactivo");

    return await this.spaceRepo.add({
      ...data,
      state: SpaceState.LIBRE,
      parking,
    });
  }

  async createBulkManual(
    parkingId: string, 
    data: { vehicleType: string; count: number }
  ): Promise<void> {
    const parking = await this.parkingRepo.findOne({ id: parkingId });
    if (!parking) throw new Error("Estacionamiento no encontrado o inactivo");

    const existingSpaces = await this.spaceRepo.findByParking(parkingId);
    const spacesOfSameType = existingSpaces.filter(
      (s) => s.vehicleType.toUpperCase() === data.vehicleType.toUpperCase()
    );

    const prefixMap: Record<string, string> = {
      AUTO: 'A',
      MOTOCICLETA: 'M',
      CAMIONETA: 'C',
    };
    const prefix = prefixMap[data.vehicleType.toUpperCase()] || data.vehicleType.charAt(0).toUpperCase();

    const startNumber = spacesOfSameType.length + 1;

    const spacesToCreate: Partial<ParkingSpace>[] = [];
    for (let i = 0; i < data.count; i++) {
      spacesToCreate.push({
        spaceCode: `${prefix}-${String(startNumber + i).padStart(2, '0')}`,
        vehicleType: data.vehicleType,
        state: SpaceState.LIBRE,
        parking,
      });
    }

    await this.spaceRepo.createBulk(spacesToCreate);
  }

  async update(id: string, data: Partial<ParkingSpace>): Promise<ParkingSpace | null> {
    return await this.spaceRepo.update(id, data);
  }

  async remove(id: string): Promise<boolean> {
    return await this.spaceRepo.remove({ id });
  }
}