import { Router } from "express";
import { ParkingPriceController } from "./ParkingPrice.Controller.js";
import { ParkingPriceService } from "./ParkingPrice.Service.js";
import { ParkingPriceRepository } from "./ParkingPrice.Repository.js";
import { orm } from "../Shared/db/orm.js";
import { validateSchema } from "../Shared/middlewares/ValidateSchemas.js";
import {
  createParkingPriceSchema,
  parkingPriceIdSchema,
  parkingIdParamSchema,
  activeParkingPriceSchema,
} from "./ParkingPrice.Schema.js";

export const ParkingPriceRouter = Router();

const em = orm.em.fork();
const repository = new ParkingPriceRepository(em);
const service = new ParkingPriceService(repository);
const controller = new ParkingPriceController(service);

ParkingPriceRouter.post('/parkings/:id/prices', validateSchema(createParkingPriceSchema), controller.add);
ParkingPriceRouter.get('/parkings/:id/prices', validateSchema(parkingIdParamSchema), controller.findPricesByParking);
ParkingPriceRouter.get('/prices/:id', validateSchema(parkingPriceIdSchema), controller.findPrice);
ParkingPriceRouter.get('/parkings/:id/prices/active/:vehicleType', validateSchema(activeParkingPriceSchema), controller.findActivePrice);
ParkingPriceRouter.delete('/prices/:id', validateSchema(parkingPriceIdSchema), controller.remove);

export default ParkingPriceRouter;