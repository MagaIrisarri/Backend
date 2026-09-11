import { AppError } from '../Shared/utils/AppError.js';
import { ParkingSpaceRepository } from "./ParkingSpace.Repository.js";
import { ParkingSpace, SpaceState } from "./ParkingSpace.Entity.js";
import { ParkingRepository } from "../Parking/Parking.Repository.js";
import { ReservationRepository } from "../Reservation/Reservation.Repository.js";

export class ParkingSpaceService {
  constructor(
    private spaceRepo: ParkingSpaceRepository,
    private parkingRepo: ParkingRepository,
    private reservationRepo: ReservationRepository
  ) {}

  async findByParking(parkingId: string): Promise<ParkingSpace[]> {
    return await this.spaceRepo.findByParking(parkingId);
  }

  async findAvailable(parkingId: string, vehicleType?: string): Promise<ParkingSpace[]> {
    return await this.spaceRepo.findAvailableByParking(parkingId, vehicleType);
  }

  async findOne(id: string): Promise<ParkingSpace | null> {
    return await this.spaceRepo.findOne({ id });
  }

  async create(parkingId: string, data: { spaceCode: string; vehicleType: string }): Promise<ParkingSpace> {
    const parking = await this.parkingRepo.findOne({ id: parkingId });
    if (!parking) throw new AppError("Estacionamiento no encontrado o inactivo", 400);

    return await this.spaceRepo.add({
      ...data,
      state: SpaceState.LIBRE,
      parking,
    });
  }

  async createBulkManual(
    parkingId: string, 
    data: { vehicleType: string; count: number }
  ): Promise<void> {
    const parking = await this.parkingRepo.findOne({ id: parkingId });
    if (!parking) throw new AppError("Estacionamiento no encontrado o inactivo", 400);

    const existingSpaces = await this.spaceRepo.findByParking(parkingId);
    const spacesOfSameType = existingSpaces.filter(
      (s) => s.vehicleType.toUpperCase() === data.vehicleType.toUpperCase()
    );

    const prefixMap: Record<string, string> = {
      AUTO: 'A',
      MOTOCICLETA: 'M',
      MOTO: 'M',
      CAMIONETA: 'C',
      UTILITARIO: 'U',
    };
    const prefix = prefixMap[data.vehicleType.toUpperCase()] || data.vehicleType.charAt(0).toUpperCase();

    const startNumber = spacesOfSameType.length + 1;

    const spacesToCreate: Partial<ParkingSpace>[] = [];
    for (let i = 0; i < data.count; i++) {
      spacesToCreate.push({
        spaceCode: `${prefix}-${String(startNumber + i).padStart(2, '0')}`,
        vehicleType: data.vehicleType,
        state: SpaceState.LIBRE,
        parking,
      });
    }

    await this.spaceRepo.createBulk(spacesToCreate);
  }

  async update(id: string, data: Partial<ParkingSpace>): Promise<ParkingSpace | null> {
    if (data.state === SpaceState.MANTENIMIENTO) {
      const space = await this.spaceRepo.findOne({ id });
      if (!space) throw new AppError("Plaza no encontrada", 404);

      // Verificar si la plaza tiene reservas activas o futuras
      const em = (this.reservationRepo as any).em;
      const { Reservation } = await import('../Reservation/Reservation.Entity.js');
      const activeReservations = await em.find(Reservation, {
        parkingSpace: { id },
        status: { $in: ['PENDIENTE', 'CONFIRMADA', 'EN CURSO'] },
        endTime: { $gte: new Date() },
      });

      if (activeReservations.length > 0) {
        throw new AppError(
          `No se puede pasar a mantenimiento la plaza ${space.spaceCode} porque posee ${activeReservations.length} reserva(s) vigente(s) o programada(s)`,
          400
        );
      }
    }

    return await this.spaceRepo.update(id, data);
  }

  async remove(id: string): Promise<boolean> {
    const space = await this.spaceRepo.findOne({ id });
    if (!space) throw new AppError("Plaza no encontrada", 404);

    const em = (this.reservationRepo as any).em;
    const { Reservation } = await import('../Reservation/Reservation.Entity.js');
    const activeReservations = await em.find(Reservation, {
      parkingSpace: { id },
      status: { $in: ['PENDIENTE', 'CONFIRMADA', 'EN CURSO'] },
      endTime: { $gte: new Date() },
    });

    if (activeReservations.length > 0) {
      throw new AppError(
        `No se puede dar de baja la plaza ${space.spaceCode} porque posee ${activeReservations.length} reserva(s) vigente(s) o programada(s)`,
        400
      );
    }

    return await this.spaceRepo.remove({ id });
  }

  async checkAvailability(parkingId: string, vehicleType: string, startTime: Date, endTime: Date): Promise<(ParkingSpace & { available: boolean })[]> {
    const parking = await this.parkingRepo.findOne({ id: parkingId });
    if (!parking) throw new AppError("Estacionamiento no encontrado o inactivo", 400);
    const marginMs = parking.reservationMargin * 60 * 60 * 1000;
    const startWithMargin = new Date(startTime.getTime() - marginMs);
    const endWithMargin = new Date(endTime.getTime() + marginMs);
    const existingSpaces = await this.spaceRepo.findByParking(parkingId);

    const matchesVehicleType = (spaceType: string, queryType: string): boolean => {
      const s = (spaceType || '').trim().toUpperCase();
      const q = (queryType || '').trim().toUpperCase();
      if (s === q) return true;
      if (['MOTO', 'MOTOCICLETA'].includes(s) && ['MOTO', 'MOTOCICLETA'].includes(q)) return true;
      if (
        ['CAMIONETA', 'UTILITARIO', 'VAN', 'PICKUP', 'PICK-UP'].includes(s) &&
        ['CAMIONETA', 'UTILITARIO', 'VAN', 'PICKUP', 'PICK-UP'].includes(q)
      ) return true;
      if (['AUTO', 'AUTOMOVIL'].includes(s) && ['AUTO', 'AUTOMOVIL'].includes(q)) return true;
      return false;
    };

    const spacesOfSameType = existingSpaces.filter((s) =>
      matchesVehicleType(s.vehicleType, vehicleType)
    );

    const spacesOccupied = await this.reservationRepo.findConflictingSpaceIds(parking, startWithMargin, endWithMargin);

    return spacesOfSameType.map((space) => ({
      ...space,
      available: space.state === 'LIBRE' && !spacesOccupied.has(space.id),
    }));
  }

}