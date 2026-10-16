import { InvoiceRepository } from './Invoice.Repository.js';
import { Invoice } from './Invoice.Entity.js';
import { AppError } from '../Shared/utils/AppError.js';

export class InvoiceService {
  constructor(private repo: InvoiceRepository) {}

  async findByClientId(clientId: string): Promise<Invoice[]> {
    return await this.repo.findByClientId(clientId);
  }

  // amountReceived solo aplica al efectivo y tiene que cubrir el total; receiptNumber es el comprobante del posnet o la app (nunca datos de tarjeta).
  async pay(id: string, data: { paymentMethod: string; amountReceived?: number; receiptNumber?: string }): Promise<Invoice | null> {
    const invoice = await this.repo.findOne({ id });
    if (!invoice) throw new AppError('Factura no encontrada', 404);
    if (invoice.status === 'PAGADA') throw new AppError('La factura ya está pagada', 400);
    const cash = data.paymentMethod === 'EFECTIVO';
    if (cash && data.amountReceived != null && data.amountReceived < Number(invoice.totalAmount)) {
      throw new AppError(`Faltan $${Number(invoice.totalAmount) - data.amountReceived} para cubrir $${Number(invoice.totalAmount)}`, 400);
    }

    return await this.repo.update(id, {
      status: 'PAGADA',
      paymentMethod: data.paymentMethod,
      paymentDate: new Date(),
      amountReceived: cash && data.amountReceived != null ? String(data.amountReceived) : null, // una columna decimal se asigna como string
      receiptNumber: cash ? null : data.receiptNumber ?? null,
    });
  }
}
