import { EntityManager } from '@mikro-orm/core';
import { Repository } from '../Shared/base.Repository.js';
import { Invoice } from './Invoice.Entity.js';
import { Reservation } from '../Reservation/Reservation.Entity.js';

export class InvoiceRepository implements Repository<Invoice> {
  constructor(private em: EntityManager) {}

  async findAll(): Promise<Invoice[]> {
    return await this.em.find( Invoice, { status: { $ne: 'ANULADA' } },
      { populate: ['reservation'] }
    );
  }

  async findOne(item: { id: string }): Promise<Invoice | null> {
    return await this.em.findOne( Invoice, { id: item.id, status: { $ne: 'ANULADA' } },
      { populate: ['reservation'] }
    );
  }

  async findByReservationId(reservationId: string): Promise<Invoice | null> {
    return await this.em.findOne( Invoice, { reservation: { id: reservationId }, status: { $ne: 'ANULADA' } },
      { populate: ['reservation'] }
    );
  }

  async add(item: any): Promise<Invoice> {
    const reservation = this.em.getReference(Reservation, item.reservationId);

    const invoice = this.em.create(Invoice, {
      paymentDate: item.paymentDate ?? (item.status === 'PAGADA' ? new Date() : null),
      paymentMethod: item.paymentMethod,
      totalAmount: item.totalAmount,
      status: item.status ?? 'PENDIENTE',
      reservation,
    });

    await this.em.flush();
    return invoice;
  }

  async update(id: string, item: any): Promise<Invoice | null> {
    const invoice = await this.em.findOne(Invoice, { id, status: { $ne: 'ANULADA' } });
    if (!invoice) return null;

    if (item.status === 'PAGADA' && !invoice.paymentDate && !item.paymentDate) {
      item.paymentDate = new Date();
    }

    this.em.assign(invoice, item);
    await this.em.flush();
    return invoice;
  }

  async remove(item: { id: string }): Promise<boolean> {
    const invoice = await this.em.findOne(Invoice, { id: item.id });
    if (!invoice) return false;

    invoice.status = 'ANULADA';
    await this.em.flush();
    return true;
  }
}