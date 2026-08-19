import { Router } from 'express';
import { VehicleTypeController } from './VehicleType.Controller.js';
import { orm } from '../../Shared/db/orm.js'; 
import { createVehicleTypeSchema } from './VehicleType.Schema.js';
import { validateSchema } from '../../Shared/middlewares/ValidateSchemas.js';

export const vehicleTypeRouter = Router();
const controller = new VehicleTypeController(orm.em.fork());

vehicleTypeRouter.get('/', controller.getAll);


vehicleTypeRouter.post(
  '/', 
  validateSchema(createVehicleTypeSchema), 
  controller.create
);


vehicleTypeRouter.delete('/:id', controller.delete);