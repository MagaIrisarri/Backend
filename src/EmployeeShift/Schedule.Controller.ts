import { Request, Response } from 'express';
import { ScheduleService } from './Schedule.Service.js';
import { catchAsync } from '../Shared/utils/catchAsync.js';
import { AppError } from '../Shared/utils/AppError.js';

export class ScheduleController {
  constructor(private service: ScheduleService) {}

  public config = catchAsync(async (_req: Request, res: Response) => res.status(200).json({ data: this.service.config() }));

  public getDay = catchAsync(async (req: Request, res: Response) => {
    const { parkingId, date } = req.params as Record<string, string>;
    return res.status(200).json({ data: await this.service.getDay(parkingId!, date!) });
  });

  public saveDay = catchAsync(async (req: Request, res: Response) => {
    const { parkingId, date } = req.params as Record<string, string>;
    return res.status(200).json({ message: 'Día actualizado', data: await this.service.saveDay(parkingId!, date!, req.body) });
  });

  public resetDay = catchAsync(async (req: Request, res: Response) => {
    const { parkingId, date } = req.params as Record<string, string>;
    return res.status(200).json({ message: 'Día restablecido a la semana tipo', data: await this.service.resetDay(parkingId!, date!) });
  });

  public getRange = catchAsync(async (req: Request, res: Response) => {
    const { from, to } = req.query as Record<string, string>;
    return res.status(200).json({ data: await this.service.getRange(req.params.parkingId as string, from!, to!) });
  });

  public getTemplate = catchAsync(async (req: Request, res: Response) =>
    res.status(200).json({ data: await this.service.getTemplate(req.params.parkingId as string) }));

  public saveTemplateDay = catchAsync(async (req: Request, res: Response) => {
    const { parkingId, dayOfWeek } = req.params as Record<string, string>;
    return res.status(200).json({ message: 'Semana tipo actualizada', data: await this.service.saveTemplateDay(parkingId!, dayOfWeek as any, req.body) });
  });

  public listClosures = catchAsync(async (req: Request, res: Response) =>
    res.status(200).json({ data: await this.service.listClosures(req.params.parkingId as string) }));

  public createClosure = catchAsync(async (req: Request, res: Response) =>
    res.status(201).json({ message: 'Cierre creado', data: await this.service.createClosure(req.body) }));

  public removeClosure = catchAsync(async (req: Request, res: Response) => {
    if (!(await this.service.removeClosure(req.params.id as string))) throw new AppError('Cierre no encontrado', 404);
    return res.status(200).json({ message: 'Cierre eliminado' });
  });
}
