import { EntityManager } from '@mikro-orm/core';
import { EmployeeShift, DayOfWeek } from './EmployeeShift.Entity.js';
import { Repository } from '../Shared/base.Repository.js';

export class EmployeeShiftRepository implements Repository<EmployeeShift> {
  constructor(private em: EntityManager) {}

  async findAll(): Promise<EmployeeShift[]> {
    return await this.em.find(EmployeeShift, { isActive: true }, { populate: ['employee', 'parking'] as any });
  }

  async findOne(item: { id: string }): Promise<EmployeeShift | null> {
    return await this.em.findOne(EmployeeShift, { id: item.id, isActive: true }, { populate: ['employee', 'parking'] as any });
  }

  async findByEmployeeId(employeeId: string): Promise<EmployeeShift[]> {
    return await this.em.find(
      EmployeeShift,
      { employee: { id: employeeId }, isActive: true },
      { populate: ['employee', 'parking'] as any }
    );
  }

  async add(data: any): Promise<EmployeeShift> {
  const shift = this.em.create(EmployeeShift, {
    dayOfWeek: data.dayOfWeek as DayOfWeek,
    startTime: data.startTime,
    endTime: data.endTime,
    employee: data.employee,
    parking: data.parking,
    isActive: true,
  });
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

  async findByParkingAndDay(parkingId: string, dayOfWeek: DayOfWeek): Promise<EmployeeShift[]> {
    return await this.em.find(
      EmployeeShift, 
      { parking: { id: parkingId }, dayOfWeek, isActive: true },
      { orderBy: { startTime: 'ASC' }, populate: ['employee'] as any }
    );
  }
}