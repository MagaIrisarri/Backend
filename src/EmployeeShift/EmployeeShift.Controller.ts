import { Request, Response } from 'express';
import { EmployeeShiftService } from './EmployeeShift.Service.js';
import { catchAsync } from '../Shared/utils/catchAsync.js';
import { AppError } from '../Shared/utils/AppError.js';

export class EmployeeShiftController {
  constructor(private service: EmployeeShiftService) {}

  public findAll = catchAsync(async (_req: Request, res: Response) => {
    const shifts = await this.service.findAll();
    return res.status(200).json({ data: shifts });
  });

  public findOne = catchAsync(async (req: Request, res: Response) => {
    const shift = await this.service.findOne(req.params.id as string);
    if (!shift) throw new AppError('Turno no encontrado', 404);
    return res.status(200).json({ data: shift });
  });

  public create = catchAsync(async (req: Request, res: Response) => {
    const shift = await this.service.create(req.body);
    return res.status(201).json({ message: 'Turno creado con éxito', data: shift });
  });

  public update = catchAsync(async (req: Request, res: Response) => {
    const shift = await this.service.update(req.params.id as string, req.body);
    if (!shift) throw new AppError('Turno no encontrado', 404);
    return res.status(200).json({ message: 'Turno actualizado con éxito', data: shift });
  });

  public remove = catchAsync(async (req: Request, res: Response) => {
    const deleted = await this.service.remove(req.params.id as string);
    if (!deleted) throw new AppError('Turno no encontrado', 404);
    return res.status(200).json({ message: 'Turno dado de baja con éxito' });
  });

  public getCoverage = catchAsync(async (req: Request, res: Response) => {
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
  });
}