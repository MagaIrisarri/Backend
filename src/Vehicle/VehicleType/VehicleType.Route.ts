import { Router } from 'express';
import { validateSchema } from '../../Shared/middlewares/ValidateSchemas.js';
import { orm } from '../../Shared/db/orm.js'; 

import { VehicleTypeController } from './VehicleType.Controller.js';
import { VehicleTypeRepository } from './VehicleType.Repository.js'; // <-- Importamos el repo
import { VehicleTypeService } from './VehicleType.Service.js';
import { createVehicleTypeSchema } from './VehicleType.Schema.js';

export const vehicleTypeRouter = Router();

const vehicleTypeRepository = new VehicleTypeRepository(orm.em);
const vehicleTypeService = new VehicleTypeService(vehicleTypeRepository);
const vehicleTypecontroller = new VehicleTypeController(vehicleTypeService);

vehicleTypeRouter.get('/', vehicleTypecontroller.getAll);
vehicleTypeRouter.post('/', validateSchema(createVehicleTypeSchema), vehicleTypecontroller.create);
vehicleTypeRouter.delete('/:id', vehicleTypecontroller.delete);