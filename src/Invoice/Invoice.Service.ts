import { InvoiceRepository } from './Invoice.Repository.js';
import { Invoice } from './Invoice.Entity.js';
import { AppError } from '../Shared/utils/AppError.js';

export class InvoiceService {
  constructor(private repo: InvoiceRepository) {}

  async findByClientId(clientId: string): Promise<Invoice[]> {
    return await this.repo.findByClientId(clientId);
  }

  async pay(id: string, data: Payment): Promise<Invoice | null> {
    const invoice = await this.repo.findOne({ id });
    if (!invoice) throw new AppError('Factura no encontrada', 404);
    if (invoice.status === 'PAGADA') throw new AppError('La factura ya está pagada', 400);
    return await this.repo.update(id, { status: 'PAGADA', paymentDate: new Date(), ...paymentFields(invoice, data) });
  }

  // Corrige el pago de una factura ya cobrada (medio equivocado, monto recibido o comprobante). El total y la fecha de pago no cambian.
  // shortcut: L-47, no guarda quién corrigió ni el valor anterior, agregar historial si se audita la caja
  async editPayment(id: string, data: Payment): Promise<Invoice | null> {
    const invoice = await this.repo.findOne({ id });
    if (!invoice) throw new AppError('Factura no encontrada', 404);
    if (invoice.status !== 'PAGADA') throw new AppError('La factura todavía no se cobró', 400);
    return await this.repo.update(id, paymentFields(invoice, data));
  }
}

type Payment = { paymentMethod: string; amountReceived?: number; receiptNumber?: string };

// amountReceived solo aplica al efectivo y tiene que cubrir el total; receiptNumber es el comprobante del posnet o la app (nunca datos de tarjeta).
function paymentFields(invoice: Invoice, data: Payment) {
  const total = Number(invoice.totalAmount);
  const cash = data.paymentMethod === 'EFECTIVO';
  if (cash && data.amountReceived != null && data.amountReceived < total) {
    throw new AppError(`Faltan $${total - data.amountReceived} para cubrir $${total}`, 400);
  }
  return {
    paymentMethod: data.paymentMethod,
    amountReceived: cash && data.amountReceived != null ? String(data.amountReceived) : null, // una columna decimal se asigna como string
    receiptNumber: cash ? null : data.receiptNumber ?? null,
  };
}
