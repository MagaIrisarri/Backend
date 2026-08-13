import { Router } from "express";
import {
  add, 
  findSpacesByParking,
  findAvailableSpaces,
  findAvailableSpacesByVehicleType
} from "./ParkingSpace.Controller.js";

const ParkingSpaceRouter = Router();

ParkingSpaceRouter.post('/:id/spaces', add);

ParkingSpaceRouter.get('/:id/spaces', findSpacesByParking);
ParkingSpaceRouter.get('/:id/spaces/available', findAvailableSpaces);
ParkingSpaceRouter.get('/:id/spaces/available/:vehicleType', findAvailableSpacesByVehicleType);

export default ParkingSpaceRouter;