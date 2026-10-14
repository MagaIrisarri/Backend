import { Request, Response } from 'express';
import { BrandService } from './Brand.Service.js';
import { catchAsync } from '../../Shared/utils/catchAsync.js';
import { AppError } from '../../Shared/utils/AppError.js';

export class BrandController {
  constructor(private brandService: BrandService) {}

  findAll = catchAsync(async (_req: Request, res: Response) => {
    const marcas = await this.brandService.findAll();
    res.status(200).json({ data: marcas });
  });

  findOne = catchAsync(async (req: Request, res: Response) => {
    const marca = await this.brandService.findOne(req.params.id as string);
    if (!marca) {
      throw new AppError('Marca no encontrada', 404);
    }
    res.status(200).json({ data: marca });
  });
}
