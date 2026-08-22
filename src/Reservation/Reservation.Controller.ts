import { Request, Response } from 'express';
import { ReservationService } from './Reservation.Service.js';

export class ReservationController {
  constructor(private service: ReservationService) {}

  public findAll = async (_req: Request, res: Response) => {
    try {
      const reservations = await this.service.findAll();
      return res.status(200).json({
        message: reservations.length === 0 ? 'No se encontraron reservas' : 'Reservas encontradas',
        data: reservations,
      });
    } catch (error: any) {
      return res.status(500).json({ message: 'Error al obtener reservas', error: error.message });
    }
  };

  public findOne = async (req: Request, res: Response) => {
    try {
      const reservation = await this.service.findOne(req.params.id as string);
      if (!reservation) return res.status(404).json({ message: 'Reserva no encontrada' });

      return res.status(200).json({ message: 'Reserva encontrada', data: reservation });
    } catch (error: any) {
      return res.status(500).json({ message: 'Error al obtener la reserva', error: error.message });
    }
  };

  public create = async (req: Request, res: Response) => {
    try {
      const reservation = await this.service.create(req.body);
      return res.status(201).json({ message: 'Reserva creada con éxito', data: reservation });
    } catch (error: any) {
      return res.status(400).json({ message: 'Error al crear la reserva', error: error.message });
    }
  };

  public update = async (req: Request, res: Response) => {
    try {
      const reservation = await this.service.update(req.params.id as string, req.body);
      if (!reservation) return res.status(404).json({ message: 'Reserva no encontrada' });

      return res.status(200).json({ message: 'Reserva actualizada con éxito', data: reservation });
    } catch (error: any) {
      return res.status(500).json({ message: 'Error al actualizar la reserva', error: error.message });
    }
  };

  public remove = async (req: Request, res: Response) => {
    try {
      const deleted = await this.service.remove(req.params.id as string);
      if (!deleted) return res.status(404).json({ message: 'Reserva no encontrada' });

      return res.status(200).json({ message: 'Reserva cancelada con éxito' });
    } catch (error: any) {
      return res.status(500).json({ message: 'Error al cancelar la reserva', error: error.message });
    }
  };
}