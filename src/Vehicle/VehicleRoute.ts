import { Router } from 'express';
import { sanitizeVehicleInput, validateVehicleSchema } from "./VehicleValidations.js";
import { add, findAll, findOne, update, remove } from './VehicleController.js';

const VehicleRouter = Router();

VehicleRouter.post('/', sanitizeVehicleInput, validateVehicleSchema, add);
VehicleRouter.get('/', findAll);
VehicleRouter.get('/:id', findOne);
VehicleRouter.put('/:id', sanitizeVehicleInput, update);
VehicleRouter.patch('/:id', sanitizeVehicleInput, update);
VehicleRouter.delete('/:id', remove);

export default VehicleRouter;
