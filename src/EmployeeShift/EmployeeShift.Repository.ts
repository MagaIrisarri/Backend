import { EntityManager } from '@mikro-orm/core';
import { EmployeeShift, DayOfWeek } from './EmployeeShift.Entity.js';
import { User } from '../User/User.Entity.js';
import { Parking } from '../Parking/Parking.Entity.js';
import { Repository } from '../Shared/base.Repository.js';

export class EmployeeShiftRepository implements Repository<EmployeeShift> {
  constructor(private em: EntityManager) {}

  async findAll(): Promise<EmployeeShift[]> {
    return await this.em.find(EmployeeShift, { isActive: true }, { populate: ['employee', 'parking'] as any });
  }

  async findOne(item: { id: string }): Promise<EmployeeShift | null> {
    return await this.em.findOne(EmployeeShift, { id: item.id, isActive: true }, { populate: ['employee', 'parking'] as any });
  }

  async add(data: any): Promise<EmployeeShift> {
    const shift = this.em.create(EmployeeShift, { ...data, isActive: true });
    await this.em.flush();
    return shift;
  }

  async update(id: string, data: any): Promise<EmployeeShift | null> {
    const shift = await this.findOne({ id });
    if (!shift) return null;

    this.em.assign(shift, data);
    await this.em.flush();
    return shift;
  }

  async remove(item: { id: string }): Promise<boolean> {
    const shift = await this.findOne({ id: item.id });
    if (!shift) return false;

    shift.isActive = false;
    await this.em.flush();
    return true;
  }

  async findUserById(userId: string): Promise<User | null> {
    return await this.em.findOne(User, { id: userId, status: 'ACTIVO' });
  }

  async findParkingById(parkingId: string): Promise<Parking | null> {
    return await this.em.findOne(Parking, { id: parkingId, isActive: true });
  }

  async findOverlappingShift(
    employee: User, 
    dayOfWeek: DayOfWeek, 
    startTime: string, 
    endTime: string,
    excludeShiftId?: string // ignorar el turno actual durante un update ?
  ): Promise<EmployeeShift | null> {
    const query: any = { employee, dayOfWeek, isActive: true,
      $and: [
        { startTime: { $lt: endTime } },
        { endTime: { $gt: startTime } }
      ]
    };
    
    if (excludeShiftId) query.id = { $ne: excludeShiftId };
    
    return await this.em.findOne(EmployeeShift, query);
  }

  async findByParkingAndDay(parkingId: string, dayOfWeek: DayOfWeek): Promise<EmployeeShift[]> {
    return await this.em.find(
      EmployeeShift, 
      { parking: { id: parkingId }, dayOfWeek, isActive: true },
      { orderBy: { startTime: 'ASC' }, populate: ['employee'] as any }
    );
  }
}