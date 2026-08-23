import { Router } from "express";
import { orm } from "../Shared/db/orm.js";
import { validateSchema } from "../Shared/middlewares/ValidateSchemas.js";

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
} from "./ParkingSpace.Schema.js";

export const parkingSpaceRouter = Router();

const spaceRepo = new ParkingSpaceRepository(orm.em);
const parkingRepo = new ParkingRepository(orm.em);
const spaceService = new ParkingSpaceService(spaceRepo, parkingRepo);
const spaceController = new ParkingSpaceController(spaceService);

parkingSpaceRouter.get("/:parkingId/spaces", validateSchema(parkingSpaceQuerySchema), spaceController.findByParking);
parkingSpaceRouter.get("/:parkingId/spaces/available", validateSchema(parkingSpaceQuerySchema), spaceController.findAvailable);
parkingSpaceRouter.post("/:parkingId/spaces", validateSchema(createSpaceSchema), spaceController.create);
parkingSpaceRouter.post("/:parkingId/spaces/bulk", validateSchema(createBulkSpaceSchema), spaceController.createBulk);

// Rutas directas por ID de plaza
parkingSpaceRouter.get("/spaces/:id", validateSchema(spaceIdSchema), spaceController.findOne);
parkingSpaceRouter.put("/spaces/:id", validateSchema(spaceIdSchema), validateSchema(updateSpaceSchema), spaceController.update);
parkingSpaceRouter.patch("/spaces/:id", validateSchema(spaceIdSchema), validateSchema(updateSpaceSchema), spaceController.update);
parkingSpaceRouter.delete("/spaces/:id", validateSchema(spaceIdSchema), spaceController.remove);

export default parkingSpaceRouter;