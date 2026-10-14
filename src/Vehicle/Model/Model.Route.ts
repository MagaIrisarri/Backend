import { Router } from 'express';
import { validateSchema } from '../../Shared/middlewares/ValidateSchemas.js'; 
import { auth } from '../../Shared/middlewares/auth.js';
import { UserType } from '../../Shared/constants/status.js';
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
modelRouter.get('/:id', validateSchema(ModelIdSchema), modelController.findOne);
modelRouter.post('/', auth(UserType.ADMINISTRADOR), validateSchema(createModelSchema), modelController.create);
modelRouter.put('/:id', auth(UserType.ADMINISTRADOR), validateSchema(ModelIdSchema), validateSchema(UpdateModelSchema), modelController.update);
modelRouter.patch('/:id', auth(UserType.ADMINISTRADOR), validateSchema(ModelIdSchema), validateSchema(UpdateModelSchema), modelController.update);
modelRouter.delete('/:id', auth(UserType.ADMINISTRADOR), validateSchema(ModelIdSchema), modelController.remove);

export default modelRouter;