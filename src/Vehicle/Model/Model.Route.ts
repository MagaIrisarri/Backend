import { Router } from 'express';
import { ModelController } from './Model.Controller.js';
import { ModelService } from './Model.Service.js';
import { orm } from '../../Shared/db/orm.js'; 
import { validateSchema } from '../../Shared/middlewares/ValidateSchemas.js'; 
import { 
  createModelSchema, 
  UpdateModelSchema, 
  ModelIdSchema, 
  ModelQuerySchema 
} from './Model.Schema.js';

export const modelRouter = Router();

const modelService = new ModelService(orm.em.fork());

const modelController = new ModelController(modelService);


modelRouter.get('/', validateSchema(ModelQuerySchema), modelController.findAll);



modelRouter.get('/:id', validateSchema(ModelIdSchema), modelController.findById);


modelRouter.post('/', validateSchema(createModelSchema), modelController.create);


modelRouter.put(
  '/:id', 
  validateSchema(ModelIdSchema), 
  validateSchema(UpdateModelSchema), 
  modelController.update
);


modelRouter.delete('/:id', validateSchema(ModelIdSchema), modelController.delete);