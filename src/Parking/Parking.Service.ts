import { Parking } from './Parking.Entity.js';
import { ParkingRepository } from './Parking.Repository.js';
import { ParkingSpace, SpaceState } from '../ParkingSpace/ParkingSpace.Entity.js';
import { ParkingSpaceRepository } from '../ParkingSpace/ParkingSpace.Repository.js';
import { CreateParkingInput } from './Parking.Schema.js';

export class ParkingService {
  constructor(
    private readonly parkingRepository: ParkingRepository,
    private readonly parkingSpaceRepository: ParkingSpaceRepository
  ) {}

  async findAll(): Promise<Parking[]> {
     return await this.parkingRepository.findAll();
}

    async findActive(): Promise<Parking[]> {
    const Parkings = await this.parkingRepository.findAll();
    const ParkingsActive: Parking[] = [];
    for(let i=0; i < Parkings.length; i++){
      if (Parkings[i].isActive)
        ParkingsActive.push(Parkings[i])
    }
    return ParkingsActive;
  }

  async findOne(id: string): Promise<Parking | null> {
    return await this.parkingRepository.findOne({ id });
  }

  async create(data: CreateParkingInput): Promise<Parking> {
    const owner = await this.parkingRepository.getUserById(data.ownerId);
    if (!owner || owner.status !== 'ACTIVO') {
      throw new Error("Dueño no encontrado o inactivo");
    }

    if (owner.type !== 'DUEÑO') {
      throw new Error("Solo los usuarios con rol DUEÑO pueden crear estacionamientos");
    }

    const { ownerId, ...parkingData } = data;
    const parking = await this.parkingRepository.add({
      ...parkingData,
      owner,
    });

    const spacesToCreate: Partial<ParkingSpace>[] = [];

    for (let i = 1; i <= (parking.carCapacity ?? 0); i++) {
      spacesToCreate.push({
        spaceCode: `A-${String(i).padStart(2, '0')}`,
        vehicleType: 'AUTO',
        state: SpaceState.LIBRE,
        parking,
      });
    }

    for (let i = 1; i <= (parking.motorcycleCapacity ?? 0); i++) {
      spacesToCreate.push({
        spaceCode: `M-${String(i).padStart(2, '0')}`,
        vehicleType: 'MOTOCICLETA',
        state: SpaceState.LIBRE,
        parking,
      });
    }

    if (spacesToCreate.length > 0) {
      await this.parkingSpaceRepository.createBulk(spacesToCreate);
    }

    return parking;
  }

  async update(id: string, data: any): Promise<Parking | null> {
    return await this.parkingRepository.update(id, data);
  }

  async remove(id: string): Promise<boolean> {
    return await this.parkingRepository.remove({ id });
  }



}