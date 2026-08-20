import { Request, Response } from 'express';
import { VehicleTypeService } from './VehicleType.Service.js';
// Borramos la importación de la entidad porque ya no se usa acá

export class VehicleTypeController {
  constructor(private vehicleTypeService: VehicleTypeService) {}

  getAll = async (req: Request, res: Response) => {
    try {
      const vehicleTypes = await this.vehicleTypeService.findAll();
      res.status(200).json(vehicleTypes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const vehicleType = await this.vehicleTypeService.create(req.body);
      res.status(201).json({ message: 'Tipo de vehículo creado', data: vehicleType });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;

      const isDeleted = await this.vehicleTypeService.delete(id);
      
      if (!isDeleted) {
        return res.status(404).json({ message: 'Tipo de vehículo no encontrado' });
      }
      
      return res.status(200).json({ message: 'Tipo de vehículo eliminado correctamente' });
      
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}