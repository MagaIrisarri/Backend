import { EntityManager } from '@mikro-orm/core';
import { EmployeeShift, DayOfWeek } from './EmployeeShift.Entity.js';
import { ShiftClosure } from './ShiftClosure.Entity.js';
import { DayException } from './DayException.Entity.js';
import { Holiday } from '../Holiday/Holiday.Entity.js';
import { HolidayAdhesion } from '../Holiday/HolidayAdhesion.Entity.js';
import { Reservation } from '../Reservation/Reservation.Entity.js';
import { Parking } from '../Parking/Parking.Entity.js';
import { User } from '../User/User.Entity.js';
import { ACTIVE_RESERVATION_STATUSES } from '../Shared/constants/status.js';

// [validFrom, validTo) contiene la fecha; sin fecha, la versión sin vencer. `current` es lo que marca vigente a una fila sin validTo.
const validAt = (date: string | undefined, current: object = {}): any => date
  ? { $and: [{ $or: [{ validFrom: null }, { validFrom: { $lte: date } }] }, { $or: [{ validTo: null, ...current }, { validTo: { $gt: date } }] }] }
  : { validTo: null, ...current };

export class ScheduleRepository {
  constructor(public em: EntityManager) {}

  findParking(id: string) { return this.em.findOne(Parking, { id, isActive: true }); }
  findEmployees(ids: string[]) { return this.em.find(User, { id: { $in: ids }, status: 'ACTIVO', type: 'EMPLEADO' }); }

  // L-01: la semana tipo que regía en `date`; sin fecha, la última versión (la que se edita). Las filas desactivadas antes
  // de la vigencia (sin validTo) no se sabe hasta cuándo valieron: quedan afuera.
  templateShifts(parkingId: string, dayOfWeek: DayOfWeek, date?: string) {
    return this.em.find(EmployeeShift, { parking: { id: parkingId }, dayOfWeek, ...validAt(date, { isActive: true }) }, { populate: ['employee'] as any });
  }
  templateClosures(parkingId: string, dayOfWeek: DayOfWeek, date?: string) {
    return this.em.find(ShiftClosure, { parking: { id: parkingId }, dayOfWeek, ...validAt(date) });
  }
  // Las que rigen algún día desde `from`: las que reemplaza un cambio de la semana tipo que empieza ese día.
  templateRowsFrom(parkingId: string, dayOfWeek: DayOfWeek, from: string) {
    const where = { parking: { id: parkingId }, dayOfWeek };
    return Promise.all([
      this.em.find(EmployeeShift, { ...where, $or: [{ validTo: null, isActive: true }, { validTo: { $gt: from } }] }),
      this.em.find(ShiftClosure, { ...where, $or: [{ validTo: null }, { validTo: { $gt: from } }] }),
    ]);
  }

  findException(parkingId: string, date: string) { return this.em.findOne(DayException, { parking: { id: parkingId }, date }); }
  // El feriado de la fecha que ve la sucursal: el nacional o uno propio de su dueño (hay a lo sumo uno, R-10).
  findHolidayFor(parking: Parking, date: string) {
    return this.em.findOne(Holiday, { date, $or: [{ owner: null }, { owner: parking.owner.id }] });
  }
  findAdhesion(holidayId: string, parkingId: string) {
    return this.em.findOne(HolidayAdhesion, { holiday: { id: holidayId }, parking: { id: parkingId } });
  }

  // Reservas activas (pendientes o en curso) de una sucursal que tocan el día.
  activeReservations(parkingId: string, dayStart: Date, dayEnd: Date) {
    return this.em.find(Reservation, {
      parkingSpace: { parking: { id: parkingId } },
      status: { $in: [...ACTIVE_RESERVATION_STATUSES] },
      startTime: { $lt: dayEnd },
      endTime: { $gt: dayStart },
    }, { populate: ['attendedBy'] as any });
  }
}
