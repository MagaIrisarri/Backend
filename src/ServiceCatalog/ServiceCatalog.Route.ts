import { Router } from 'express';
import { validateSchema } from '../Shared/middlewares/ValidateSchemas.js';
import { auth } from '../Shared/middlewares/auth.js';
import { UserType } from '../Shared/constants/status.js';
import { orm } from '../Shared/db/orm.js';

import { ServiceCatalogController } from './ServiceCatalog.Controller.js';
import { ServiceCatalogRepository } from './ServiceCatalog.Repository.js';
import { ServiceCatalogService } from './ServiceCatalog.Service.js';
import { createServiceCatalogSchema, updateServiceCatalogSchema, serviceCatalogIdSchema} from './ServiceCatalog.Schema.js';

export const serviceCatalogRouter = Router();

const scRepository = new ServiceCatalogRepository(orm.em);
const scService = new ServiceCatalogService(scRepository);
const scController = new ServiceCatalogController(scService);

serviceCatalogRouter.get('/', scController.findAll);
serviceCatalogRouter.get('/:id', validateSchema(serviceCatalogIdSchema), scController.findOne);
serviceCatalogRouter.post('/', auth(UserType.ADMINISTRADOR), validateSchema(createServiceCatalogSchema), scController.create);
serviceCatalogRouter.put('/:id', auth(UserType.ADMINISTRADOR), validateSchema(serviceCatalogIdSchema), validateSchema(updateServiceCatalogSchema), scController.update);
serviceCatalogRouter.patch('/:id', auth(UserType.ADMINISTRADOR), validateSchema(serviceCatalogIdSchema), validateSchema(updateServiceCatalogSchema), scController.update);
serviceCatalogRouter.delete('/:id', auth(UserType.ADMINISTRADOR), validateSchema(serviceCatalogIdSchema), scController.remove);

export default serviceCatalogRouter;