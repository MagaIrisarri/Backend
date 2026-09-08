import { Request, Response } from 'express';
import { ModelService } from './Model.Service.js';
import { catchAsync } from '../../Shared/utils/catchAsync.js';
import { AppError } from '../../Shared/utils/AppError.js';

export class ModelController {
  constructor(private modelService: ModelService) {}

  public findAll = catchAsync(async (req: Request, res: Response) => {
    const brandId = req.query.brandId as string; 
    const models = await this.modelService.findAll(brandId);
    
    res.status(200).json({ data: models });
  });

  public findOne = catchAsync(async (req: Request, res: Response) => {
    const model = await this.modelService.findOne(req.params.id as string);
    
    if (!model) {
      throw new AppError('Modelo no encontrado', 404);
    }
    
    res.status(200).json({ data: model });
  });

  public create = catchAsync(async (req: Request, res: Response) => {
    const model = await this.modelService.create(req.body);
    res.status(201).json({ message: 'Modelo creado Exitosamente', data: model });
  });

  public update = catchAsync(async (req: Request, res: Response) => {
    const updatedModel = await this.modelService.update(req.params.id as string, req.body);
    
    if (!updatedModel) {
      throw new AppError('Modelo no Encontrado', 404);
    }
    
    res.status(200).json({ message: 'Modelo actualizado Exitosamente', data: updatedModel });
  });

  public remove = catchAsync(async (req: Request, res: Response) => {
    const deleted = await this.modelService.remove(req.params.id as string);
    
    if (!deleted) {
      throw new AppError('Modelo no encontrado', 404);
    }
    
    res.status(200).json({ message: 'Modelo Elimnado Exitosamente' });
  });
}