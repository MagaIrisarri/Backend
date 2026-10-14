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
}
