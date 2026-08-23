import { EmployeeShiftRepository } from './EmployeeShift.Repository.js';
import { EmployeeShift, DayOfWeek } from './EmployeeShift.Entity.js';
import { CreateShiftInput, UpdateShiftInput } from './EmployeeShift.Schema.js';

export class EmployeeShiftService {
  constructor(private repo: EmployeeShiftRepository) {}

  async findAll(): Promise<EmployeeShift[]> {
    return await this.repo.findAll();
  }

  async findOne(id: string): Promise<EmployeeShift | null> {
    return await this.repo.findOne({ id });
  }

  async create(data: CreateShiftInput): Promise<EmployeeShift> {
    const employee = await this.repo.findUserById(data.employeeId);
    if (!employee) throw new Error("Empleado no encontrado o inactivo");
    if (employee.type !== 'EMPLEADO') throw new Error("El usuario asignado no tiene rol de EMPLEADO");

    const parking = await this.repo.findParkingById(data.parkingId);
    if (!parking) throw new Error("Estacionamiento no encontrado o inactivo");

    const day = data.dayOfWeek as DayOfWeek;

    const overlap = await this.repo.findOverlappingShift(employee, day, data.startTime, data.endTime);
    if (overlap) {
      throw new Error(`El empleado ya tiene un turno asignado que se cruza (${overlap.startTime} - ${overlap.endTime})`);
    }

    return await this.repo.add({
      employee,
      parking,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime
    });
  }

  async update(id: string, data: UpdateShiftInput): Promise<EmployeeShift | null> {
    const currentShift = await this.repo.findOne({ id });
    if (!currentShift) return null;

    // Si cambian el día o la hora, validamos que no se solape
    if (data.startTime || data.endTime || data.dayOfWeek) {
      const newStart = data.startTime || currentShift.startTime;
      const newEnd = data.endTime || currentShift.endTime;
      const newDay = (data.dayOfWeek || currentShift.dayOfWeek) as DayOfWeek;

      if (newStart >= newEnd) throw new Error("La hora de inicio debe ser anterior a la hora de fin");

      const overlap = await this.repo.findOverlappingShift(currentShift.employee, newDay, newStart, newEnd, id);
      if (overlap) {
        throw new Error(`El turno se superpone con otro existente (${overlap.startTime} - ${overlap.endTime})`);
      }
    }

    return await this.repo.update(id, data);
  }

  async remove(id: string): Promise<boolean> {
    return await this.repo.remove({ id });
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