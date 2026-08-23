import { Router } from "express";
import { validateSchema } from "../Shared/middlewares/ValidateSchemas.js";
import { orm } from "../Shared/db/orm.js";

import { ParkingController } from "./Parking.Controller.js";
import { ParkingRepository } from "./Parking.Repository.js";
import { ParkingService } from "./Parking.Service.js";
import { createParkingSchema, updateParkingSchema, parkingIdSchema } from "./Parking.Schema.js";

export const ParkingRouter = Router();

const parkingRepository = new ParkingRepository(orm.em);
const parkingService = new ParkingService(parkingRepository);
const parkingController = new ParkingController(parkingService);

ParkingRouter.post('/', validateSchema(createParkingSchema), parkingController.create);

ParkingRouter.get('/', parkingController.findAll);
ParkingRouter.get('/:id', validateSchema(parkingIdSchema), parkingController.findOne);
ParkingRouter.put('/:id', validateSchema(parkingIdSchema), validateSchema(updateParkingSchema), parkingController.update);
ParkingRouter.patch('/:id', validateSchema(parkingIdSchema), validateSchema(updateParkingSchema), parkingController.update);
ParkingRouter.delete('/:id', validateSchema(parkingIdSchema), parkingController.remove);

export default ParkingRouter;