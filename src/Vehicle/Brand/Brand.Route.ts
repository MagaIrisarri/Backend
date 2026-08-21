import { Router } from 'express';
import { BrandController } from './Brand.Controller.js';
import { BrandService } from './Brand.Service.js';
import { BrandRepository } from './Brand.Repository.js';
import { orm } from '../../Shared/db/orm.js'; 
import { validateSchema } from '../../Shared/middlewares/ValidateSchemas.js';
import { createBrandSchema, brandIdSchema } from './Brand.Schema.js';

export const brandRouter = Router();

const em = orm.em.fork();
const brandRepository = new BrandRepository(em);
const brandService = new BrandService(brandRepository);
const controller = new BrandController(brandService);

brandRouter.get('/', controller.getAll);
brandRouter.post('/', validateSchema(createBrandSchema), controller.create);
brandRouter.delete('/:id', validateSchema(brandIdSchema), controller.delete);