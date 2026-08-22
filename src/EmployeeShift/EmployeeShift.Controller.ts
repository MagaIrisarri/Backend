import { Request, Response } from 'express';
import { EmployeeShiftService } from './EmployeeShift.Service.js';

export class EmployeeShiftController {
  constructor(private service: EmployeeShiftService) {}

  public create = async (req: Request, res: Response) => {
    try {
      const shift = await this.service.createShift(req.body);
      return res.status(201).json({ message: 'Turno creado con éxito', data: shift });
    } catch (error: any) {
      return res.status(400).json({ message: 'Error al asignar el turno', error: error.message });
    }
  };

  public getCoverage = async (req: Request, res: Response) => {
    try {
      const parkingId = req.params.parkingId as string;
      const dayOfWeek = req.params.dayOfWeek as string;

      const shifts = await this.service.getShiftsByParkingAndDay(parkingId, dayOfWeek);
      const gaps = await this.service.calculateCoverageGaps(parkingId, dayOfWeek);

      return res.status(200).json({
        message: 'Cobertura calculada',
        data: {
          assignedShifts: shifts,
          missingHours: gaps, 
        }
      });
    } catch (error: any) {
      return res.status(500).json({ message: 'Error al consultar cobertura', error: error.message });
    }
  };

  public remove = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const deleted = await this.service.deleteShift(id);
      
      if (!deleted) return res.status(404).json({ message: 'Turno no encontrado' });

      return res.status(200).json({ message: 'Turno dado de baja con éxito' });
    } catch (error: any) {
      return res.status(500).json({ message: 'Error al dar de baja el turno', error: error.message });
    }
  };
}