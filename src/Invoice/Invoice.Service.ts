import { InvoiceRepository } from './Invoice.Repository.js';
import { Invoice } from './Invoice.Entity.js';

export class InvoiceService {
  constructor(private repo: InvoiceRepository) {}

  async findAll(): Promise<Invoice[]> {
    return await this.repo.findAll();
  }

  async findOne(id: string): Promise<Invoice | null> {
    return await this.repo.findOne({ id });
  }

  async findByReservation(reservationId: string): Promise<Invoice | null> {
    return await this.repo.findByReservationId(reservationId);
  }

  async create(input: any): Promise<Invoice> {
    const existing = await this.repo.findByReservationId(input.reservationId);
    if (existing) {
      throw new Error('Ya existe una factura activa para esta reserva');
    }
    return await this.repo.add(input);
  }

  async update(id: string, input: any): Promise<Invoice | null> {
    return await this.repo.update(id, input);
  }

  async remove(id: string): Promise<boolean> {
    return await this.repo.remove({ id });
  }
}