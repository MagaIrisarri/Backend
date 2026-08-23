import { Router } from 'express';
import { orm } from '../Shared/db/orm.js';
import { validateSchema } from '../Shared/middlewares/ValidateSchemas.js';

import { ParkingController } from './Parking.Controller.js';
import { ParkingRepository } from './Parking.Repository.js';
import { ParkingService } from './Parking.Service.js';
import { ParkingSpaceRepository } from '../ParkingSpace/ParkingSpace.Repository.js';
import { createParkingSchema, updateParkingSchema, parkingIdSchema } from './Parking.Schema.js';

export const parkingRouter = Router();

const parkingRepository = new ParkingRepository(orm.em);
const parkingSpaceRepository = new ParkingSpaceRepository(orm.em);
const parkingService = new ParkingService(parkingRepository, parkingSpaceRepository);
const parkingController = new ParkingController(parkingService);

parkingRouter.get('/', parkingController.findAll);
parkingRouter.get('/:id', validateSchema(parkingIdSchema), parkingController.findOne);
parkingRouter.post('/', validateSchema(createParkingSchema), parkingController.create);
parkingRouter.put('/:id', validateSchema(parkingIdSchema), validateSchema(updateParkingSchema), parkingController.update);
parkingRouter.patch('/:id', validateSchema(parkingIdSchema), validateSchema(updateParkingSchema), parkingController.update);
parkingRouter.delete('/:id', validateSchema(parkingIdSchema), parkingController.remove);

export default parkingRouter;