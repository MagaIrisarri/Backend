import { Router } from 'express';
import { validateSchema } from '../../Shared/middlewares/ValidateSchemas.js'; 
import { orm } from '../../Shared/db/orm.js'; 

import { ModelController } from './Model.Controller.js';
import { ModelRepository } from './Model.Repository.js';
import { ModelService } from './Model.Service.js';
import { createModelSchema, UpdateModelSchema, ModelIdSchema, ModelQuerySchema } from './Model.Schema.js';

export const modelRouter = Router();

const modelRepository = new ModelRepository(orm.em);
const modelService = new ModelService(modelRepository);
const modelController = new ModelController(modelService);

modelRouter.get('/', validateSchema(ModelQuerySchema), modelController.findAll);
modelRouter.get('/:id', validateSchema(ModelIdSchema), modelController.findById);
modelRouter.post('/', validateSchema(createModelSchema), modelController.create);
modelRouter.put('/:id', validateSchema(ModelIdSchema), validateSchema(UpdateModelSchema), modelController.update);
modelRouter.delete('/:id', validateSchema(ModelIdSchema), modelController.delete);