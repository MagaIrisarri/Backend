import { EntityManager } from '@mikro-orm/core';
import { ParkingSpace } from './ParkingSpace.Entity.js';
import { Parking } from '../Parking/Parking.Entity.js';

export class ParkingSpaceRepository {
  constructor(private em: EntityManager) {}

  async findParking(parkingId: string): Promise<Parking | null> {
    return await this.em.findOne(Parking, { id: parkingId, isActive: true });
  }

  async countActiveSpacesByType(parking: Parking, vehicleType: string): Promise<number> {
    return await this.em.count(ParkingSpace, {
      parking,
      vehicleType,
      state: { $ne: 'BAJA' },
    });
  }

  async findBySpaceCode(parking: Parking, spaceCode: string): Promise<ParkingSpace | null> {
    return await this.em.findOne(ParkingSpace, {
      parking,
      spaceCode,
      state: { $ne: 'BAJA' },
    });
  }

  async findByParking(parking: Parking): Promise<ParkingSpace[]> {
    return await this.em.find(ParkingSpace, {
      parking,
      state: { $ne: 'BAJA' },
    });
  }

  async findAvailable(parking: Parking, vehicleType?: string): Promise<ParkingSpace[]> {
    const query: Record<string, any> = {
      parking,
      state: 'LIBRE',
    };

    if (vehicleType) {
      query.vehicleType = vehicleType;
    }

    return await this.em.find(ParkingSpace, query);
  }

  async findById(id: string): Promise<ParkingSpace | null> {
    return await this.em.findOne(ParkingSpace, {
      id,
      state: { $ne: 'BAJA' },
    });
  }

  async create(parking: Parking, vehicleType: string, spaceCode: string): Promise<ParkingSpace> {
    const newParkingSpace = this.em.create(ParkingSpace, {
      spaceCode,
      state: 'LIBRE',
      vehicleType,
      parking,
    });

    this.em.persist(newParkingSpace);
    await this.em.flush();
    return newParkingSpace;
  }

  async deactivate(space: ParkingSpace): Promise<void> {
    space.state = 'BAJA';
    await this.em.flush();
  }
}