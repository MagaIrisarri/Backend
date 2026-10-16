import { Request, Response } from 'express';
import { CatalogService } from './Catalog.Service.js';
import { catchAsync } from '../../Shared/utils/catchAsync.js';
import { actorId } from '../../Shared/utils/actorId.js';

export class CatalogController {
  constructor(private catalogService: CatalogService) {}

  public import = catchAsync(async (req: Request, res: Response) => {
    const { items, dryRun, typeMap } = req.body;
    const result = await this.catalogService.importItems(actorId(req, 'actualizar el catálogo'), items, dryRun, typeMap);
    res.status(200).json({ data: result });
  });
}
