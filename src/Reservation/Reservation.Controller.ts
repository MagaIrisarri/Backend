import { Request, Response } from 'express';
import { ReservationService } from './Reservation.Service.js';
import { catchAsync } from '../Shared/utils/catchAsync.js';
import { AppError } from '../Shared/utils/AppError.js';

// Quién hace la acción: el frontend lo manda siempre en x-user-id (sin autenticación, ver revision-alcance).
const actorId = (req: Request, action: string): string => {
  const id = req.headers['x-user-id'];
  if (typeof id !== 'string' || !id) throw new AppError(`Falta el usuario (x-user-id) para ${action}`, 400);
  return id;
};

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

  public assignEmployee = catchAsync(async (req: Request, res: Response) => {
    const userId = actorId(req, 'asignar el empleado');
    const reservation = await this.service.assignEmployee(req.params.id as string, req.body.attendedById, userId);
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

  public findByOwnerId = catchAsync(async (req: Request, res: Response) => {
    const reservations = await this.service.findByOwnerId(req.params.ownerId as string);
    return res.status(200).json({
      message: reservations.length === 0 ? 'No se encontraron reservas' : 'Reservas encontradas',
      data: reservations,
    });
  });

  public changeSpace = catchAsync(async (req: Request, res: Response) => {
    const userId = actorId(req, 'cambiar la plaza');

    const reservation = await this.service.changeSpace(req.params.id as string, req.body.parkingSpaceId, userId);
    return res.status(200).json({ message: 'Plaza de la reserva actualizada', data: reservation });
  });

  public extend = catchAsync(async (req: Request, res: Response) => {
    const userId = actorId(req, 'modificar la reserva');

    const result = await this.service.extend(req.params.id as string, req.body.endTime, userId);
    return res.status(200).json({ message: 'Reserva extendida', data: result });
  });

  public setServices = catchAsync(async (req: Request, res: Response) => {
    const userId = actorId(req, 'modificar la reserva');

    const reservation = await this.service.setServices(req.params.id as string, req.body.serviceIds, userId);
    return res.status(200).json({ message: 'Servicios de la reserva actualizados', data: reservation });
  });

  public rate = catchAsync(async (req: Request, res: Response) => {
    const userId = actorId(req, 'valorar la reserva');

    const reservation = await this.service.rate(req.params.id as string, req.body.rating, userId);
    return res.status(200).json({ message: 'Gracias por tu valoración', data: reservation });
  });

  public confirm = catchAsync(async (req: Request, res: Response) => {
    const userId = actorId(req, 'confirmar la reserva');

    const reservation = await this.service.confirm(req.params.id as string, userId);
    return res.status(200).json({ message: 'Reserva confirmada con éxito', data: reservation });
  });

  public checkIn = catchAsync(async (req: Request, res: Response) => {
    const employeeId = actorId(req, 'registrar el ingreso o la salida');

    const reservation = await this.service.checkIn(req.params.id as string, employeeId);
    return res.status(200).json({ message: 'Check-in realizado con éxito', data: reservation });
  });

  public checkOut = catchAsync(async (req: Request, res: Response) => {
    const employeeId = actorId(req, 'registrar el ingreso o la salida');

    const result = await this.service.checkOut(req.params.id as string, employeeId);
    return res.status(200).json({ message: 'Check-out realizado y factura generada con éxito', data: result });
  });

  public remove = catchAsync(async (req: Request, res: Response) => {
    const userId = actorId(req, 'cancelar la reserva');

    const deleted = await this.service.remove(req.params.id as string, userId);
    if (!deleted) throw new AppError('Reserva no encontrada', 404);

    return res.status(200).json({ message: 'Reserva cancelada con éxito' });
  });
}