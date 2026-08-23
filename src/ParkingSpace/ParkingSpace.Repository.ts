import { EntityManager } from '@mikro-orm/core';
import { ParkingSpace } from './ParkingSpace.Entity.js';
import { Parking } from '../Parking/Parking.Entity.js';
import { Repository } from '../Shared/base.Repository.js';

export class ParkingSpaceRepository implements Repository<ParkingSpace> {
  constructor(private em: EntityManager) {}
  
  async findAll(): Promise<ParkingSpace[]> {
    return await this.em.find(ParkingSpace, { state: { $ne: 'BAJA' } });
  }

  async findOne(item: { id: string }): Promise<ParkingSpace | null> {
    return await this.em.findOne(ParkingSpace, { id: item.id, state: { $ne: 'BAJA' } });
  }

  async add(data: any): Promise<ParkingSpace> {
    const newParkingSpace = this.em.create(ParkingSpace, { spaceCode: data.spaceCode,
      state: 'LIBRE',
      vehicleType: data.vehicleType,
      parking: data.parking,
    });
    await this.em.flush();
    return newParkingSpace;
  }

  async update(id: string, data: any): Promise<ParkingSpace | null> {
    const space = await this.findOne({ id });
    if (!space) return null;

    this.em.assign(space, data);
    await this.em.flush();
    return space;
  }

  async remove(item: { id: string }): Promise<boolean> {
    const space = await this.findOne({ id: item.id });
    if (!space) return false;
    
    space.state = 'BAJA';
    await this.em.flush();
    return true;
  }

  async findParking(parkingId: string): Promise<Parking | null> {
    return await this.em.findOne(Parking, { id: parkingId, isActive: true });
  }

  async countActiveSpacesByType(parking: Parking, vehicleType: string): Promise<number> {
    return await this.em.count(ParkingSpace, { parking, vehicleType, state: { $ne: 'BAJA' }});
  }

  async findBySpaceCode(parking: Parking, spaceCode: string): Promise<ParkingSpace | null> {
    return await this.em.findOne(ParkingSpace, { parking, spaceCode, state: { $ne: 'BAJA' }});
  }

  async findByParking(parking: Parking): Promise<ParkingSpace[]> {
    return await this.em.find(ParkingSpace, { parking,state: { $ne: 'BAJA' }});
  }

  async findAvailable(parking: Parking, vehicleType?: string): Promise<ParkingSpace[]> {
    const query: Record<string, any> = { parking, state: 'LIBRE'};

    if (vehicleType) { query.vehicleType = vehicleType; }

    return await this.em.find(ParkingSpace, query);
  }
}