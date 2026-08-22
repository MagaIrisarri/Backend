import { Router } from 'express';
import { ParkingSpaceController } from './ParkingSpace.Controller.js';
import { ParkingSpaceService } from './ParkingSpace.Service.js';
import { ParkingSpaceRepository } from './ParkingSpace.Repository.js';
import { orm } from '../Shared/db/orm.js';
import { validateSchema } from '../Shared/middlewares/ValidateSchemas.js';
import {
  createParkingSpaceSchema,
  parkingSpaceIdSchema,
  parkingIdParamSchema,
  availableSpacesByVehicleTypeSchema,
} from './ParkingSpace.Schema.js';

export const parkingSpaceRouter = Router();

const em = orm.em.fork();
const repository = new ParkingSpaceRepository(em);
const service = new ParkingSpaceService(repository);
const controller = new ParkingSpaceController(service);

parkingSpaceRouter.post('/parkings/:id/spaces', validateSchema(createParkingSpaceSchema), controller.create);
parkingSpaceRouter.get('/parkings/:id/spaces', validateSchema(parkingIdParamSchema), controller.findByParking);
parkingSpaceRouter.get('/parkings/:id/spaces/available', validateSchema(parkingIdParamSchema), controller.findAvailable);
parkingSpaceRouter.get('/parkings/:id/spaces/available/:vehicleType', validateSchema(availableSpacesByVehicleTypeSchema), controller.findAvailableByVehicleType);
parkingSpaceRouter.delete('/spaces/:id', validateSchema(parkingSpaceIdSchema), controller.remove);

export default parkingSpaceRouter;