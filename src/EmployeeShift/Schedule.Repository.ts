import { EntityManager } from '@mikro-orm/core';
import { EmployeeShift, DayOfWeek } from './EmployeeShift.Entity.js';
import { ShiftClosure } from './ShiftClosure.Entity.js';
import { DayException } from './DayException.Entity.js';
import { Holiday } from '../Holiday/Holiday.Entity.js';
import { HolidayParking } from '../Holiday/HolidayParking.Entity.js';
import { Reservation } from '../Reservation/Reservation.Entity.js';
import { Parking } from '../Parking/Parking.Entity.js';
import { User } from '../User/User.Entity.js';
import { ACTIVE_RESERVATION_STATUSES } from '../Shared/constants/status.js';

export class ScheduleRepository {
  constructor(public em: EntityManager) {}

  findParking(id: string) { return this.em.findOne(Parking, { id, isActive: true }); }
  findEmployees(ids: string[]) { return this.em.find(User, { id: { $in: ids }, status: 'ACTIVO', type: 'EMPLEADO' }); }

  templateShifts(parkingId: string, dayOfWeek: DayOfWeek) {
    return this.em.find(EmployeeShift, { parking: { id: parkingId }, dayOfWeek, isActive: true }, { populate: ['employee'] as any });
  }
  templateClosures(parkingId: string, dayOfWeek: DayOfWeek) {
    return this.em.find(ShiftClosure, { parking: { id: parkingId }, dayOfWeek });
  }
  countTemplateShifts(parkingId: string) { return this.em.count(EmployeeShift, { parking: { id: parkingId }, isActive: true }); }

  findException(parkingId: string, date: string) { return this.em.findOne(DayException, { parking: { id: parkingId }, date }); }
  findHolidayByDate(date: string) { return this.em.findOne(Holiday, { date }); }
  findHolidayParking(holidayId: string, parkingId: string) {
    return this.em.findOne(HolidayParking, { holiday: { id: holidayId }, parking: { id: parkingId } });
  }

  // Reservas activas (pendientes, confirmadas o en curso) de la sucursal que tocan el día.
  activeReservations(parkingId: string, dayStart: Date, dayEnd: Date) {
    return this.em.find(Reservation, {
      parkingSpace: { parking: { id: parkingId } },
      status: { $in: [...ACTIVE_RESERVATION_STATUSES] },
      startTime: { $lt: dayEnd },
      endTime: { $gt: dayStart },
    }, { populate: ['attendedBy'] as any });
  }
}
