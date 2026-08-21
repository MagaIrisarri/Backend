import { Router } from 'express';
import { VehicleTypeController } from './VehicleType.Controller.js';
import { VehicleTypeService } from './VehicleType.Service.js';
import { VehicleTypeRepository } from './VehicleType.Repository.js'; // <-- Importamos el repo
import { orm } from '../../Shared/db/orm.js'; 
import { createVehicleTypeSchema } from './VehicleType.Schema.js';
import { validateSchema } from '../../Shared/middlewares/ValidateSchemas.js';

export const vehicleTypeRouter = Router();

const em = orm.em.fork();
const vehicleTypeRepository = new VehicleTypeRepository(em);
const vehicleTypeService = new VehicleTypeService(vehicleTypeRepository);
const controller = new VehicleTypeController(vehicleTypeService);

vehicleTypeRouter.get('/', controller.getAll);
vehicleTypeRouter.post('/', validateSchema(createVehicleTypeSchema), controller.create);
vehicleTypeRouter.delete('/:id', controller.delete);