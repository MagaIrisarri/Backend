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

  private async enrichWithLiveAvailability(parking: Parking): Promise<any> {
    const json = parking.toJSON();
    const em = (this.parkingRepository as any).em;
    const { Reservation } = await import('../Reservation/Reservation.Entity.js');
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Considerar reservas activas: en curso o programadas en la jornada/próximas 24 horas
    const activeReservations = await em.find(Reservation, {
      parkingSpace: { parking: { id: parking.id } },
      status: { $in: ['PENDIENTE', 'CONFIRMADA', 'EN CURSO'] },
      $and: [
        { startTime: { $lte: next24Hours } },
        { endTime: { $gte: now } },
      ]
    }, { populate: ['parkingSpace', 'vehicle', 'vehicle.vehicleType'] as any });

    const isMoto = (t: string) => ['MOTOCICLETA', 'MOTO'].includes(t);
    const isTruck = (t: string) => ['CAMIONETA', 'VAN', 'UTILITARIO', 'PICKUP', 'PICK-UP'].includes(t);

    const reservedMotoSpaceIds = new Set<string>();
    const reservedCarSpaceIds = new Set<string>();
    const reservedTruckSpaceIds = new Set<string>();

    let motoResCount = 0;
    let carResCount = 0;
    let truckResCount = 0;

    for (const r of activeReservations) {
      const spaceType = (r.parkingSpace?.vehicleType || '').trim().toUpperCase();
      const vehicleType = (r.vehicle?.vehicleType?.name || '').trim().toUpperCase();
      const type = spaceType || vehicleType;
      const spaceId = r.parkingSpace?.id;

      if (isMoto(type) || isMoto(spaceType) || isMoto(vehicleType)) {
        if (spaceId) reservedMotoSpaceIds.add(spaceId);
        motoResCount++;
      } else if (isTruck(type) || isTruck(spaceType) || isTruck(vehicleType)) {
        if (spaceId) reservedTruckSpaceIds.add(spaceId);
        truckResCount++;
      } else {
        if (spaceId) reservedCarSpaceIds.add(spaceId);
        carResCount++;
      }
    }

    const spaces = parking.parkingSpaces?.isInitialized() ? parking.parkingSpaces.getItems() : [];
    const autoSpaces = spaces.filter((s) => s.vehicleType?.toUpperCase() === 'AUTO' && s.isActive);
    const motoSpaces = spaces.filter((s) => ['MOTOCICLETA', 'MOTO'].includes(s.vehicleType?.toUpperCase()) && s.isActive);
    const truckSpaces = spaces.filter((s) => ['CAMIONETA', 'VAN', 'UTILITARIO'].includes(s.vehicleType?.toUpperCase()) && s.isActive);

    const carCap = json.carCapacity ?? (autoSpaces.length > 0 ? autoSpaces.length : 0);
    const motoCap = json.motorcycleCapacity ?? (motoSpaces.length > 0 ? motoSpaces.length : 0);
    const truckCap = json.truckCapacity ?? (truckSpaces.length > 0 ? truckSpaces.length : 0);

    const occupiedSpacesByStateCar = autoSpaces.filter(s => s.state === 'OCUPADO').length;
    const occupiedSpacesByStateMoto = motoSpaces.filter(s => s.state === 'OCUPADO').length;
    const occupiedSpacesByStateTruck = truckSpaces.filter(s => s.state === 'OCUPADO').length;

    const totalOccupiedCar = Math.max(occupiedSpacesByStateCar, reservedCarSpaceIds.size, carResCount);
    const totalOccupiedMoto = Math.max(occupiedSpacesByStateMoto, reservedMotoSpaceIds.size, motoResCount);
    const totalOccupiedTruck = Math.max(occupiedSpacesByStateTruck, reservedTruckSpaceIds.size, truckResCount);

    return {
      ...json,
      carCapacity: carCap,
      motorcycleCapacity: motoCap,
      truckCapacity: truckCap,
      availableCarSpaces: Math.max(0, carCap - totalOccupiedCar),
      availableMotorcycleSpaces: Math.max(0, motoCap - totalOccupiedMoto),
      availableTruckSpaces: Math.max(0, truckCap - totalOccupiedTruck),
    };
  }

  async findAll(): Promise<any[]> {
    const parkings = await this.parkingRepository.findAll();
    return await Promise.all(parkings.map((p) => this.enrichWithLiveAvailability(p)));
  }

  async findActive(): Promise<any[]> {
    const parkings = await this.parkingRepository.findActive();
    // Exigir que la cochera posea al menos una tarifa activa para figurar como activa
    const parkingsWithTariff = parkings.filter((p) => {
      const activePrices = p.parkingpriceHistory?.isInitialized()
        ? p.parkingpriceHistory.getItems().filter((price) => price.expirationDate === null)
        : [];
      return activePrices.length > 0;
    });
    return await Promise.all(parkingsWithTariff.map((p) => this.enrichWithLiveAvailability(p)));
  }

  async findOne(id: string): Promise<any | null> {
    const parking = await this.parkingRepository.findOne({ id });
    if (!parking) return null;
    return await this.enrichWithLiveAvailability(parking);
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
    if (data.carCapacity !== undefined || data.motorcycleCapacity !== undefined) {
      const em = (this.parkingRepository as any).em;
      const { Reservation } = await import('../Reservation/Reservation.Entity.js');

      if (data.carCapacity !== undefined) {
        const activeCarReservations = await em.find(Reservation, {
          parkingSpace: { parking: { id }, vehicleType: 'AUTO' },
          status: { $in: ['PENDIENTE', 'CONFIRMADA', 'EN CURSO'] },
          endTime: { $gte: new Date() },
        });
        const distinctReservedSpaces = new Set(activeCarReservations.map((r: any) => r.parkingSpace.id)).size;
        if (Number(data.carCapacity) < distinctReservedSpaces) {
          throw new AppError(
            `La nueva capacidad de autos (${data.carCapacity}) no puede ser menor a las plazas con reservas activas o futuras (${distinctReservedSpaces})`,
            400
          );
        }
      }

      if (data.motorcycleCapacity !== undefined) {
        const activeMotoReservations = await em.find(Reservation, {
          parkingSpace: { parking: { id }, vehicleType: 'MOTOCICLETA' },
          status: { $in: ['PENDIENTE', 'CONFIRMADA', 'EN CURSO'] },
          endTime: { $gte: new Date() },
        });
        const distinctReservedSpaces = new Set(activeMotoReservations.map((r: any) => r.parkingSpace.id)).size;
        if (Number(data.motorcycleCapacity) < distinctReservedSpaces) {
          throw new AppError(
            `La nueva capacidad de motos (${data.motorcycleCapacity}) no puede ser menor a las plazas con reservas activas o futuras (${distinctReservedSpaces})`,
            400
          );
        }
      }
    }

    if (data.isActive === true) {
      const em = (this.parkingRepository as any).em;
      const { ParkingPrice } = await import('../ParkingPrice/ParkingPrice.Entity.js');
      const activePrices = await em.find(ParkingPrice, {
        parking: { id },
        expirationDate: null,
      });

      if (activePrices.length === 0) {
        throw new AppError(
          'La cochera debe tener al menos una tarifa activa configurada para poder activarse',
          400
        );
      }
    }

    return await this.parkingRepository.update(id, data);
  }

  async remove(id: string): Promise<boolean> {
    return await this.parkingRepository.remove({ id });
  }

  async findByOwnerId(ownerId: string): Promise<Parking[]> {
    return await this.parkingRepository.findByOwnerId(ownerId);
  }

  async reactivate(id: string): Promise<Parking | null> {
    const parking = await this.parkingRepository.findOne({ id });
    if (!parking) throw new AppError('Estacionamiento no encontrado', 404);

    const em = (this.parkingRepository as any).em;
    const { ParkingPrice } = await import('../ParkingPrice/ParkingPrice.Entity.js');
    const activePrices = await em.find(ParkingPrice, {
      parking: { id },
      expirationDate: null,
    });

    if (activePrices.length === 0) {
      throw new AppError(
        'La cochera debe tener al menos una tarifa activa configurada para poder activarse',
        400
      );
    }

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