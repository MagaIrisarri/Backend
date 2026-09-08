import { Request, Response } from 'express';
import { VehicleTypeService } from './VehicleType.Service.js';
import { catchAsync } from '../../Shared/utils/catchAsync.js';
import { AppError } from '../../Shared/utils/AppError.js';

export class VehicleTypeController {
  constructor(private vehicleTypeService: VehicleTypeService) {}

  findAll = catchAsync(async (_req: Request, res: Response) => {
    const vehicleTypes = await this.vehicleTypeService.findAll();
    res.status(200).json({ data: vehicleTypes });
  });

  findOne = catchAsync(async (req: Request, res: Response) => {
    const vehicleType = await this.vehicleTypeService.findOne(req.params.id as string);
    if (!vehicleType) {
      throw new AppError('Tipo de vehículo no encontrado', 404);
    }
    res.status(200).json({ data: vehicleType });
  });

  create = catchAsync(async (req: Request, res: Response) => {
    const vehicleType = await this.vehicleTypeService.create(req.body);
    res.status(201).json({ message: 'Tipo de vehículo creado', data: vehicleType });
  });

  update = catchAsync(async (req: Request, res: Response) => {
    const vehicleType = await this.vehicleTypeService.update(req.params.id as string, req.body);
    if (!vehicleType) {
      throw new AppError('Tipo de vehículo no encontrado', 404);
    }
    res.status(200).json({ message: 'Tipo de vehículo actualizado exitosamente', data: vehicleType });
  });

  remove = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const isDeleted = await this.vehicleTypeService.remove(id);
    
    if (!isDeleted) {
      throw new AppError('Tipo de vehículo no encontrado', 404);
    }
    
    return res.status(200).json({ message: 'Tipo de vehículo eliminado correctamente' });
  });
}