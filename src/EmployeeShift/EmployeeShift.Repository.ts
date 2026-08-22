import { EntityManager } from '@mikro-orm/core';
import { EmployeeShift, DayOfWeek } from './EmployeeShift.Entity.js';
import { User } from '../User/User.Entity.js';
import { Parking } from '../Parking/Parking.Entity.js';
import { CreateShiftInput } from './EmployeeShift.Schema.js';

export class EmployeeShiftRepository {
  constructor(private em: EntityManager) {}

  async findUserById(userId: string): Promise<User | null> {
    return await this.em.findOne(User, { id: userId, status: 'ACTIVO' });
  }

  async findParkingById(parkingId: string): Promise<Parking | null> {
    return await this.em.findOne(Parking, { id: parkingId, isActive: true });
  }

  // Previene solapamiento de horarios del mismo empleado
  async findOverlappingShift(
    employee: User, 
    dayOfWeek: DayOfWeek, 
    startTime: string, 
    endTime: string
  ): Promise<EmployeeShift | null> {
    return await this.em.findOne(EmployeeShift, {
      employee,
      dayOfWeek,
      isActive: true,
      $and: [
        { startTime: { $lt: endTime } },
        { endTime: { $gt: startTime } }
      ]
    });
  }

  async findByParkingAndDay(parkingId: string, dayOfWeek: DayOfWeek): Promise<EmployeeShift[]> {
    return await this.em.find(
      EmployeeShift, 
      { parking: { id: parkingId }, dayOfWeek, isActive: true },
      // Populamos employee manualmente ya que no tiene eager: true
      { orderBy: { startTime: 'ASC' }, populate: ['employee'] as any }
    );
  }

  async findById(id: string): Promise<EmployeeShift | null> {
    return await this.em.findOne(
      EmployeeShift, 
      { id, isActive: true },
      { populate: ['employee', 'parking'] as any }
    );
  }

  async create(employee: User, parking: Parking, data: CreateShiftInput): Promise<EmployeeShift> {
    const shift = this.em.create(EmployeeShift, {
      employee,
      parking,
      dayOfWeek: data.dayOfWeek as DayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      // Pasamos estas flags explícitamente para evitar errores de TS (strict type check de MikroORM)
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    await this.em.flush();
    return shift;
  }

  async deactivate(shift: EmployeeShift): Promise<void> {
    shift.isActive = false;
    await this.em.flush();
  }
}