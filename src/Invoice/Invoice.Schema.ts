import { z } from "zod";

export const PaymentMethodSchema = z.enum([
  "EFECTIVO",
  "TARJETA_DEBITO",
  "TARJETA_CREDITO",
  "MERCADO_PAGO",
  "TRANSFERENCIA",
], {
  message: "Método de pago no válido",
});

export const InvoiceStatusSchema = z.enum([
  "PENDIENTE",
  "PAGADA",
  "ANULADA",
], {
  message: "Estado de factura no válido",
});

export const createInvoiceSchema = z.object({
  body: z.object({
    reservationId: z.string().uuid("ID de reserva inválido"),
    paymentMethod: PaymentMethodSchema,
    totalAmount: z.number().positive("El monto total debe ser mayor a 0"),
    paymentDate: z.coerce.date().optional(),
    status: InvoiceStatusSchema.optional().default("PENDIENTE"),
  }),
});

export const updateInvoiceSchema = z.object({
  body: z.object({
    paymentMethod: PaymentMethodSchema.optional(),
    totalAmount: z.number().positive().optional(),
    paymentDate: z.coerce.date().optional(),
    status: InvoiceStatusSchema.optional(),
  }),
});

export const invoiceIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID de factura inválido"),
  }),
});