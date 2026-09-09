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

  create = catchAsync(async (req: Request, res: Response) => {
    const marca = await this.brandService.create(req.body);
    res.status(201).json({ message: 'Marca creada con éxito', data: marca });
  });

  update = catchAsync(async (req: Request, res: Response) => {
    const marca = await this.brandService.update(req.params.id as string, req.body);
    if (!marca) {
      throw new AppError('Marca no encontrada', 404);
    }
    res.status(200).json({ message: 'Marca actualizada exitosamente', data: marca });
  });

  remove = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const isDeleted = await this.brandService.remove(id);
    
    if (!isDeleted) {
      throw new AppError('Marca no encontrada', 404);
    }
    
    return res.status(200).json({ message: 'Marca eliminada correctamente' });
  });
}