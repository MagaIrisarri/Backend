import { Router } from "express";
import { validateSchema } from '../Shared/middlewares/ValidateSchemas.js';
import { orm } from '../Shared/db/orm.js'; 

import { VehicleController } from "./Vehicle.Controller.js";
import { VehicleRepository } from "./Vehicle.Repository.js";
import { VehicleService } from "./Vehicle.Service.js";
import { createVehicleSchema, UpdateVehicleSchema, VehicleIdSchema, ClientIdSchema } from './Vehicle.Schema.js';

export const VehicleRouter = Router();

const vehicleRepository = new VehicleRepository(orm.em);
const vehicleService = new VehicleService(vehicleRepository);
const vehicleController = new VehicleController(vehicleService); 

VehicleRouter.get('/', vehicleController.findAll);
VehicleRouter.get('/client/:id', vehicleController.findActiveByUserId);
VehicleRouter.get('/:id', validateSchema(VehicleIdSchema), vehicleController.findOne);
VehicleRouter.post('/client/:userId', validateSchema(ClientIdSchema), validateSchema(createVehicleSchema), vehicleController.create);
VehicleRouter.put('/:id', validateSchema(VehicleIdSchema), validateSchema(UpdateVehicleSchema), vehicleController.update);
VehicleRouter.patch('/:id', validateSchema(VehicleIdSchema), validateSchema(UpdateVehicleSchema), vehicleController.update);
VehicleRouter.delete('/:id', validateSchema(VehicleIdSchema), vehicleController.remove);

export default VehicleRouter;