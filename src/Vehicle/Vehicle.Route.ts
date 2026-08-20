import { Router } from "express";
import { add, findAll, findOneById, update, remove } from "./Vehicle.Controller.js";
import { validateSchema } from '../Shared/middlewares/ValidateSchemas.js';
import { createVehicleSchema, UpdateVehicleSchema, VehicleIdSchema, ClientIdSchema } from './Vehicle.Schema.js';

export const VehicleRouter = Router();

VehicleRouter.post('/client/:userId', validateSchema(ClientIdSchema), validateSchema(createVehicleSchema), add);

VehicleRouter.get('/', findAll);

VehicleRouter.get('/:id', validateSchema(VehicleIdSchema), findOneById);

VehicleRouter.put('/:id', validateSchema(VehicleIdSchema), validateSchema(UpdateVehicleSchema), update);

VehicleRouter.delete('/:id', validateSchema(VehicleIdSchema), remove);

export default VehicleRouter;