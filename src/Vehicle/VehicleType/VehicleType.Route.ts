import { Router } from 'express';
import { VehicleTypeController } from './VehicleType.Controller.js';
import { VehicleTypeService } from './VehicleType.Service.js';
import { orm } from '../../Shared/db/orm.js'; 
import { createVehicleTypeSchema } from './VehicleType.Schema.js';
import { validateSchema } from '../../Shared/middlewares/ValidateSchemas.js';

export const vehicleTypeRouter = Router();
const vehicleTypeService = new VehicleTypeService(orm.em.fork());

const controller = new VehicleTypeController(vehicleTypeService);

vehicleTypeRouter.get('/', controller.getAll);

vehicleTypeRouter.post('/', validateSchema(createVehicleTypeSchema), controller.create);

vehicleTypeRouter.delete('/:id', controller.delete);