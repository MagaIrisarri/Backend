import { Parking } from './Parking.Entity.js';
import { ParkingRepository } from './Parking.Repository.js';
import { ParkingSpace, SpaceState } from '../ParkingSpace/ParkingSpace.Entity.js';
import { ParkingSpaceRepository } from '../ParkingSpace/ParkingSpace.Repository.js';
import type { Reservation } from '../Reservation/Reservation.Entity.js';
import { CreateParkingInput } from './Parking.Schema.js';
import { AppError } from '../Shared/utils/AppError.js';
import { ReservationStatus } from '../Shared/constants/status.js';
import { categorizeVehicleType, groupSpacesByVehicleType } from '../Shared/utils/vehicleTypes.js';

// Plazas vigentes: las dadas de baja (isActive = false) siguen en la colección pero no cuentan.
const activeSpaces = (parking: Parking): ParkingSpace[] =>
  parking.parkingSpaces?.isInitialized() ? parking.parkingSpaces.getItems().filter((s) => s.isActive !== false) : [];

export class ParkingService {
  constructor(
    private readonly parkingRepository: ParkingRepository,
    private readonly parkingSpaceRepository: ParkingSpaceRepository
  ) {}

  // Disponibilidad "en vivo": vehículos adentro ahora (reservas EN CURSO) o plazas marcadas OCUPADO a mano, sin contar dos veces
  // la misma plaza. Las pendientes y confirmadas todavía no ocupan nada; las de mantenimiento no están libres ni ocupadas.
  private formatParkingResponse(parking: Parking, inProgress: Reservation[]) {
    const spaces = activeSpaces(parking);
    const grouped = groupSpacesByVehicleType(spaces);
    const autoSpaces = grouped.auto;
    const motoSpaces = grouped.moto;
    const truckSpaces = grouped.camioneta;
    const available = (list: ParkingSpace[], capacity: number) => {
      const ids = new Set(list.map((s) => s.id));
      const inside = inProgress.filter((r) => ids.has(r.parkingSpace.id));
      const occupied = Math.max(new Set([...list.filter((s) => s.state === SpaceState.OCUPADO).map((s) => s.id), ...inside.map((r) => r.parkingSpace.id)]).size, inside.length);
      const maintenance = list.filter((s) => s.state === SpaceState.MANTENIMIENTO).length;
      return Math.max(0, capacity - occupied - maintenance);
    };
    const carCapacity = parking.carCapacity ?? autoSpaces.length;
    const motorcycleCapacity = parking.motorcycleCapacity ?? motoSpaces.length;
    const truckCapacity = parking.truckCapacity ?? truckSpaces.length;

    let sanitizedOwner: any = null;
    if (parking.owner) {
      if (typeof (parking.owner as any).isInitialized === 'function' && !(parking.owner as any).isInitialized()) {
        sanitizedOwner = { id: (parking.owner as any).id };
      } else {
        sanitizedOwner = {
          id: parking.owner.id,
          name: parking.owner.name,
          last_name: parking.owner.last_name,
          email: parking.owner.email,
          phone: parking.owner.phone,
        };
      }
    }

    let prices: Array<{ id: string; vehicleType: string; price: number }> = [];
    if (parking.parkingpriceHistory?.isInitialized()) {
      const activePrices = parking.parkingpriceHistory
        .getItems()
        .filter((p) => !p.expirationDate || p.expirationDate === null);
      const byCategory = new Map<string, { id: string; vehicleType: string; price: number }>();
      for (const p of activePrices) {
        const category = categorizeVehicleType(p.vehicleType);
        byCategory.set(category, {
          id: p.id,
          vehicleType: category,
          price: Number(p.price) || 0,
        });
      }
      prices = Array.from(byCategory.values());
    }

    return {
      id: parking.id,
      province: parking.province ?? null,
      locality: parking.locality,
      neighborhood: parking.neighborhood ?? null,
      postalCode: parking.postalCode,
      address: parking.address,
      carCapacity,
      motorcycleCapacity,
      truckCapacity,
      availableCarSpaces: available(autoSpaces, carCapacity),
      availableMotorcycleSpaces: available(motoSpaces, motorcycleCapacity),
      availableTruckSpaces: available(truckSpaces, truckCapacity),
      maintenanceCarSpaces: autoSpaces.filter((s) => s.state === SpaceState.MANTENIMIENTO).length,
      maintenanceMotorcycleSpaces: motoSpaces.filter((s) => s.state === SpaceState.MANTENIMIENTO).length,
      maintenanceTruckSpaces: truckSpaces.filter((s) => s.state === SpaceState.MANTENIMIENTO).length,
      openingTime: parking.openingTime,
      closingTime: parking.closingTime,
      minReservationHours: parking.minReservationHours,
      maxReservationHours: parking.maxReservationHours,
      reservationMargin: parking.reservationMargin,
      isActive: parking.isActive,
      state: parking.isActive ? 'ACTIVO' : 'INACTIVO',
      name: parking.name,
      latitude: parking.latitude,
      longitude: parking.longitude,
      imageUrl: parking.imageUrl,
      image: parking.imageUrl,
      owner: sanitizedOwner,
      prices,
    };
  }

  // Una sola consulta de reservas en curso para todas las cocheras del listado.
  private async withLiveAvailability(parkings: Parking[]): Promise<any[]> {
    const inProgress = await this.parkingRepository.findInProgressReservationsForSpaces(parkings.flatMap((p) => activeSpaces(p).map((s) => s.id)));
    return parkings.map((p) => this.formatParkingResponse(p, inProgress));
  }

  private async enrichWithLiveAvailability(parking: Parking): Promise<any> {
    return (await this.withLiveAvailability([parking]))[0];
  }

  async findAll(): Promise<any[]> {
    const parkings = await this.parkingRepository.findAll();
    return await this.withLiveAvailability(parkings);
  }

  async findActive(): Promise<any[]> {
    const parkings = await this.parkingRepository.findActive();
    // Exigir que la cochera posea al menos una tarifa activa para figurar como activa
    const parkingsWithTariff = parkings.filter((p) => {
      const activePrices = p.parkingpriceHistory?.isInitialized()
        ? p.parkingpriceHistory.getItems().filter((price) => !price.expirationDate || price.expirationDate === null)
        : [];
      return activePrices.length > 0;
    });
    return await this.withLiveAvailability(parkingsWithTariff);
  }

  async findOne(id: string): Promise<any | null> {
    const parking = await this.parkingRepository.findOne({ id });
    if (!parking) return null;
    return await this.enrichWithLiveAvailability(parking);
  }



  async create(data: CreateParkingInput): Promise<any> {
    const owner = await this.parkingRepository.getUserById(data.ownerId);
    if (!owner || owner.status !== 'ACTIVO') {
      throw new AppError("Dueño no encontrado o inactivo", 404);
    }

    if (owner.type !== 'DUEÑO') {
      throw new AppError("Solo los usuarios con rol DUEÑO pueden crear estacionamientos", 403);
    }

    const { ownerId, ...parkingData } = data;
    const finalImageUrl = (parkingData.imageUrl || (parkingData as any).image || '').trim() || undefined;
    const parking = await this.parkingRepository.add({
      ...parkingData,
      imageUrl: finalImageUrl,
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
        vehicleType: 'MOTO',
        state: SpaceState.LIBRE,
        parking,
      });
    }

    if (parking.truckCapacity && parking.truckCapacity > 0) {
      for (let i = 1; i <= parking.truckCapacity; i++) {
        spacesToCreate.push({
          spaceCode: `C-${String(i).padStart(2, '0')}`,
          vehicleType: 'CAMIONETA',
          state: SpaceState.LIBRE,
          parking,
        });
      }
    }

    if (spacesToCreate.length > 0) {
      await this.parkingSpaceRepository.createBulk(spacesToCreate);
    }

    return await this.enrichWithLiveAvailability(parking);
  }

  // La capacidad no se edita acá (updateParkingSchema la descarta): la ajustan las altas y bajas de plazas (R-18).
  // La activación va por reactivate (exige tarifa); updateParkingSchema no deja pasar isActive.
  async update(id: string, data: any): Promise<any | null> {
    const updateData = { ...data };
    if (data.imageUrl !== undefined || (data as any).image !== undefined) {
      const rawUrl = data.imageUrl !== undefined ? data.imageUrl : (data as any).image;
      updateData.imageUrl = (rawUrl || '').trim() || null;
    }

    const updated = await this.parkingRepository.update(id, updateData);
    if (!updated) return null;
    return await this.enrichWithLiveAvailability(updated);
  }

  async remove(id: string): Promise<boolean> {
    return await this.parkingRepository.remove({ id });
  }

  async findByOwnerId(ownerId: string): Promise<any[]> {
    const parkings = await this.parkingRepository.findByOwnerId(ownerId);
    return await this.withLiveAvailability(parkings);
  }

  async reactivate(id: string): Promise<any | null> {
    const parking = await this.parkingRepository.findOne({ id });
    if (!parking) throw new AppError('Estacionamiento no encontrado', 404);

    const hasTariff = await this.parkingRepository.hasActivePrices(id);
    if (!hasTariff) {
      throw new AppError(
        'La cochera debe tener al menos una tarifa activa configurada para poder activarse',
        400
      );
    }

    const updated = await this.parkingRepository.update(id, { isActive: true });
    if (!updated) return null;
    return await this.enrichWithLiveAvailability(updated);
  }

  async getMetrics(id: string): Promise<any> {
    const parking = await this.parkingRepository.findOne({ id });
    if (!parking) throw new AppError('Estacionamiento no encontrado', 404);

    const [counts, totalRevenue] = await Promise.all([
      this.parkingRepository.getReservationStatusCounts(id),
      this.parkingRepository.getTotalRevenue(id),
    ]);

    // Ocupación = vehículos adentro ahora sobre todas las plazas (misma regla que Stats.Repository.spaces):
    // las confirmadas de otros días no ocupan nada todavía.
    const activeReservationsCount = counts[ReservationStatus.EN_CURSO] || 0;

    const totalCapacity = (parking.carCapacity || 0) + (parking.motorcycleCapacity || 0) + (parking.truckCapacity || 0);
    const occupancyRate = totalCapacity > 0 ? (activeReservationsCount / totalCapacity) * 100 : 0;

    return {
      totalRevenue,
      reservations: counts,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      activeReservations: activeReservationsCount,
      totalCapacity,
    };
  }
}
