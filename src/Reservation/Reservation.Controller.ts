import { Request, Response } from 'express';
import { ReservationService } from './Reservation.Service.js';
import { catchAsync } from '../Shared/utils/catchAsync.js';
import { AppError } from '../Shared/utils/AppError.js';

export class ReservationController {
  constructor(private service: ReservationService) {}

  public findAll = catchAsync(async (_req: Request, res: Response) => {
    const reservations = await this.service.findAll();
    return res.status(200).json({
      message: reservations.length === 0 ? 'No se encontraron reservas' : 'Reservas encontradas',
      data: reservations,
    });
  });

  public findOne = catchAsync(async (req: Request, res: Response) => {
    const reservation = await this.service.findOne(req.params.id as string);
    if (!reservation) throw new AppError('Reserva no encontrada', 404);

    return res.status(200).json({ message: 'Reserva encontrada', data: reservation });
  });

  public create = catchAsync(async (req: Request, res: Response) => {
    const reservation = await this.service.create(req.body);
    return res.status(201).json({ message: 'Reserva creada con éxito', data: reservation });
  });

  public update = catchAsync(async (req: Request, res: Response) => {
    const reservation = await this.service.update(req.params.id as string, req.body);
    if (!reservation) throw new AppError('Reserva no encontrada', 404);

    return res.status(200).json({ message: 'Reserva actualizada con éxito', data: reservation });
  });

  public remove = catchAsync(async (req: Request, res: Response) => {
    const deleted = await this.service.remove(req.params.id as string);
    if (!deleted) throw new AppError('Reserva no encontrada', 404);

    return res.status(200).json({ message: 'Reserva cancelada con éxito' });
  });
}