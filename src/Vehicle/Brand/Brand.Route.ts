import { Router } from 'express';
import { validateSchema } from '../../Shared/middlewares/ValidateSchemas.js';
import { orm } from '../../Shared/db/orm.js'; 

import { BrandController } from './Brand.Controller.js';
import { BrandRepository } from './Brand.Repository.js';
import { BrandService } from './Brand.Service.js';
import { createBrandSchema, brandIdSchema } from './Brand.Schema.js';

export const brandRouter = Router();

const brandRepository = new BrandRepository(orm.em);
const brandService = new BrandService(brandRepository);
const brandController = new BrandController(brandService);

brandRouter.get('/', brandController.getAll);
brandRouter.post('/', validateSchema(createBrandSchema), brandController.create);
brandRouter.delete('/:id', validateSchema(brandIdSchema), brandController.delete);