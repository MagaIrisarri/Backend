import { Request, Response } from 'express';
import { EntityManager } from '@mikro-orm/core';
import { VehicleType } from './VehicleType.Entity.js'; 

export class VehicleTypeController {
  constructor(private em: EntityManager) {}

  getAll = async (req: Request, res: Response) => {
    try {
      const vehicleTypes = await this.em.find(VehicleType, {});
      res.status(200).json(vehicleTypes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const vehicleType = this.em.create(VehicleType, req.body);
      await this.em.flush();
      res.status(201).json({ message: 'Tipo de vehículo creado', data: vehicleType });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const vehicleType = await this.em.findOne(VehicleType, { id: req.params.id });
      if (!vehicleType) {
        return res.status(404).json({ message: 'Tipo de vehículo no encontrado' });
      }
      this.em.remove(vehicleType);
      await this.em.flush();
      res.status(200).json({ message: 'Tipo de vehículo eliminado correctamente' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}