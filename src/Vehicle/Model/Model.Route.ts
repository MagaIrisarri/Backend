import { Router } from 'express';
import { ModelController } from './Model.Controller.js';
import { orm } from '../../Shared/db/orm.js'; 
import { validateSchema } from '../../Shared/middlewares/ValidateSchemas.js'; 
import { 
  createModelSchema, 
  UpdateModelSchema, 
  ModelIdSchema, 
  ModelQuerySchema 
} from './Model.Schema.js';

export const modelRouter = Router();

const modelController = new ModelController(orm.em);


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