import { Router } from 'express';
import { validateSchema } from '../../Shared/middlewares/ValidateSchemas.js';
import { orm } from '../../Shared/db/orm.js';

import { BrandController } from './Brand.Controller.js';
import { BrandRepository } from './Brand.Repository.js';
import { BrandService } from './Brand.Service.js';
import { brandIdSchema } from './Brand.Schema.js';

export const brandRouter = Router();

const brandRepository = new BrandRepository(orm.em);
const brandService = new BrandService(brandRepository);
const brandController = new BrandController(brandService);

// Solo lectura (RA-25): el catálogo de marcas y modelos se mantiene con el CSV del DNRPA (POST /api/catalog/import).
brandRouter.get('/', brandController.findAll);
brandRouter.get('/:id', validateSchema(brandIdSchema), brandController.findOne);

export default brandRouter;
