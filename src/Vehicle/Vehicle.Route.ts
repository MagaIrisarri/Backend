import { Router } from "express";
import { validateSchema } from '../Shared/middlewares/ValidateSchemas.js';
import { auth, self, ownVehicle } from '../Shared/middlewares/auth.js';
import { UserType } from '../Shared/constants/status.js';
import { orm } from '../Shared/db/orm.js'; 

import { VehicleController } from "./Vehicle.Controller.js";
import { VehicleRepository } from "./Vehicle.Repository.js";
import { VehicleService } from "./Vehicle.Service.js";
import { createVehicleSchema, UpdateVehicleSchema, VehicleIdSchema, ClientIdSchema } from './Vehicle.Schema.js';

export const VehicleRouter = Router();

const vehicleRepository = new VehicleRepository(orm.em);
const vehicleService = new VehicleService(vehicleRepository);
const vehicleController = new VehicleController(vehicleService); 

VehicleRouter.get('/', auth(UserType.ADMINISTRADOR), vehicleController.findAll);
VehicleRouter.get('/client/:id', auth(), self('id'), vehicleController.findActiveByUserId);
VehicleRouter.get('/:id', auth(), ownVehicle((req) => req.params.id), validateSchema(VehicleIdSchema), vehicleController.findOne);
VehicleRouter.post('/client/:userId', auth(UserType.CLIENTE), self('userId'), validateSchema(ClientIdSchema), validateSchema(createVehicleSchema), vehicleController.create);
VehicleRouter.put('/:id', auth(UserType.CLIENTE), ownVehicle((req) => req.params.id), validateSchema(VehicleIdSchema), validateSchema(UpdateVehicleSchema), vehicleController.update);
VehicleRouter.patch('/:id', auth(UserType.CLIENTE), ownVehicle((req) => req.params.id), validateSchema(VehicleIdSchema), validateSchema(UpdateVehicleSchema), vehicleController.update);
VehicleRouter.delete('/:id', auth(UserType.CLIENTE), ownVehicle((req) => req.params.id), validateSchema(VehicleIdSchema), vehicleController.remove);

export default VehicleRouter;