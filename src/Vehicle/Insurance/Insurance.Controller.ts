import { Request, Response } from 'express';
import { InsuranceService } from './Insurance.Service.js';
import { catchAsync } from '../../Shared/utils/catchAsync.js';
import { AppError } from '../../Shared/utils/AppError.js';

export class InsuranceController {
  constructor(private insuranceService: InsuranceService) {}

  findAll = catchAsync(async (_req: Request, res: Response) => {
    const seguros = await this.insuranceService.findAll();
    res.status(200).json({ data: seguros });
  });

  findOne = catchAsync(async (req: Request, res: Response) => {
    const seguro = await this.insuranceService.findOne(req.params.id as string);
    if (!seguro) {
      throw new AppError('Aseguradora no encontrada', 404);
    }
    res.status(200).json({ data: seguro });
  });

  create = catchAsync(async (req: Request, res: Response) => {
    const seguro = await this.insuranceService.create(req.body);
    res.status(201).json({ message: 'Aseguradora creada con éxito', data: seguro });
  });

  update = catchAsync(async (req: Request, res: Response) => {
    const seguro = await this.insuranceService.update(req.params.id as string, req.body);
    if (!seguro) {
      throw new AppError('Aseguradora no encontrada', 404);
    }
    res.status(200).json({ message: 'Aseguradora actualizada exitosamente', data: seguro });
  });

  remove = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const isDeleted = await this.insuranceService.remove(id);
    
    if (!isDeleted) {
      throw new AppError('Aseguradora no encontrada', 404);
    }
    
    res.status(200).json({ message: 'Aseguradora eliminada correctamente' });
  });
}