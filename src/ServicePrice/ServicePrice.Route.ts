import { Router } from "express";
import { ServicePriceController } from "./ServicePrice.Controller.js";
import { ServicePriceService } from "./ServicePrice.Service.js";
import { ServicePriceRepository } from "./ServicePrice.Repository.js";
import { orm } from "../Shared/db/orm.js";
import { validateSchema } from "../Shared/middlewares/ValidateSchemas.js";
import {
  createServicePriceSchema,
  servicePriceIdSchema,
  activeServicePriceSchema,
} from "./ServicePrice.Schema.js";

export const servicePriceRouter = Router();

const em = orm.em.fork();
const repository = new ServicePriceRepository(em);
const service = new ServicePriceService(repository);
const controller = new ServicePriceController(service);

servicePriceRouter.post("/parkings/:parkingId/service-prices", validateSchema(createServicePriceSchema), controller.create);
servicePriceRouter.get("/parkings/:parkingId/service-prices", controller.findByParking);
servicePriceRouter.get("/parkings/:parkingId/service-prices/active/:serviceCatalogId", validateSchema(activeServicePriceSchema), controller.findActive);
servicePriceRouter.get("/service-prices/:id", validateSchema(servicePriceIdSchema), controller.findById);
servicePriceRouter.delete("/service-prices/:id", validateSchema(servicePriceIdSchema), controller.remove);

export default servicePriceRouter;