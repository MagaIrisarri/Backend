import { ParkingSpaceRepository } from './ParkingSpace.Repository.js';
import { ParkingSpace } from './ParkingSpace.Entity.js';
import { CreateParkingSpaceInput } from './ParkingSpace.Schema.js';

export class ParkingSpaceService {
  constructor(private repo: ParkingSpaceRepository) {}

  async createParkingSpace(
    parkingId: string,
    data: CreateParkingSpaceInput
  ): Promise<ParkingSpace> {
    const parking = await this.repo.findParking(parkingId);
    if (!parking) {
      throw new Error('Estacionamiento no encontrado o inactivo');
    }

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

    return await this.repo.create(parking, data.vehicleType, spaceCode);
  }

  async findSpacesByParking(parkingId: string): Promise<ParkingSpace[]> {
    const parking = await this.repo.findParking(parkingId);
    if (!parking) {
      throw new Error('Estacionamiento no encontrado o inactivo');
    }

    return await this.repo.findByParking(parking);
  }

  async findAvailableSpaces(parkingId: string): Promise<ParkingSpace[]> {
    const parking = await this.repo.findParking(parkingId);
    if (!parking) {
      throw new Error('Estacionamiento no encontrado o inactivo');
    }

    return await this.repo.findAvailable(parking);
  }

  async findAvailableSpacesByVehicleType(
    parkingId: string,
    vehicleType: string
  ): Promise<ParkingSpace[]> {
    const parking = await this.repo.findParking(parkingId);
    if (!parking) {
      throw new Error('Estacionamiento no encontrado o inactivo');
    }

    return await this.repo.findAvailable(parking, vehicleType);
  }

  async deleteParkingSpace(id: string): Promise<boolean> {
    const space = await this.repo.findById(id);
    if (!space) {
      return false;
    }

    await this.repo.deactivate(space);
    return true;
  }
}