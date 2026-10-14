import { Router } from "express";
import { validateSchema } from "../Shared/middlewares/ValidateSchemas.js";
import { auth, ownParking, parkingOf } from '../Shared/middlewares/auth.js';
import { ParkingPrice } from './ParkingPrice.Entity.js';
import { UserType } from '../Shared/constants/status.js';
import { orm } from "../Shared/db/orm.js";

import { ParkingPriceRepository } from "./ParkingPrice.Repository.js";
import { ParkingPriceController } from "./ParkingPrice.Controller.js";
import { ParkingPriceService } from "./ParkingPrice.Service.js";
import { createParkingPriceSchema, updateParkingPriceSchema, parkingPriceIdSchema, parkingIdParamSchema, activeParkingPriceSchema } from "./ParkingPrice.Schema.js";

export const ParkingPriceRouter = Router();

const parkingPriceRepository = new ParkingPriceRepository(orm.em);
const parkingPriceService = new ParkingPriceService(parkingPriceRepository);
const parkingPriceController = new ParkingPriceController(parkingPriceService);

//  ESTACIONAMIENTO
ParkingPriceRouter.post('/:id/prices', auth(UserType.DUENO), ownParking((req) => req.params.id), validateSchema(createParkingPriceSchema), parkingPriceController.create);
ParkingPriceRouter.get('/:id/prices', validateSchema(parkingIdParamSchema), parkingPriceController.findByParking);
ParkingPriceRouter.get('/:id/prices/active/:vehicleType', validateSchema(activeParkingPriceSchema), parkingPriceController.findActive);

// TARIFA
ParkingPriceRouter.get('/prices/:id', validateSchema(parkingPriceIdSchema), parkingPriceController.findOne);
ParkingPriceRouter.put('/prices/:id', auth(UserType.DUENO), ownParking(parkingOf(ParkingPrice)), validateSchema(updateParkingPriceSchema), parkingPriceController.update);
ParkingPriceRouter.delete('/prices/:id', auth(UserType.DUENO), ownParking(parkingOf(ParkingPrice)), validateSchema(parkingPriceIdSchema), parkingPriceController.remove);

export default ParkingPriceRouter;