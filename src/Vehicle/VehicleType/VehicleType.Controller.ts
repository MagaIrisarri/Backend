import { Request, Response } from 'express';
import { VehicleTypeService } from './VehicleType.Service.js';

export class VehicleTypeController {
  constructor(private vehicleTypeService: VehicleTypeService) {}

  findAll = async (_req: Request, res: Response) => {
    try {
      const vehicleTypes = await this.vehicleTypeService.findAll();
      res.status(200).json({ data: vehicleTypes });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  findOne = async (req: Request, res: Response) => {
    try {
      const vehicleType = await this.vehicleTypeService.findOne(req.params.id as string);
      if (!vehicleType) {
        return res.status(404).json({ message: 'Tipo de vehículo no encontrado' });
      }
      res.status(200).json({ data: vehicleType });
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

  update = async (req: Request, res: Response) => {
    try {
      const vehicleType = await this.vehicleTypeService.update(req.params.id as string, req.body);
      if (!vehicleType) {
        return res.status(404).json({ message: 'Tipo de vehículo no encontrado' });
      }
      res.status(200).json({ message: 'Tipo de vehículo actualizado exitosamente', data: vehicleType });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  remove = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const isDeleted = await this.vehicleTypeService.remove(id);
      
      if (!isDeleted) {
        return res.status(404).json({ message: 'Tipo de vehículo no encontrado' });
      }
      
      return res.status(200).json({ message: 'Tipo de vehículo eliminado correctamente' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}