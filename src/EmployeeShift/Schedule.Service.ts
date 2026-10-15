import { ScheduleRepository } from './Schedule.Repository.js';
import { DayOfWeek, EmployeeShift } from './EmployeeShift.Entity.js';
import { DayException } from './DayException.Entity.js';
import { ShiftClosure } from './ShiftClosure.Entity.js';
import { Parking } from '../Parking/Parking.Entity.js';
import { Reservation } from '../Reservation/Reservation.Entity.js';
import { User } from '../User/User.Entity.js';
import { Holiday } from '../Holiday/Holiday.Entity.js';
import { HolidayAdhesion } from '../Holiday/HolidayAdhesion.Entity.js';
import { SaveDayInput } from './Schedule.Schema.js';
import {
  DaySchedule, Range, covers, diffDay, employeeRanges, hhmm, normalizeDay, overlaps, sameDay, toMin, union,
} from './Schedule.js';
import { AppError } from '../Shared/utils/AppError.js';
import { PLANNING_HORIZON_MONTHS } from '../Shared/constants/schedule.js';
import { ACTIVE_RESERVATION_STATUSES } from '../Shared/constants/status.js';

const DOW: DayOfWeek[] = [
  DayOfWeek.SUNDAY, DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY,
];

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayStart = (date: string) => new Date(`${date}T00:00:00`);
const dayOf = (date: string): DayOfWeek => DOW[new Date(`${date}T12:00:00`).getDay()]!;
const clock = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export type DaySource = 'exception' | 'holiday-closed' | 'template';

export interface ResolvedDay extends DaySchedule {
  parkingId: string;
  date: string;
  source: DaySource;
  modified: boolean; // D-01: el día difiere de la plantilla
  holiday: { id: string; name: string; open: boolean } | null;
  editable: boolean; // R-09
}

export class ScheduleService {
  constructor(private repo: ScheduleRepository) {}

  config() { return { horizonMonths: PLANNING_HORIZON_MONTHS }; }

  // R-09: fechas pasadas de solo lectura; hoy y el futuro hasta el horizonte (D-06).
  // shortcut: L-03, hoy se puede editar aunque ya pasaron horas, bloquear franjas anteriores a la hora actual
  // shortcut: L-04, "hoy" sale del reloj del servidor, calcular con la zona de la sucursal
  isEditable(date: string): boolean {
    const now = new Date();
    const limit = new Date(now.getFullYear(), now.getMonth() + PLANNING_HORIZON_MONTHS, now.getDate());
    return date >= iso(now) && date <= iso(limit);
  }

  assertEditable(date: string) {
    if (Number.isNaN(dayStart(date).getTime())) throw new AppError('Fecha inválida', 400);
    if (!this.isEditable(date)) throw new AppError('Solo se pueden editar turnos desde hoy hasta el horizonte de planificación', 400);
  }

  private async mustParking(parkingId: string): Promise<Parking> {
    const parking = await this.repo.findParking(parkingId);
    if (!parking) throw new AppError('Estacionamiento no encontrado o inactivo', 404);
    return parking;
  }

  private templateDay(parking: Parking, date: string): Promise<DaySchedule> {
    return this.templateFor(parking, dayOf(date));
  }

  private async templateFor(parking: Parking, dow: DayOfWeek): Promise<DaySchedule> {
    const [shifts, closures] = await Promise.all([this.repo.templateShifts(parking.id, dow), this.repo.templateClosures(parking.id, dow)]);
    return normalizeDay({
      shifts: shifts.map(s => ({ employeeId: s.employee.id, from: s.startTime.slice(0, 5), to: s.endTime.slice(0, 5) })),
      closures: closures.map(c => ({ from: c.startTime.slice(0, 5), to: c.endTime.slice(0, 5) })),
    });
  }

  // Orden de lectura: excepción de la fecha, feriado adherido (cerrado), semana tipo.
  async resolveDay(parking: Parking, date: string): Promise<ResolvedDay> {
    const base = { parkingId: parking.id, date, editable: this.isEditable(date) };
    const holiday = await this.repo.findHolidayFor(parking, date);
    const open = holiday ? !(await this.repo.findAdhesion(holiday.id, parking.id)) : true;
    const holidayInfo = holiday ? { id: holiday.id, name: holiday.name, open } : null;

    const exception = await this.repo.findException(parking.id, date);
    if (exception) {
      return { ...base, source: 'exception', modified: true, holiday: holidayInfo, shifts: exception.shifts, closures: exception.closures };
    }
    if (holiday && !open) {
      const closed = { from: parking.openingTime.slice(0, 5), to: parking.closingTime.slice(0, 5) };
      return { ...base, source: 'holiday-closed', modified: false, holiday: holidayInfo, shifts: [], closures: [closed] };
    }
    return { ...base, source: 'template', modified: false, holiday: holidayInfo, ...(await this.templateDay(parking, date)) };
  }

  async getDay(parkingId: string, date: string): Promise<ResolvedDay> {
    return this.resolveDay(await this.mustParking(parkingId), date);
  }

  async saveDay(parkingId: string, date: string, input: SaveDayInput): Promise<ResolvedDay> {
    this.assertEditable(date);
    const parking = await this.mustParking(parkingId);
    const before = await this.resolveDay(parking, date);
    if (before.source === 'holiday-closed') throw new AppError('El feriado está cerrado en esta sucursal: abrilo antes de editar el día', 400);

    const after = normalizeDay(input);
    await this.validateEmployees(parking, after);
    this.validateWithinOpening(parking, after);
    await this.commit(parking, date, before, after, input.transfers);
    return this.resolveDay(parking, date);
  }

  // Días resueltos de un rango (semana del calendario, resumen mensual de horas). Máximo 62 días.
  async getRange(parkingId: string, from: string, to: string): Promise<ResolvedDay[]> {
    const parking = await this.mustParking(parkingId);
    const days: ResolvedDay[] = [];
    for (let d = dayStart(from); iso(d) <= to; d.setDate(d.getDate() + 1)) {
      if (days.length >= 62) throw new AppError('El rango no puede superar 62 días', 400);
      days.push(await this.resolveDay(parking, iso(d)));
    }
    return days;
  }

  // Semana tipo completa, de lunes a domingo.
  async getTemplate(parkingId: string) {
    const parking = await this.mustParking(parkingId);
    const week = [...DOW.slice(1), DOW[0]!];
    return Promise.all(week.map(async dayOfWeek => ({ dayOfWeek, ...(await this.templateFor(parking, dayOfWeek)) })));
  }

  // Reemplaza un día de la semana tipo. R-11: las excepciones por fecha no se tocan.
  // Las reservas futuras de fechas que siguen la plantilla se validan igual que un cambio por fecha (R-05, R-06).
  async saveTemplateDay(parkingId: string, dayOfWeek: DayOfWeek, input: SaveDayInput) {
    const parking = await this.mustParking(parkingId);
    const after = normalizeDay(input);
    await this.validateEmployees(parking, after);
    this.validateWithinOpening(parking, after);
    const before = await this.templateFor(parking, dayOfWeek);

    const em = this.repo.em;
    const upcoming = await em.find(Reservation, {
      parkingSpace: { parking: { id: parking.id } },
      status: { $in: [...ACTIVE_RESERVATION_STATUSES] },
      endTime: { $gt: new Date() },
    }, { populate: ['attendedBy'] as any });
    const followsTemplate = new Map<string, boolean>();
    const affected: Reservation[] = [];
    for (const r of upcoming) {
      const date = iso(r.startTime);
      if (dayOf(date) !== dayOfWeek) continue;
      if (!followsTemplate.has(date)) followsTemplate.set(date, (await this.resolveDay(parking, date)).source === 'template');
      if (followsTemplate.get(date)) affected.push(r);
    }
    const moves = this.checkLoss(affected, null, before, after, input.transfers);

    // shortcut: L-30, el empleado que recibe la reserva no se entera en la app, notificarlo con NotificationService
    for (const [r, toId] of moves) r.attendedBy = em.getReference(User, toId);
    const [rows, closures] = await Promise.all([this.repo.templateShifts(parking.id, dayOfWeek), this.repo.templateClosures(parking.id, dayOfWeek)]);
    rows.forEach(s => { s.isActive = false; });
    closures.forEach(c => em.remove(c));
    for (const s of after.shifts) {
      em.create(EmployeeShift, { parking, employee: em.getReference(User, s.employeeId), dayOfWeek, startTime: s.from, endTime: s.to, isActive: true });
    }
    for (const c of after.closures) em.create(ShiftClosure, { parking, dayOfWeek, startTime: c.from, endTime: c.to });
    await em.flush(); // una sola transacción: plantilla y transferencias juntas
    return { dayOfWeek, ...(await this.templateFor(parking, dayOfWeek)) };
  }

  // Vuelve el día a la semana tipo; si no hay excepción no hace nada.
  async resetDay(parkingId: string, date: string): Promise<ResolvedDay> {
    this.assertEditable(date);
    const parking = await this.mustParking(parkingId);
    const before = await this.resolveDay(parking, date);
    if (before.source === 'exception') await this.commit(parking, date, before, await this.templateDay(parking, date), []);
    return this.resolveDay(parking, date);
  }

  // R-10: cada sucursal trabaja el feriado por defecto; se adhiere (cierra) si su dueño lo elige, y no con reservas activas o pendientes.
  async setHolidayOpen(holidayId: string, parkingId: string, open: boolean): Promise<ResolvedDay> {
    const parking = await this.mustParking(parkingId);
    const em = this.repo.em;
    const holiday = await em.findOne(Holiday, { id: holidayId, $or: [{ owner: null }, { owner: parking.owner.id }] });
    if (!holiday) throw new AppError('Feriado no encontrado', 404); // tampoco el propio de otro dueño
    this.assertEditable(holiday.date);

    const adhesion = await this.repo.findAdhesion(holiday.id, parking.id);
    if (!open && !adhesion) {
      const reservations = await this.reservationsOn(parking.id, holiday.date);
      if (reservations.length) {
        throw new AppError('No se puede cerrar el feriado: hay reservas activas o pendientes', 409, this.conflicts(reservations, holiday.date, 'cierre'));
      }
      const exception = await this.repo.findException(parking.id, holiday.date);
      if (exception) em.remove(exception);
      em.create(HolidayAdhesion, { holiday, parking });
      await em.flush();
    } else if (open && adhesion) {
      em.remove(adhesion);
      await em.flush();
    }
    return this.resolveDay(parking, holiday.date);
  }

  // R-01: las horas sin cobertura no admiten reservas; una sucursal sin turnos no tiene ninguna hora cubierta.
  async assertCovered(parking: Parking, start: Date, end: Date): Promise<void> {
    const date = iso(start);
    const day = await this.resolveDay(parking, date);
    const from = toMin(clock(start));
    const to = iso(end) === date ? toMin(clock(end)) : 1440;
    const staffed = union(day.shifts.map((s): Range => [toMin(s.from), toMin(s.to)]));
    if (!covers(staffed, [from, Math.max(to, from + 1)])) {
      throw new AppError(`Sin empleado asignado entre ${hhmm(from)} y ${hhmm(to)}: no se admiten reservas`, 409);
    }
  }

  listClosures(parkingId: string) { return this.repo.em.find(ShiftClosure, { parking: { id: parkingId } }); }

  async createClosure(input: { parkingId: string; dayOfWeek: DayOfWeek; startTime: string; endTime: string }) {
    const parking = await this.mustParking(input.parkingId);
    // R-05: no se cierra un horario con reservas activas o pendientes (de cualquier empleado) en las fechas futuras que lo repiten.
    // shortcut: R-05, las fechas con excepción cuentan igual aunque el cierre semanal no las afecte, afinar si molesta
    const upcoming = await this.repo.em.find(Reservation, {
      parkingSpace: { parking: { id: parking.id } },
      status: { $in: [...ACTIVE_RESERVATION_STATUSES] },
      endTime: { $gt: new Date() },
    });
    const range: Range = [toMin(input.startTime), toMin(input.endTime)];
    const hits = upcoming.filter(r => dayOf(iso(r.startTime)) === input.dayOfWeek && overlaps(range, this.resRange(r, iso(r.startTime))));
    if (hits.length) throw new AppError('Hay reservas activas o pendientes en ese horario', 409, { conflicts: hits.map(r => ({ reservationId: r.id, kind: 'cierre' })) });
    const closure = this.repo.em.create(ShiftClosure, { parking, dayOfWeek: input.dayOfWeek, startTime: input.startTime, endTime: input.endTime });
    await this.repo.em.flush();
    return closure;
  }

  async removeClosure(id: string): Promise<boolean> {
    const closure = await this.repo.em.findOne(ShiftClosure, { id });
    if (!closure) return false;
    this.repo.em.remove(closure);
    await this.repo.em.flush();
    return true;
  }

  // ---- internos ----

  private async validateEmployees(parking: Parking, day: DaySchedule) {
    const ids = [...new Set(day.shifts.map(s => s.employeeId))];
    if (!ids.length) return;
    const found = await this.repo.findEmployees(ids);
    if (found.length !== ids.length) throw new AppError('Algún empleado no existe, está dado de baja o no tiene rol EMPLEADO', 400);
    const foreign = found.find(e => e.parkingId && e.parkingId !== parking.id);
    if (foreign) throw new AppError(`${foreign.name} ${foreign.last_name} pertenece a otra sucursal`, 400);
  }

  private validateWithinOpening(parking: Parking, day: DaySchedule) {
    const open = toMin(parking.openingTime.slice(0, 5)), close = toMin(parking.closingTime.slice(0, 5));
    for (const s of [...day.shifts, ...day.closures]) {
      if (toMin(s.from) < open || toMin(s.to) > close) {
        throw new AppError(`El horario ${s.from}-${s.to} queda fuera del horario de la sucursal (${hhmm(open)}-${hhmm(close)})`, 400);
      }
    }
  }

  private reservationsOn(parkingId: string, date: string) {
    const start = dayStart(date);
    return this.repo.activeReservations(parkingId, start, new Date(start.getTime() + 24 * 3600_000));
  }

  private resRange(r: Reservation, date: string): Range {
    const t0 = dayStart(date).getTime();
    return [Math.max(0, (r.startTime.getTime() - t0) / 60000), Math.min(1440, (r.endTime.getTime() - t0) / 60000)];
  }

  private conflicts(rs: Reservation[], date: string | null, kind: string) {
    return {
      conflicts: rs.map(r => {
        const d = date ?? iso(r.startTime);
        const [a, b] = this.resRange(r, d);
        return { reservationId: r.id, date: d, from: hhmm(a), to: b >= 1440 ? '23:59' : hhmm(b), employeeId: r.attendedBy?.id ?? null, kind };
      }),
    };
  }

  // R-05 / R-01 / R-06 sobre las reservas afectadas por un cambio. Devuelve las transferencias a aplicar o lanza 409.
  // date null = cada reserva se mide en su propia fecha (cambios de la semana tipo).
  // shortcut: L-08, la reserva se mide solo en su fecha de inicio, usar el intervalo completo con reservas que cruzan medianoche
  private checkLoss(reservations: Reservation[], date: string | null, before: DaySchedule, after: DaySchedule, transfers: SaveDayInput['transfers']) {
    const loss = diffDay(before, after);
    const range = (r: Reservation) => this.resRange(r, date ?? iso(r.startTime));
    const hit = (r: Reservation, ranges: Range[]) => ranges.some(x => overlaps(x, range(r)));

    // R-05 / R-01: tramos que quedan cerrados o sin ningún empleado no admiten reservas de nadie.
    const uncovered = reservations.filter(r => hit(r, loss.uncovered));
    if (uncovered.length) {
      throw new AppError('Hay reservas activas o pendientes en horas que quedarían cerradas o sin cobertura', 409, this.conflicts(uncovered, date, 'cobertura'));
    }

    // R-06: no se quita el turno de un empleado con reservas, salvo que otro lo reemplace y la reserva quede dentro de su turno.
    const moves: [Reservation, string][] = [];
    const blocked: Reservation[] = [];
    for (const r of reservations) {
      const empId = r.attendedBy?.id;
      const lost = empId ? loss.byEmployee.get(empId) : undefined;
      if (!empId || !lost || !hit(r, lost)) continue;
      const to = transfers.find(t => t.fromEmployeeId === empId)?.toEmployeeId;
      // shortcut: L-07, no se valida que el destino esté libre a esa hora ni se avisa a nadie, validar disponibilidad y notificar
      if (to && covers(employeeRanges(after, to), range(r))) moves.push([r, to]);
      else blocked.push(r);
    }
    if (blocked.length) {
      throw new AppError('El empleado tiene reservas activas o pendientes en ese horario', 409, this.conflicts(blocked, date, 'empleado'));
    }
    return moves;
  }

  private async commit(parking: Parking, date: string, before: DaySchedule, after: DaySchedule, transfers: SaveDayInput['transfers']) {
    const moves = this.checkLoss(await this.reservationsOn(parking.id, date), date, before, after, transfers);

    // R-12: una excepción idéntica a la semana tipo se descarta sola.
    const base = await this.templateDay(parking, date);
    const exception = await this.repo.findException(parking.id, date);
    const em = this.repo.em;
    // shortcut: L-30, el empleado que recibe la reserva no se entera en la app, notificarlo con NotificationService
    for (const [r, toId] of moves) r.attendedBy = em.getReference(User, toId);
    if (sameDay(after, base)) { if (exception) em.remove(exception); }
    else if (exception) { exception.shifts = after.shifts; exception.closures = after.closures; }
    else em.create(DayException, { parking, date, shifts: after.shifts, closures: after.closures });
    await em.flush(); // un solo flush = una transacción: transferencia de reservas y excepción juntas (L-06)
  }
}
