import { Router } from 'express';
import { validateSchema } from '../Shared/middlewares/ValidateSchemas.js';
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
serviceCatalogRouter.post('/', validateSchema(createServiceCatalogSchema), scController.create);
serviceCatalogRouter.put('/:id', validateSchema(serviceCatalogIdSchema), validateSchema(updateServiceCatalogSchema), scController.update);
serviceCatalogRouter.patch('/:id', validateSchema(serviceCatalogIdSchema), validateSchema(updateServiceCatalogSchema), scController.update);
serviceCatalogRouter.delete('/:id', validateSchema(serviceCatalogIdSchema), scController.remove);

export default serviceCatalogRouter;