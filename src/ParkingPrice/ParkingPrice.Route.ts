import { Router } from "express";
import {
  add,
  findPricesByParking,
  findPrice,
  findActivePrice
} from "./ParkingPrice.Controller.js";

const ParkingPriceRouter = Router();

ParkingPriceRouter.post('/parkings/:id/prices', add);

ParkingPriceRouter.get('/parkings/:id/prices', findPricesByParking);
ParkingPriceRouter.get('/prices/:id', findPrice);
ParkingPriceRouter.get('/parkings/:id/prices/active/:vehicleType', findActivePrice);

export default ParkingPriceRouter;