import { EmployeeShiftRepository } from './EmployeeShift.Repository.js';
import { EmployeeShift, DayOfWeek } from './EmployeeShift.Entity.js';
import { CreateShiftInput, UpdateShiftInput } from './EmployeeShift.Schema.js';
import { AppError } from '../Shared/utils/AppError.js';
import type { ScheduleService } from './Schedule.Service.js';
import type { DayShift } from './Schedule.js';

export class EmployeeShiftService {
  constructor(private repo: EmployeeShiftRepository, private schedule: ScheduleService) {}

  async findAll(): Promise<EmployeeShift[]> {
    return await this.repo.findAll();
  }

  async findOne(id: string): Promise<EmployeeShift | null> {
    return await this.repo.findOne({ id });
  }

  async findByEmployeeId(employeeId: string): Promise<EmployeeShift[]> {
    return await this.repo.findByEmployeeId(employeeId);
  }

  // CRUD TurnoEmpleado sobre la semana tipo: cada alta, cambio o baja rearma el día y lo guarda con ScheduleService.saveTemplateDay,
  // que valida solapes (R-02), horario de la sucursal, empleados de la sucursal y reservas activas (R-05, R-06). Sin transferencias:
  // si el cambio deja reservas sin su empleado, responde 409 y el reemplazo se hace desde la agenda.
  private async saveDay(parkingId: string, dayOfWeek: DayOfWeek, change: (shifts: DayShift[]) => DayShift[]) {
    const day = (await this.schedule.getTemplate(parkingId)).find((d) => d.dayOfWeek === dayOfWeek)!;
    await this.schedule.saveTemplateDay(parkingId, dayOfWeek, { shifts: change(day.shifts), closures: day.closures, transfers: [] });
  }

  // El turno guardado que cubre el pedido (los turnos contiguos del mismo empleado se fusionan, R-04).
  private async savedShift(parkingId: string, employeeId: string, dayOfWeek: DayOfWeek, from: string, to: string): Promise<EmployeeShift> {
    const shifts = await this.repo.findByParkingAndDay(parkingId, dayOfWeek);
    return shifts.find((s) => s.employee.id === employeeId && s.startTime.slice(0, 5) <= from && s.endTime.slice(0, 5) >= to)!;
  }

  async create(data: CreateShiftInput): Promise<EmployeeShift> {
    const day = data.dayOfWeek as DayOfWeek;
    const from = data.startTime.slice(0, 5), to = data.endTime.slice(0, 5);
    await this.saveDay(data.parkingId, day, (shifts) => [...shifts, { employeeId: data.employeeId, from, to }]);
    return this.savedShift(data.parkingId, data.employeeId, day, from, to);
  }

  async update(id: string, data: UpdateShiftInput): Promise<EmployeeShift | null> {
    const current = await this.repo.findOne({ id });
    if (!current) return null;
    if (data.dayOfWeek && data.dayOfWeek !== current.dayOfWeek) {
      throw new AppError("Para pasar el turno a otro día, dalo de baja y crealo en ese día", 400);
    }
    const from = (data.startTime ?? current.startTime).slice(0, 5), to = (data.endTime ?? current.endTime).slice(0, 5);
    if (from >= to) throw new AppError("La hora de inicio debe ser anterior a la hora de fin", 400);
    const old = { employeeId: current.employee.id, from: current.startTime.slice(0, 5), to: current.endTime.slice(0, 5) };
    await this.saveDay(current.parking.id, current.dayOfWeek, (shifts) => [
      ...shifts.filter((s) => !(s.employeeId === old.employeeId && s.from === old.from && s.to === old.to)),
      { employeeId: old.employeeId, from, to },
    ]);
    return this.savedShift(current.parking.id, old.employeeId, current.dayOfWeek, from, to);
  }

  async remove(id: string): Promise<boolean> {
    const current = await this.repo.findOne({ id });
    if (!current) return false;
    const from = current.startTime.slice(0, 5), to = current.endTime.slice(0, 5);
    await this.saveDay(current.parking.id, current.dayOfWeek, (shifts) =>
      shifts.filter((s) => !(s.employeeId === current.employee.id && s.from === from && s.to === to)));
    return true;
  }

  async getShiftsByParkingAndDay(parkingId: string, dayOfWeek: string): Promise<EmployeeShift[]> {
    return await this.repo.findByParkingAndDay(parkingId, dayOfWeek as DayOfWeek);
  }

  async calculateCoverageGaps(parkingId: string, dayOfWeek: string) {
    const shifts = await this.repo.findByParkingAndDay(parkingId, dayOfWeek as DayOfWeek);
    
    const gaps = [];
    let currentEnd = '00:00:00';

    for (const shift of shifts) {
      if (shift.startTime > currentEnd) {
        gaps.push({ gapStart: currentEnd, gapEnd: shift.startTime });
      }
      if (shift.endTime > currentEnd) {
        currentEnd = shift.endTime;
      }
    }

    if (currentEnd < '24:00:00') {
      gaps.push({ gapStart: currentEnd, gapEnd: '24:00:00' });
    }

    return gaps;
  }
}