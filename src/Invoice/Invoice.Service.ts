import { InvoiceRepository } from './Invoice.Repository.js';
import { Invoice } from './Invoice.Entity.js';
import { AppError } from '../Shared/utils/AppError.js';

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

  async findByClientId(clientId: string): Promise<Invoice[]> {
    return await this.repo.findByClientId(clientId);
  }

  async create(input: any): Promise<Invoice> {
    const existing = await this.repo.findByReservationId(input.reservationId);
    if (existing) {
      throw new AppError('Ya existe una factura activa para esta reserva', 400);
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