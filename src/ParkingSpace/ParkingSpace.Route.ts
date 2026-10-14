import { Router } from "express";
import { orm } from "../Shared/db/orm.js";
import { validateSchema } from "../Shared/middlewares/ValidateSchemas.js";
import { auth, ownParking, parkingOf } from '../Shared/middlewares/auth.js';
import { ParkingSpace } from './ParkingSpace.Entity.js';
import { UserType } from '../Shared/constants/status.js';

import { ParkingSpaceController } from "./ParkingSpace.Controller.js";
import { ParkingSpaceRepository } from "./ParkingSpace.Repository.js";
import { ParkingRepository } from "../Parking/Parking.Repository.js";
import { ParkingSpaceService } from "./ParkingSpace.Service.js";
import {
  createSpaceSchema,
  createBulkSpaceSchema,
  updateSpaceSchema,
  spaceIdSchema,
  parkingSpaceQuerySchema,
  parkingSpaceavailability,
} from "./ParkingSpace.Schema.js";

export const parkingSpaceRouter = Router();

const spaceRepo = new ParkingSpaceRepository(orm.em);
const parkingRepo = new ParkingRepository(orm.em);
const spaceService = new ParkingSpaceService(spaceRepo, parkingRepo);
const spaceController = new ParkingSpaceController(spaceService);

parkingSpaceRouter.get("/:parkingId/spaces", validateSchema(parkingSpaceQuerySchema), spaceController.findByParking);
parkingSpaceRouter.post("/:parkingId/spaces", auth(UserType.DUENO), ownParking((req) => req.params.parkingId), validateSchema(createSpaceSchema), spaceController.create);
parkingSpaceRouter.put("/:parkingId/spaces", auth(UserType.DUENO), ownParking((req) => req.params.parkingId), validateSchema(createBulkSpaceSchema), spaceController.createBulk);
parkingSpaceRouter.get("/:parkingId/spaces/availability", validateSchema(parkingSpaceavailability), spaceController.checkAvailability);

// Rutas directas por ID de plaza
parkingSpaceRouter.get("/spaces/:id", validateSchema(spaceIdSchema), spaceController.findOne);
parkingSpaceRouter.put("/spaces/:id", auth(UserType.DUENO), ownParking(parkingOf(ParkingSpace)), validateSchema(spaceIdSchema), validateSchema(updateSpaceSchema), spaceController.update);
parkingSpaceRouter.patch("/spaces/:id", auth(UserType.DUENO), ownParking(parkingOf(ParkingSpace)), validateSchema(spaceIdSchema), validateSchema(updateSpaceSchema), spaceController.update);
parkingSpaceRouter.delete("/spaces/:id", auth(UserType.DUENO), ownParking(parkingOf(ParkingSpace)), validateSchema(spaceIdSchema), spaceController.remove);

export default parkingSpaceRouter;