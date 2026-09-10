import { Parking } from './Parking.Entity.js';
import { ParkingRepository } from './Parking.Repository.js';
import { ParkingSpace, SpaceState } from '../ParkingSpace/ParkingSpace.Entity.js';
import { ParkingSpaceRepository } from '../ParkingSpace/ParkingSpace.Repository.js';
import { CreateParkingInput } from './Parking.Schema.js';
import { AppError } from '../Shared/utils/AppError.js';

export class ParkingService {
  constructor(
    private readonly parkingRepository: ParkingRepository,
    private readonly parkingSpaceRepository: ParkingSpaceRepository
  ) {}

  async findAll(): Promise<Parking[]> {
     return await this.parkingRepository.findAll();
  }

  async findActive(): Promise<Parking[]> {
    return await this.parkingRepository.findActive();
  }

  async findOne(id: string): Promise<Parking | null> {
    return await this.parkingRepository.findOne({ id });
  }

  async findByOwner(ownerId: string): Promise<Parking[]> {
    return await this.parkingRepository.findByOwner(ownerId);
  }

  async create(data: CreateParkingInput): Promise<Parking> {
    const owner = await this.parkingRepository.getUserById(data.ownerId);
    if (!owner || owner.status !== 'ACTIVO') {
      throw new AppError("Dueño no encontrado o inactivo", 404);
    }

    if (owner.type !== 'DUEÑO') {
      throw new AppError("Solo los usuarios con rol DUEÑO pueden crear estacionamientos", 403);
    }

    const { ownerId, ...parkingData } = data;
    const parking = await this.parkingRepository.add({
      ...parkingData,
      owner,
    });

    const spacesToCreate: Partial<ParkingSpace>[] = [];

    for (let i = 1; i <= (parking.carCapacity ?? 0); i++) {
      spacesToCreate.push({
        spaceCode: `A-${String(i).padStart(2, '0')}`,
        vehicleType: 'AUTO',
        state: SpaceState.LIBRE,
        parking,
      });
    }

    for (let i = 1; i <= (parking.motorcycleCapacity ?? 0); i++) {
      spacesToCreate.push({
        spaceCode: `M-${String(i).padStart(2, '0')}`,
        vehicleType: 'MOTOCICLETA',
        state: SpaceState.LIBRE,
        parking,
      });
    }

    if (spacesToCreate.length > 0) {
      await this.parkingSpaceRepository.createBulk(spacesToCreate);
    }

    return parking;
  }

  async update(id: string, data: any): Promise<Parking | null> {
    return await this.parkingRepository.update(id, data);
  }

  async remove(id: string): Promise<boolean> {
    return await this.parkingRepository.remove({ id });
  }

  async findByOwnerId(ownerId: string): Promise<Parking[]> {
    return await this.parkingRepository.findByOwnerId(ownerId);
  }

  async reactivate(id: string): Promise<Parking | null> {
    return await this.parkingRepository.update(id, { isActive: true });
  }

  async getMetrics(id: string): Promise<any> {
    const parking = await this.parkingRepository.findOne({ id });
    if (!parking) throw new AppError('Estacionamiento no encontrado', 404);

    const em = (this.parkingRepository as any).em;
    const { Reservation } = await import('../Reservation/Reservation.Entity.js');
    const { Invoice } = await import('../Invoice/Invoice.Entity.js');

    const reservations = await em.find(Reservation, { parkingSpace: { parking: { id } } });
    
    let totalRevenue = 0;
    const countByStatus: Record<string, number> = {
      'PENDIENTE': 0,
      'CONFIRMADA': 0,
      'EN CURSO': 0,
      'FINALIZADA': 0,
      'CANCELADA': 0
    };

    let activeReservationsCount = 0;

    for (const res of reservations) {
      if (countByStatus[res.status] !== undefined) {
        countByStatus[res.status]++;
      }
      
      if (res.status === 'EN CURSO' || res.status === 'CONFIRMADA') {
        activeReservationsCount++;
      }

      if (res.status === 'FINALIZADA') {
        // Buscar la factura
        const invoice = await em.findOne(Invoice, { reservation: { id: res.id }, status: 'PAGADA' });
        if (invoice) {
          totalRevenue += Number(invoice.totalAmount);
        } else {
          // Si no está pagada, buscamos la PENDIENTE también para sumar recaudación esperada? 
          // O solo la pagada. Dejemos solo PAGADA.
          const invoicePendiente = await em.findOne(Invoice, { reservation: { id: res.id }, status: 'PENDIENTE' });
          if (invoicePendiente) totalRevenue += Number(invoicePendiente.totalAmount);
        }
      }
    }

    const totalCapacity = (parking.carCapacity || 0) + (parking.motorcycleCapacity || 0);
    const occupancyRate = totalCapacity > 0 ? (activeReservationsCount / totalCapacity) * 100 : 0;

    return {
      totalRevenue,
      reservations: countByStatus,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      activeReservations: activeReservationsCount,
      totalCapacity
    };
  }
}