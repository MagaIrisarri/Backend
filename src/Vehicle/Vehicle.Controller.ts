import { Request, Response } from 'express';
import { VehicleService } from './Vehicle.Service.js';

export class VehicleController {
  constructor(private vehicleService: VehicleService) {}

  public create = async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId as string;
      const vehicle = await this.vehicleService.create(req.body, userId);

      return res.status(201).json({ message: "Vehículo creado exitosamente", data: vehicle});

    } catch (error: any) {
      if (error.code === '23505' || error.message.includes('unique') || error.message.includes('duplicate')) {
        return res.status(409).json({ message: "Ya existe un vehículo registrado con esa patente."});
      }
      return res.status(500).json({ message: "Error al crear el vehículo", error: error.message });
    }
  }

  public findAll = async (req: Request, res: Response) => {
    try {
      const vehicleList = await this.vehicleService.findAll();

      const message = vehicleList.length === 0
          ? "No se encontraron vehículos"
          : "Vehículos encontrados";
      
      return res.status(200).json({ message, data: vehicleList });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public findOne = async (req: Request, res: Response) => {
    try {
      const vehicle = await this.vehicleService.findOne(req.params.id as string);

      if(!vehicle) {
        return res.status(404).json({ message: "No se encontró el vehículo" })
      }

      return res.status(200).json({ message: "Vehículo encontrado", data: vehicle});
    } catch (error: any) {
      return res.status(500).json({ error: error.message});
    }
  }

  public update = async (req: Request, res: Response) => {
    try {
      const vehicle = await this.vehicleService.update(
        req.params.id as string, 
        req.body
      );

      if(!vehicle) {
        return res.status(404).json({ message: "No se encontró el vehículo" });
      }

      return res.status(200).json({ message: "Vehículo actualizado exitosamente", data: vehicle });
    } catch (error: any) {
      return res.status(500).json({ error: error.message});
    }
  }

  public remove = async (req: Request, res: Response) => {
    try {
      const deleted = await this.vehicleService.remove(req.params.id as string);

      if (!deleted) {
        return res.status(404).json({ message: "No se encontró el vehículo"});
      }

      return res.status(200).json({ message: "Vehículo eliminado exitosamente"});
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}