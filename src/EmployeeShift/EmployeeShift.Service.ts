import { EmployeeShiftRepository } from './EmployeeShift.Repository.js';
import { EmployeeShift, DayOfWeek } from './EmployeeShift.Entity.js';
import { CreateShiftInput } from './EmployeeShift.Schema.js';

export class EmployeeShiftService {
  constructor(private repo: EmployeeShiftRepository) {}

  async createShift(data: CreateShiftInput): Promise<EmployeeShift> {
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

    return await this.repo.create(employee, parking, data);
  }

  async getShiftsByParkingAndDay(parkingId: string, dayOfWeek: string): Promise<EmployeeShift[]> {
    return await this.repo.findByParkingAndDay(parkingId, dayOfWeek as DayOfWeek);
  }

  // Calcula los horarios en los que NO hay empleados cubriendo el estacionamiento
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

  async deleteShift(id: string): Promise<boolean> {
    const shift = await this.repo.findById(id);
    if (!shift) return false;

    await this.repo.deactivate(shift);
    return true;
  }
}