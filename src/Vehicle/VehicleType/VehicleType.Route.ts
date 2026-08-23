import { Router } from 'express';
import { validateSchema } from '../../Shared/middlewares/ValidateSchemas.js';
import { orm } from '../../Shared/db/orm.js'; 

import { VehicleTypeController } from './VehicleType.Controller.js';
import { VehicleTypeRepository } from './VehicleType.Repository.js';
import { VehicleTypeService } from './VehicleType.Service.js';
import { createVehicleTypeSchema, updateVehicleTypeSchema, vehicleTypeIdSchema } from './VehicleType.Schema.js';

export const vehicleTypeRouter = Router();

const vehicleTypeRepository = new VehicleTypeRepository(orm.em);
const vehicleTypeService = new VehicleTypeService(vehicleTypeRepository);
const vehicleTypeController = new VehicleTypeController(vehicleTypeService);

vehicleTypeRouter.get('/', vehicleTypeController.findAll);
vehicleTypeRouter.get('/:id', validateSchema(vehicleTypeIdSchema), vehicleTypeController.findOne);
vehicleTypeRouter.post('/', validateSchema(createVehicleTypeSchema), vehicleTypeController.create);
vehicleTypeRouter.put('/:id', validateSchema(vehicleTypeIdSchema), validateSchema(updateVehicleTypeSchema), vehicleTypeController.update);
vehicleTypeRouter.patch('/:id', validateSchema(vehicleTypeIdSchema), validateSchema(updateVehicleTypeSchema), vehicleTypeController.update);
vehicleTypeRouter.delete('/:id', validateSchema(vehicleTypeIdSchema), vehicleTypeController.remove);

export default vehicleTypeRouter;