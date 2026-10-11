import { InvoiceRepository } from './Invoice.Repository.js';
import { Invoice } from './Invoice.Entity.js';
import { AppError } from '../Shared/utils/AppError.js';

export class InvoiceService {
  constructor(private repo: InvoiceRepository) {}

  async findByClientId(clientId: string): Promise<Invoice[]> {
    return await this.repo.findByClientId(clientId);
  }

  async pay(id: string, paymentMethod: string): Promise<Invoice | null> {
    const invoice = await this.repo.findOne({ id });
    if (!invoice) throw new AppError('Factura no encontrada', 404);
    if (invoice.status === 'PAGADA') throw new AppError('La factura ya está pagada', 400);

    return await this.repo.update(id, {
      status: 'PAGADA',
      paymentMethod,
      paymentDate: new Date()
    });
  }
}