import { Request, Response } from 'express';
import { StatsService } from './Stats.Service.js';

export class StatsController {
  constructor(private service: StatsService) {}

  public summary = async (req: Request, res: Response) => {
    const { province, locality } = req.query as { province?: string; locality?: string };
    const data = await this.service.summary(province && locality ? { province, locality } : undefined);
    return res.status(200).json({ message: 'Resumen del sistema', data });
  };
}
