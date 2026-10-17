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

  // Sin :id (ruta /not-admitted/descriptions): el grupo de las descripciones no admitidas (L-33).
  descriptions = catchAsync(async (req: Request, res: Response) => {
    const list = await this.vehicleTypeService.descriptions((req.params.id as string | undefined) ?? null);
    if (!list) throw new AppError('Tipo de vehículo no encontrado', 404);
    res.status(200).json({ data: list });
  });

  // Con dryRun, solo lo que cambiaría (modelos, vehículos y reservas activas que lo impiden).
  setDescriptions = catchAsync(async (req: Request, res: Response) => {
    const result = await this.vehicleTypeService.setDescriptions((req.params.id as string | undefined) ?? null, req.body.descriptions, req.body.dryRun);
    if (!result) throw new AppError('Tipo de vehículo no encontrado', 404);
    res.status(200).json({ message: req.body.dryRun ? 'Vista previa del cambio' : 'Descripciones asignadas', data: result });
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