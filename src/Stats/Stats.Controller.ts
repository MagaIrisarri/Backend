import { Request, Response } from 'express';
import { StatsService } from './Stats.Service.js';
import { catchAsync } from '../Shared/utils/catchAsync.js';

export class StatsController {
  constructor(private service: StatsService) {}

  public summary = catchAsync(async (_req: Request, res: Response) => {
    const data = await this.service.summary();
    return res.status(200).json({ message: 'Resumen del sistema', data });
  });
}
