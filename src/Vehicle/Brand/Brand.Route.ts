import { Router } from 'express';
import { validateSchema } from '../../Shared/middlewares/ValidateSchemas.js';
import { auth } from '../../Shared/middlewares/auth.js';
import { UserType } from '../../Shared/constants/status.js';
import { orm } from '../../Shared/db/orm.js'; 

import { BrandController } from './Brand.Controller.js';
import { BrandRepository } from './Brand.Repository.js';
import { BrandService } from './Brand.Service.js';
import { createBrandSchema, updateBrandSchema, brandIdSchema } from './Brand.Schema.js';

export const brandRouter = Router();

const brandRepository = new BrandRepository(orm.em);
const brandService = new BrandService(brandRepository);
const brandController = new BrandController(brandService);

brandRouter.get('/', brandController.findAll);
brandRouter.get('/:id', validateSchema(brandIdSchema), brandController.findOne);
brandRouter.post('/', auth(UserType.ADMINISTRADOR), validateSchema(createBrandSchema), brandController.create);
brandRouter.put('/:id', auth(UserType.ADMINISTRADOR), validateSchema(brandIdSchema), validateSchema(updateBrandSchema), brandController.update);
brandRouter.patch('/:id', auth(UserType.ADMINISTRADOR), validateSchema(brandIdSchema), validateSchema(updateBrandSchema), brandController.update);
brandRouter.delete('/:id', auth(UserType.ADMINISTRADOR), validateSchema(brandIdSchema), brandController.remove);

export default brandRouter;