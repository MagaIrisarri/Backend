import { Request, Response } from 'express';
import { ParkingService } from './Parking.Service.js';

export class ParkingController {
  constructor(private parkingService: ParkingService) {}

  public add = async (req: Request, res: Response) => {
    try {
      const parking = await this.parkingService.createParking(req.body);
      return res.status(201).json({
        message: 'Estacionamiento creado con éxito',
        data: parking,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Error al crear estacionamiento',
        error: error.message,
      });
    }
  };

  public findAll = async (_req: Request, res: Response) => {
    try {
      const parkings = await this.parkingService.findAllParking();
      return res.status(200).json({
        message: parkings.length === 0 ? 'No se encontraron estacionamientos' : 'Estacionamientos encontrados',
        data: parkings,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Error al obtener estacionamientos',
        error: error.message,
      });
    }
  };

  public findOneById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const parking = await this.parkingService.findParkingById(id);

      if (!parking) {
        return res.status(404).json({ message: 'Estacionamiento no encontrado' });
      }

      return res.status(200).json({
        message: 'Estacionamiento encontrado',
        data: parking,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Error al consultar estacionamiento',
        error: error.message,
      });
    }
  };

  public update = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const updatedParking = await this.parkingService.updateParking(id, req.body);

      if (!updatedParking) {
        return res.status(404).json({ message: 'Estacionamiento no encontrado' });
      }

      return res.status(200).json({
        message: 'Estacionamiento actualizado con éxito',
        data: updatedParking,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Error al actualizar estacionamiento',
        error: error.message,
      });
    }
  };

  public remove = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const deleted = await this.parkingService.deleteParking(id);

      if (!deleted) {
        return res.status(404).json({ message: 'Estacionamiento no encontrado' });
      }

      return res.status(200).json({
        message: 'Estacionamiento dado de baja con éxito',
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Error al dar de baja el estacionamiento',
        error: error.message,
      });
    }
  };
}