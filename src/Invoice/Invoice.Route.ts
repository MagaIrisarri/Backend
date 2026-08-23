import { Router } from "express";
import { validateSchema } from "../Shared/middlewares/ValidateSchemas.js";
import { orm } from "../Shared/db/orm.js";

import { InvoiceController } from "./Invoice.Controller.js";
import { InvoiceRepository } from "./Invoice.Repository.js";
import { InvoiceService } from "./Invoice.Service.js";
import { createInvoiceSchema, updateInvoiceSchema, invoiceIdSchema } from "./Invoice.Schema.js";

export const invoiceRouter = Router();

const invoiceRepository = new InvoiceRepository(orm.em);
const invoiceService = new InvoiceService(invoiceRepository);
const invoiceController = new InvoiceController(invoiceService);

invoiceRouter.get("/", invoiceController.findAll);
invoiceRouter.get("/:id", validateSchema(invoiceIdSchema), invoiceController.findOne);
invoiceRouter.post("/", validateSchema(createInvoiceSchema), invoiceController.create);
invoiceRouter.put("/:id", validateSchema(invoiceIdSchema), validateSchema(updateInvoiceSchema), invoiceController.update);
invoiceRouter.patch("/:id", validateSchema(invoiceIdSchema), validateSchema(updateInvoiceSchema), invoiceController.update);
invoiceRouter.delete("/:id", validateSchema(invoiceIdSchema), invoiceController.remove);

export default invoiceRouter;