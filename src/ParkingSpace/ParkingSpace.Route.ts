import { Router } from 'express';
import { validateSchema } from '../Shared/middlewares/ValidateSchemas.js';
import { orm } from '../Shared/db/orm.js';

import { ParkingSpaceController } from './ParkingSpace.Controller.js';
import { ParkingSpaceRepository } from './ParkingSpace.Repository.js';
import { ParkingSpaceService } from './ParkingSpace.Service.js';
import { createParkingSpaceSchema, parkingSpaceIdSchema, parkingIdParamSchema, availableSpacesByVehicleTypeSchema } from './ParkingSpace.Schema.js';

export const parkingSpaceRouter = Router();

const parkingSpaceRepository = new ParkingSpaceRepository(orm.em);
const parkingSpaceService = new ParkingSpaceService(parkingSpaceRepository);
const parkingSpaceController = new ParkingSpaceController(parkingSpaceService);

parkingSpaceRouter.post('/:id/spaces', validateSchema(createParkingSpaceSchema), parkingSpaceController.create);
parkingSpaceRouter.get('/:id/spaces', validateSchema(parkingIdParamSchema), parkingSpaceController.findByParking);
parkingSpaceRouter.get('/:id/spaces/available', validateSchema(parkingIdParamSchema), parkingSpaceController.findAvailable);
parkingSpaceRouter.get('/:id/spaces/available/:vehicleType', validateSchema(availableSpacesByVehicleTypeSchema), parkingSpaceController.findAvailableByVehicleType);
parkingSpaceRouter.delete('/spaces/:id', validateSchema(parkingSpaceIdSchema), parkingSpaceController.remove);

export default parkingSpaceRouter;