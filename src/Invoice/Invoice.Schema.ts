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

export const invoiceIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID de factura inválido"),
  }),
});

export const payInvoiceSchema = z.object({
  body: z.object({
    paymentMethod: PaymentMethodSchema,
    amountReceived: z.number().positive("El efectivo recibido debe ser mayor a 0").optional(),
    receiptNumber: z.string().trim().min(1).max(60).optional(),
  }),
});