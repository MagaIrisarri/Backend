import { Router } from "express";
import { validateSchema } from "../Shared/middlewares/ValidateSchemas.js";
import { auth, self, staffOfInvoice } from '../Shared/middlewares/auth.js';
import { UserType } from '../Shared/constants/status.js';
import { orm } from "../Shared/db/orm.js";

import { InvoiceController } from "./Invoice.Controller.js";
import { InvoiceRepository } from "./Invoice.Repository.js";
import { InvoiceService } from "./Invoice.Service.js";
import { invoiceIdSchema, payInvoiceSchema } from "./Invoice.Schema.js";

export const invoiceRouter = Router();

const invoiceRepository = new InvoiceRepository(orm.em);
const invoiceService = new InvoiceService(invoiceRepository);
const invoiceController = new InvoiceController(invoiceService);

// La factura la crea el check-out (R-14) y la anula la cancelación de la reserva: acá solo se consulta y se cobra.
invoiceRouter.get('/client/:clientId', auth(), self('clientId'), invoiceController.findByClientId);
invoiceRouter.post("/:id/pay", auth(UserType.DUENO, UserType.EMPLEADO), staffOfInvoice, validateSchema(invoiceIdSchema), validateSchema(payInvoiceSchema), invoiceController.pay);

export default invoiceRouter;