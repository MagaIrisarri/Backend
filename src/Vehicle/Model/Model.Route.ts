import { Router } from 'express';
import { validateSchema } from '../../Shared/middlewares/ValidateSchemas.js';
import { orm } from '../../Shared/db/orm.js';

import { ModelController } from './Model.Controller.js';
import { ModelRepository } from './Model.Repository.js';
import { ModelService } from './Model.Service.js';
import { ModelIdSchema, ModelQuerySchema } from './Model.Schema.js';

export const modelRouter = Router();

const modelRepository = new ModelRepository(orm.em);
const modelService = new ModelService(modelRepository);
const modelController = new ModelController(modelService);

// Solo lectura (RA-25): un modelo no cambia de tipo ni de marca, así la copia del tipo en sus vehículos no se desincroniza.
modelRouter.get('/', validateSchema(ModelQuerySchema), modelController.findAll);
modelRouter.get('/:id', validateSchema(ModelIdSchema), modelController.findOne);

export default modelRouter;
