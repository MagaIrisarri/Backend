import { Request, Response } from 'express';
import { ParkingSpaceService } from './ParkingSpace.Service.js';

export class ParkingSpaceController {
  constructor(private service: ParkingSpaceService) {}

  public create = async (req: Request, res: Response) => {
    try {
      const parkingId = req.params.id as string;
      const parkingSpace = await this.service.create(parkingId, req.body);

      return res.status(201).json({ message: 'Plaza de estacionamiento creada con éxito', data: parkingSpace });
    } catch (error: any) {
      return res.status(500).json({ message: 'Error al crear la plaza de estacionamiento', error: error.message });
    }
  };

  public findByParking = async (req: Request, res: Response) => {
    try {
      const parkingId = req.params.id as string;
      const spaces = await this.service.findByParking(parkingId);

      const message = spaces.length === 0
        ? 'No se encontraron plazas para este estacionamiento'
        : 'Plazas encontradas';

      return res.status(200).json({ message, data: spaces });
    } catch (error: any) {
      return res.status(500).json({ message: 'Error al obtener plazas', error: error.message });
    }
  };

  public findAvailable = async (req: Request, res: Response) => {
    try {
      const parkingId = req.params.id as string;
      const spaces = await this.service.findAvailable(parkingId);

      const message = spaces.length === 0
        ? 'No hay plazas disponibles'
        : 'Plazas disponibles encontradas';

      return res.status(200).json({ message, data: spaces });
    } catch (error: any) {
      return res.status(500).json({ message: 'Error al consultar disponibilidad', error: error.message });
    }
  };

  public findAvailableByVehicleType = async (req: Request, res: Response) => {
    try {
      const parkingId = req.params.id as string;
      const vehicleType = req.params.vehicleType as string;

      const spaces = await this.service.findAvailableByVehicleType(parkingId, vehicleType);

      const message = spaces.length === 0
        ? 'No hay plazas disponibles para este tipo de vehículo'
        : 'Plazas disponibles encontradas';

      return res.status(200).json({ message, data: spaces });
    } catch (error: any) {
      return res.status(500).json({ message: 'Error al consultar disponibilidad por tipo de vehículo', error: error.message });
    }
  };

  public remove = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const deleted = await this.service.remove(id);

      if (!deleted) return res.status(404).json({ message: 'Plaza de estacionamiento no encontrada' });
      return res.status(200).json({ message: 'Plaza de estacionamiento dada de baja correctamente' });
    } catch (error: any) {
      return res.status(500).json({ message: 'Error al eliminar plaza de estacionamiento', error: error.message });
    }
  };
}