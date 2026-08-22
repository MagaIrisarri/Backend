import { Router } from "express";
import { ParkingController } from "./Parking.Controller.js";
import { ParkingService } from "./Parking.Service.js";
import { ParkingRepository } from "./Parking.Repository.js";
import { orm } from "../Shared/db/orm.js";
import { validateSchema } from "../Shared/middlewares/ValidateSchemas.js";
import {
  createParkingSchema,
  updateParkingSchema,
  parkingIdSchema,
} from "./Parking.Schema.js";

export const ParkingRouter = Router();

const em = orm.em.fork();
const repository = new ParkingRepository(em);
const service = new ParkingService(repository);
const controller = new ParkingController(service);

ParkingRouter.get('/', controller.findAll);
ParkingRouter.get('/:id', validateSchema(parkingIdSchema), controller.findOneById);
ParkingRouter.post('/', validateSchema(createParkingSchema), controller.add);
ParkingRouter.put('/:id', validateSchema(parkingIdSchema), validateSchema(updateParkingSchema), controller.update);
ParkingRouter.patch('/:id', validateSchema(parkingIdSchema), validateSchema(updateParkingSchema), controller.update);
ParkingRouter.delete('/:id', validateSchema(parkingIdSchema), controller.remove);

export default ParkingRouter;