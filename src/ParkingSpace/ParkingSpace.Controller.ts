import { Request, Response } from 'express';
import { ParkingSpaceService } from './ParkingSpace.Service.js';

export class ParkingSpaceController {
  constructor(private parkingSpaceService: ParkingSpaceService) {}

  findByParking = async (req: Request, res: Response) => {
    try {
      const parkingId = req.params.parkingId as string;
      const spaces = await this.parkingSpaceService.findByParking(parkingId);
      
      return res.status(200).json({
        message: spaces.length === 0 ? 'No se encontraron plazas' : 'Plazas encontradas',
        data: spaces,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Error al obtener plazas',
        error: error.message,
      });
    }
  };

  findAvailable = async (req: Request, res: Response) => {
    try {
      const parkingId = req.params.parkingId as string;
      const vehicleType = req.query.vehicleType as string | undefined;
      const spaces = await this.parkingSpaceService.findAvailable(parkingId, vehicleType);

      return res.status(200).json({
        message: 'Plazas disponibles encontradas',
        data: spaces,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Error al consultar plazas disponibles',
        error: error.message,
      });
    }
  };

  findOne = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const space = await this.parkingSpaceService.findOne(id);

      if (!space) {
        return res.status(404).json({ message: 'Plaza no encontrada' });
      }

      return res.status(200).json({
        message: 'Plaza encontrada',
        data: space,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Error al consultar plaza',
        error: error.message,
      });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const parkingId = req.params.parkingId as string;
      const space = await this.parkingSpaceService.create(parkingId, req.body);

      return res.status(201).json({
        message: 'Plaza creada con éxito',
        data: space,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Error al crear plaza',
        error: error.message,
      });
    }
  };

  createBulk = async (req: Request, res: Response) => {
    try {
      const parkingId = req.params.parkingId as string;
      await this.parkingSpaceService.createBulkManual(parkingId, req.body);

      return res.status(201).json({
        message: 'Plazas generadas en lote con éxito',
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Error al generar plazas en lote',
        error: error.message,
      });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const updatedSpace = await this.parkingSpaceService.update(id, req.body);

      if (!updatedSpace) {
        return res.status(404).json({ message: 'Plaza no encontrada' });
      }

      return res.status(200).json({
        message: 'Plaza actualizada con éxito',
        data: updatedSpace,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Error al actualizar plaza',
        error: error.message,
      });
    }
  };

  remove = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const isDeleted = await this.parkingSpaceService.remove(id);

      if (!isDeleted) {
        return res.status(404).json({ message: 'Plaza no encontrada' });
      }

      return res.status(200).json({
        message: 'Plaza dada de baja con éxito',
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Error al eliminar plaza',
        error: error.message,
      });
    }
  };
}