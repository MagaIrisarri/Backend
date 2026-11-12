import { Request, Response } from 'express';
import { VehicleService } from './Vehicle.Service.js';
import { AppError } from '../Shared/utils/AppError.js';

export class VehicleController {
  constructor(private vehicleService: VehicleService) {}

  public create = async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const vehicle = await this.vehicleService.create(req.body, userId);

    return res.status(201).json({ message: "Vehículo creado exitosamente", data: vehicle });
  };

  public findAll = async (req: Request, res: Response) => {
    const vehicleList = await this.vehicleService.findAll();

    const message = vehicleList.length === 0
        ? "No se encontraron vehículos"
        : "Vehículos encontrados";
    
    return res.status(200).json({ message, data: vehicleList });
  };

  public findOne = async (req: Request, res: Response) => {
    const vehicle = await this.vehicleService.findOne(req.params.id as string);

    if (!vehicle) {
      throw new AppError("No se encontró el vehículo", 404);
    }

    return res.status(200).json({ message: "Vehículo encontrado", data: vehicle });
  };

  public update = async (req: Request, res: Response) => {
    const vehicle = await this.vehicleService.update(
      req.params.id as string, 
      req.body
    );

    if (!vehicle) {
      throw new AppError("No se encontró el vehículo", 404);
    }

    return res.status(200).json({ message: "Vehículo actualizado exitosamente", data: vehicle });
  };

  public remove = async (req: Request, res: Response) => {
    const deleted = await this.vehicleService.remove(req.params.id as string);

    if (!deleted) {
      throw new AppError("No se encontró el vehículo", 404);
    }

    return res.status(200).json({ message: "Vehículo eliminado exitosamente" });
  };

  public findActiveByUserId = async (req: Request, res: Response) => {
    const vehicleList = await this.vehicleService.findActiveByUserId(req.params.id as string);

    const message = vehicleList.length === 0
        ? "No se encontraron vehículos"
        : "Vehículos encontrados";
    
    return res.status(200).json({ message, data: vehicleList });
  };
}