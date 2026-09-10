import { Router } from "express";
import { validateSchema } from "../Shared/middlewares/ValidateSchemas.js";
import { orm } from "../Shared/db/orm.js";

import { ServicePriceController } from "./ServicePrice.Controller.js";
import { ServicePriceRepository } from "./ServicePrice.Repository.js";
import { ServicePriceService } from "./ServicePrice.Service.js";
import { createServicePriceSchema, servicePriceIdSchema, activeServicePriceSchema } from "./ServicePrice.Schema.js";

export const servicePriceRouter = Router();

const servicePriceRepository = new ServicePriceRepository(orm.em);
const servicePriceService = new ServicePriceService(servicePriceRepository);
const servicePriceController = new ServicePriceController(servicePriceService);

// ESTACIONAMIENTO
servicePriceRouter.post("/:parkingId/service-prices", validateSchema(createServicePriceSchema), servicePriceController.create);
servicePriceRouter.get("/:parkingId/service-prices", servicePriceController.findByParking);
servicePriceRouter.get("/:parkingId/service-prices/active/:serviceCatalogId", validateSchema(activeServicePriceSchema), servicePriceController.findActive);

// TARIFA
servicePriceRouter.get("/", servicePriceController.findAll);
servicePriceRouter.get("/service-prices/:id", validateSchema(servicePriceIdSchema), servicePriceController.findOne);
servicePriceRouter.delete("/service-prices/:id", validateSchema(servicePriceIdSchema), servicePriceController.remove);

export default servicePriceRouter;