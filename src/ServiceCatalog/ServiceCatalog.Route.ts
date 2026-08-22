import { Router } from 'express';
import { ServiceCatalogController } from './ServiceCatalog.Controller.js';
import { ServiceCatalogService } from './ServiceCatalog.Service.js';
import { ServiceCatalogRepository } from './ServiceCatalog.Repository.js';
import { orm } from '../Shared/db/orm.js';
import { validateSchema } from '../Shared/middlewares/ValidateSchemas.js';
import {
  createServiceCatalogSchema,
  updateServiceCatalogSchema,
  serviceCatalogIdSchema,
} from './ServiceCatalog.Schema.js';

export const serviceCatalogRouter = Router();

const em = orm.em.fork();
const repository = new ServiceCatalogRepository(em);
const service = new ServiceCatalogService(repository);
const controller = new ServiceCatalogController(service);

serviceCatalogRouter.get('/', controller.findAll);
serviceCatalogRouter.get('/:id', validateSchema(serviceCatalogIdSchema), controller.findOne);
serviceCatalogRouter.post('/', validateSchema(createServiceCatalogSchema), controller.create);
serviceCatalogRouter.put('/:id', validateSchema(serviceCatalogIdSchema), validateSchema(updateServiceCatalogSchema), controller.update);
serviceCatalogRouter.patch('/:id', validateSchema(serviceCatalogIdSchema), validateSchema(updateServiceCatalogSchema), controller.update);
serviceCatalogRouter.delete('/:id', validateSchema(serviceCatalogIdSchema), controller.remove);

export default serviceCatalogRouter;