import { Router } from "express";
import { InvoiceController } from "./Invoice.Controller.js";
import { InvoiceService } from "./Invoice.Service.js";
import { InvoiceRepository } from "./Invoice.Repository.js";
import { orm } from "../Shared/db/orm.js";
import { validateSchema } from "../Shared/middlewares/ValidateSchemas.js";
import { createInvoiceSchema, updateInvoiceSchema, invoiceIdSchema } from "./Invoice.Schema.js";

export const invoiceRouter = Router();

const em = orm.em.fork();
const repository = new InvoiceRepository(em);
const service = new InvoiceService(repository);
const controller = new InvoiceController(service);

invoiceRouter.get("/", controller.findAll);
invoiceRouter.get("/:id", validateSchema(invoiceIdSchema), controller.findOne);
invoiceRouter.post("/", validateSchema(createInvoiceSchema), controller.create);
invoiceRouter.put("/:id", validateSchema(invoiceIdSchema), validateSchema(updateInvoiceSchema), controller.update);
invoiceRouter.patch("/:id", validateSchema(invoiceIdSchema), validateSchema(updateInvoiceSchema), controller.update);
invoiceRouter.delete("/:id", validateSchema(invoiceIdSchema), controller.remove);

export default invoiceRouter;