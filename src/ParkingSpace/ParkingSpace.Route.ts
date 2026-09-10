import { Router } from "express";
import { orm } from "../Shared/db/orm.js";
import { validateSchema } from "../Shared/middlewares/ValidateSchemas.js";

import { ParkingSpaceController } from "./ParkingSpace.Controller.js";
import { ParkingSpaceRepository } from "./ParkingSpace.Repository.js";
import { ParkingRepository } from "../Parking/Parking.Repository.js";
import { ParkingSpaceService } from "./ParkingSpace.Service.js";
import { ReservationRepository } from "../Reservation/Reservation.Repository.js";
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
const reservationRepo = new ReservationRepository(orm.em);
const spaceService = new ParkingSpaceService(spaceRepo, parkingRepo, reservationRepo);
const spaceController = new ParkingSpaceController(spaceService);

parkingSpaceRouter.get("/:parkingId/spaces", validateSchema(parkingSpaceQuerySchema), spaceController.findByParking);
parkingSpaceRouter.get("/:parkingId/spaces/available", validateSchema(parkingSpaceQuerySchema), spaceController.findAvailable);
parkingSpaceRouter.post("/:parkingId/spaces", validateSchema(createSpaceSchema), spaceController.create);
parkingSpaceRouter.put("/:parkingId/spaces", validateSchema(createBulkSpaceSchema), spaceController.createBulk);
parkingSpaceRouter.get("/:parkingId/spaces/availability", validateSchema(parkingSpaceavailability), spaceController.checkAvailability);

// Rutas directas por ID de plaza
parkingSpaceRouter.get("/spaces/:id", validateSchema(spaceIdSchema), spaceController.findOne);
parkingSpaceRouter.put("/spaces/:id", validateSchema(spaceIdSchema), validateSchema(updateSpaceSchema), spaceController.update);
parkingSpaceRouter.patch("/spaces/:id", validateSchema(spaceIdSchema), validateSchema(updateSpaceSchema), spaceController.update);
parkingSpaceRouter.delete("/spaces/:id", validateSchema(spaceIdSchema), spaceController.remove);

export default parkingSpaceRouter;