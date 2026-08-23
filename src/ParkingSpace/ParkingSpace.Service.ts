import { ParkingSpaceRepository } from './ParkingSpace.Repository.js';
import { ParkingSpace } from './ParkingSpace.Entity.js';
import { CreateParkingSpaceInput } from './ParkingSpace.Schema.js';

export class ParkingSpaceService {
  constructor(private repo: ParkingSpaceRepository) {}
  
  async findAll(): Promise<ParkingSpace[]> {
    return await this.repo.findAll();
  }

  async findOne(id: string): Promise<ParkingSpace | null> {
    return await this.repo.findOne({ id });
  }

  async create(parkingId: string, data: CreateParkingSpaceInput): Promise<ParkingSpace> {
    const parking = await this.repo.findParking(parkingId);
    if (!parking) throw new Error('Estacionamiento no encontrado o inactivo');

    const spacesCount = await this.repo.countActiveSpacesByType(parking, data.vehicleType);

    if (data.vehicleType === 'AUTO' && spacesCount >= (parking.carCapacity ?? 0)) {
      throw new Error('Capacidad máxima de autos alcanzada');
    }

    if (data.vehicleType === 'MOTOCICLETA' && spacesCount >= (parking.motorcycleCapacity ?? 0)) {
      throw new Error('Capacidad máxima de motocicletas alcanzada');
    }

    const prefix = data.vehicleType === 'AUTO' ? 'A' : 'M';
    let number = 1;
    let spaceCode = `${prefix}-${String(number).padStart(2, '0')}`;

    while (await this.repo.findBySpaceCode(parking, spaceCode)) {
      number++;
      spaceCode = `${prefix}-${String(number).padStart(2, '0')}`;
    }

    return await this.repo.add({ parking, vehicleType: data.vehicleType, spaceCode });
  }

  async remove(id: string): Promise<boolean> {
    return await this.repo.remove({ id });
  }

  async findByParking(parkingId: string): Promise<ParkingSpace[]> {
    const parking = await this.repo.findParking(parkingId);
    if (!parking) throw new Error('Estacionamiento no encontrado o inactivo');

    return await this.repo.findByParking(parking);
  }

  async findAvailable(parkingId: string): Promise<ParkingSpace[]> {
    const parking = await this.repo.findParking(parkingId);
    if (!parking) throw new Error('Estacionamiento no encontrado o inactivo');

    return await this.repo.findAvailable(parking);
  }

  async findAvailableByVehicleType(parkingId: string, vehicleType: string): Promise<ParkingSpace[]> {
    const parking = await this.repo.findParking(parkingId);
    if (!parking) throw new Error('Estacionamiento no encontrado o inactivo');

    return await this.repo.findAvailable(parking, vehicleType);
  }
}