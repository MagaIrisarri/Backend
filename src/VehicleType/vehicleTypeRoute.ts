import { Router } from 'express'
import { sanitizeVehicleTypeInput, validateVehicleTypeSchema } from './vehicleTypeValidations.js';
import { add, findAll, findOne, remove, update} from './vehicleTypeController.js';

const vehicleTypeRouter = Router();

vehicleTypeRouter.post('/', sanitizeVehicleTypeInput, validateVehicleTypeSchema, add);
vehicleTypeRouter.get('/', findAll);
vehicleTypeRouter.get('/:id', findOne);
vehicleTypeRouter.put('/:id', sanitizeVehicleTypeInput, update);
vehicleTypeRouter.patch('/:id', sanitizeVehicleTypeInput, update);
vehicleTypeRouter.delete('/:id', remove);

export default vehicleTypeRouter;