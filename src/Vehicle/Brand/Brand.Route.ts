import { Router } from 'express';
import { BrandController } from './Brand.Controller.js';
import { BrandService } from './Brand.Service.js';
import { orm } from '../../Shared/db/orm.js'; 
import { validateSchema } from '../../Shared/middlewares/ValidateSchemas.js';
import { createBrandSchema, brandIdSchema } from './Brand.Schema.js';

export const brandRouter = Router();

const brandService = new BrandService(orm.em.fork());
const controller = new BrandController(brandService);

brandRouter.get('/', controller.getAll);

brandRouter.post('/', validateSchema(createBrandSchema), controller.create);

brandRouter.delete('/:id', validateSchema(brandIdSchema), controller.delete);