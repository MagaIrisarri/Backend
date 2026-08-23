import { Router } from "express";
import { validateSchema } from "../Shared/middlewares/ValidateSchemas.js";
import { orm } from "../Shared/db/orm.js";

import { ParkingPriceRepository } from "./ParkingPrice.Repository.js";
import { ParkingPriceController } from "./ParkingPrice.Controller.js";
import { ParkingPriceService } from "./ParkingPrice.Service.js";
import { createParkingPriceSchema, parkingPriceIdSchema, parkingIdParamSchema, activeParkingPriceSchema } from "./ParkingPrice.Schema.js";

export const ParkingPriceRouter = Router();

const parkingPriceRepository = new ParkingPriceRepository(orm.em);
const parkingPriceService = new ParkingPriceService(parkingPriceRepository);
const parkingPriceController = new ParkingPriceController(parkingPriceService);

ParkingPriceRouter.post('/:id/prices', validateSchema(createParkingPriceSchema), parkingPriceController.add);
ParkingPriceRouter.get('/:id/prices', validateSchema(parkingIdParamSchema), parkingPriceController.findPricesByParking);
ParkingPriceRouter.get('/:id/prices/active/:vehicleType', validateSchema(activeParkingPriceSchema), parkingPriceController.findActivePrice);
ParkingPriceRouter.get('/prices/:id', validateSchema(parkingPriceIdSchema), parkingPriceController.findPrice);
ParkingPriceRouter.delete('/prices/:id', validateSchema(parkingPriceIdSchema), parkingPriceController.remove);

export default ParkingPriceRouter;