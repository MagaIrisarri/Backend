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

  public findByClientId = catchAsync(async (req: Request, res: Response) => {
    const reservations = await this.service.findByClientId(req.params.clientId as string);
    return res.status(200).json({
      message: reservations.length === 0 ? 'No se encontraron reservas' : 'Reservas encontradas',
      data: reservations,
    });
  });

  public findByParkingId = catchAsync(async (req: Request, res: Response) => {
    const reservations = await this.service.findByParkingId(req.params.parkingId as string);
    return res.status(200).json({
      message: reservations.length === 0 ? 'No se encontraron reservas' : 'Reservas encontradas',
      data: reservations,
    });
  });

  public checkIn = catchAsync(async (req: Request, res: Response) => {
    const employeeId = (req.headers['x-user-id'] || req.body.employeeId || req.query.employeeId) as string;
    if (!employeeId) throw new AppError('employeeId es requerido', 400);

    const reservation = await this.service.checkIn(req.params.id as string, employeeId);
    return res.status(200).json({ message: 'Check-in realizado con éxito', data: reservation });
  });

  public checkOut = catchAsync(async (req: Request, res: Response) => {
    const employeeId = (req.headers['x-user-id'] || req.body.employeeId || req.query.employeeId) as string;
    if (!employeeId) throw new AppError('employeeId es requerido', 400);

    const result = await this.service.checkOut(req.params.id as string, employeeId);
    return res.status(200).json({ message: 'Check-out realizado y factura generada con éxito', data: result });
  });

  public remove = catchAsync(async (req: Request, res: Response) => {
    const userId = (req.headers['x-user-id'] || req.body.userId || req.query.userId) as string;
    if (!userId) throw new AppError('userId es requerido para cancelar la reserva', 400);

    const deleted = await this.service.remove(req.params.id as string, userId);
    if (!deleted) throw new AppError('Reserva no encontrada', 404);

    return res.status(200).json({ message: 'Reserva cancelada con éxito' });
  });
}