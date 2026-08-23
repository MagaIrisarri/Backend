import { EntityManager } from "@mikro-orm/core";
import { ParkingSpace, SpaceState } from "./ParkingSpace.Entity.js";
import { Repository } from "../Shared/base.Repository.js";

export class ParkingSpaceRepository implements Repository<ParkingSpace> {
  constructor(private em: EntityManager) {}

  async findAll(): Promise<ParkingSpace[]> {
    return await this.em.find(ParkingSpace, { isActive: true });
  }

  async findOne(item: { id: string }): Promise<ParkingSpace | null> {
    return await this.em.findOne(ParkingSpace, { id: item.id, isActive: true });
  }

  async add(data: any): Promise<ParkingSpace> {
    const space = this.em.create(ParkingSpace, { ...data, isActive: true });
    await this.em.flush();
    return space;
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

    space.isActive = false;
    await this.em.flush();
    return true;
  }


  async findByParking(parkingId: string): Promise<ParkingSpace[]> {
    return await this.em.find(ParkingSpace, { parking: parkingId as any, isActive: true }, { orderBy: { spaceCode: 'ASC' } });
  }

  async findAvailableByParking(parkingId: string, vehicleType?: string): Promise<ParkingSpace[]> {
    const filter: any = { parking: parkingId, state: SpaceState.LIBRE, isActive: true };
    if (vehicleType) filter.vehicleType = vehicleType;
    return await this.em.find(ParkingSpace, filter);
  }

  async createBulk(spaces: Partial<ParkingSpace>[]): Promise<void> {
    for (const spaceData of spaces) {
      const space = this.em.create(ParkingSpace, { ...spaceData, isActive: true } as any);
      this.em.persist(space);
    }
    await this.em.flush();
  }
}