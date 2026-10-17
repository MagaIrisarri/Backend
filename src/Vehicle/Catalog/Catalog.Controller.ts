import { Request, Response } from 'express';
import { CatalogService } from './Catalog.Service.js';
import { catchAsync } from '../../Shared/utils/catchAsync.js';
import { actorId } from '../../Shared/utils/actorId.js';
import { AppError } from '../../Shared/utils/AppError.js';

export class CatalogController {
  constructor(private catalogService: CatalogService) {}

  public import = catchAsync(async (req: Request, res: Response) => {
    const { items, dryRun, typeMap, exclude } = req.body;
    const result = await this.catalogService.importItems(actorId(req, 'actualizar el catálogo'), items, dryRun, typeMap, exclude);
    res.status(200).json({ data: result });
  });

  public excluded = catchAsync(async (req: Request, res: Response) => {
    res.status(200).json({ data: await this.catalogService.excludedModels(actorId(req, 'ver el catálogo')) });
  });

  public readmit = catchAsync(async (req: Request, res: Response) => {
    if (!(await this.catalogService.readmit(actorId(req, 'actualizar el catálogo'), req.params.id as string))) {
      throw new AppError('Modelo no admitido no encontrado', 404);
    }
    res.status(200).json({ message: 'Modelo admitido de nuevo' });
  });
}
