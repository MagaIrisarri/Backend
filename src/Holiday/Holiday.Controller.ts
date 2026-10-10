import { Request, Response } from 'express';
import { HolidayService } from './Holiday.Service.js';
import { ScheduleService } from '../EmployeeShift/Schedule.Service.js';
import { catchAsync } from '../Shared/utils/catchAsync.js';
import { AppError } from '../Shared/utils/AppError.js';

export class HolidayController {
  constructor(private service: HolidayService, private schedule: ScheduleService) {}

  public list = catchAsync(async (req: Request, res: Response) => {
    const { year, parkingId } = req.query as { year?: number; parkingId?: string };
    return res.status(200).json({ data: await this.service.list(year, parkingId) });
  });

  public create = catchAsync(async (req: Request, res: Response) =>
    res.status(201).json({ message: 'Feriado creado', data: await this.service.create(req.body) }));

  public remove = catchAsync(async (req: Request, res: Response) => {
    if (!(await this.service.remove(req.params.id as string))) throw new AppError('Feriado no encontrado', 404);
    return res.status(200).json({ message: 'Feriado eliminado' });
  });

  public setOpen = catchAsync(async (req: Request, res: Response) => {
    const { id, parkingId } = req.params as Record<string, string>;
    return res.status(200).json({ data: await this.schedule.setHolidayOpen(id!, parkingId!, req.body.open) });
  });
}
