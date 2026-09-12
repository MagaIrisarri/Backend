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

  private formatParkingResponse(
    parking: Parking,
    liveAvailability?: {
      carCapacity: number;
      motorcycleCapacity: number;
      truckCapacity: number;
      availableCarSpaces: number;
      availableMotorcycleSpaces: number;
      availableTruckSpaces: number;
    }
  ) {
    const spaces = parking.parkingSpaces?.isInitialized() ? parking.parkingSpaces.getItems() : [];
    const autoSpaces = spaces.filter((s) => s.vehicleType?.toUpperCase() === 'AUTO' && s.isActive);
    const motoSpaces = spaces.filter((s) => ['MOTOCICLETA', 'MOTO'].includes(s.vehicleType?.toUpperCase()) && s.isActive);
    const truckSpaces = spaces.filter((s) => ['CAMIONETA', 'VAN', 'UTILITARIO'].includes(s.vehicleType?.toUpperCase()) && s.isActive);

    const carCap = liveAvailability?.carCapacity ?? (parking.carCapacity ?? (autoSpaces.length > 0 ? autoSpaces.length : 0));
    const motoCap = liveAvailability?.motorcycleCapacity ?? (parking.motorcycleCapacity ?? (motoSpaces.length > 0 ? motoSpaces.length : 0));
    const truckCap = liveAvailability?.truckCapacity ?? (parking.truckCapacity ?? (truckSpaces.length > 0 ? truckSpaces.length : 0));

    let availableCarSpaces: number;
    let availableMotorcycleSpaces: number;
    let availableTruckSpaces: number;

    if (liveAvailability) {
      availableCarSpaces = liveAvailability.availableCarSpaces;
      availableMotorcycleSpaces = liveAvailability.availableMotorcycleSpaces;
      availableTruckSpaces = liveAvailability.availableTruckSpaces;
    } else {
      const occupiedCar = autoSpaces.filter((s) => s.state === 'OCUPADO').length;
      const occupiedMoto = motoSpaces.filter((s) => s.state === 'OCUPADO').length;
      const occupiedTruck = truckSpaces.filter((s) => s.state === 'OCUPADO').length;

      availableCarSpaces = Math.max(0, carCap - occupiedCar);
      availableMotorcycleSpaces = Math.max(0, motoCap - occupiedMoto);
      availableTruckSpaces = Math.max(0, truckCap - occupiedTruck);
    }

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
        const raw = (p.vehicleType || '').trim().toUpperCase();
        let category = 'AUTO';
        if (raw.includes('MOTO')) category = 'MOTO';
        else if (
          raw.includes('CAMION') ||
          raw.includes('UTIL') ||
          raw.includes('VAN') ||
          raw.includes('PICK')
        ) {
          category = 'CAMIONETA';
        }
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
      locality: parking.locality,
      postalCode: parking.postalCode,
      address: parking.address,
      carCapacity: carCap,
      motorcycleCapacity: motoCap,
      truckCapacity: truckCap,
      availableCarSpaces,
      availableMotorcycleSpaces,
      availableTruckSpaces,
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

  private async enrichWithLiveAvailability(parking: Parking): Promise<any> {
    try {
      const spaces = parking.parkingSpaces?.isInitialized() ? parking.parkingSpaces.getItems() : [];
      const spaceIds = spaces.map((s) => s.id).filter(Boolean);

      const isMoto = (t: string) => ['MOTOCICLETA', 'MOTO'].includes(t);
      const isTruck = (t: string) => ['CAMIONETA', 'VAN', 'UTILITARIO', 'PICKUP', 'PICK-UP'].includes(t);

      const reservedMotoSpaceIds = new Set<string>();
      const reservedCarSpaceIds = new Set<string>();
      const reservedTruckSpaceIds = new Set<string>();

      let motoResCount = 0;
      let carResCount = 0;
      let truckResCount = 0;

      if (spaceIds.length > 0) {
        try {
          const now = new Date();
          const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

          const activeReservations = await this.parkingRepository.findActiveReservationsForSpaces(
            spaceIds,
            now,
            next24Hours
          );

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
        } catch (resErr) {
          console.warn('Advertencia al consultar reservas activas para disponibilidad:', resErr);
        }
      }

      const autoSpaces = spaces.filter((s) => s.vehicleType?.toUpperCase() === 'AUTO' && s.isActive);
      const motoSpaces = spaces.filter((s) => ['MOTOCICLETA', 'MOTO'].includes(s.vehicleType?.toUpperCase()) && s.isActive);
      const truckSpaces = spaces.filter((s) => ['CAMIONETA', 'VAN', 'UTILITARIO'].includes(s.vehicleType?.toUpperCase()) && s.isActive);

      const carCap = parking.carCapacity ?? (autoSpaces.length > 0 ? autoSpaces.length : 0);
      const motoCap = parking.motorcycleCapacity ?? (motoSpaces.length > 0 ? motoSpaces.length : 0);
      const truckCap = parking.truckCapacity ?? (truckSpaces.length > 0 ? truckSpaces.length : 0);

      const occupiedSpacesByStateCar = autoSpaces.filter((s) => s.state === 'OCUPADO').length;
      const occupiedSpacesByStateMoto = motoSpaces.filter((s) => s.state === 'OCUPADO').length;
      const occupiedSpacesByStateTruck = truckSpaces.filter((s) => s.state === 'OCUPADO').length;

      const totalOccupiedCar = Math.max(occupiedSpacesByStateCar, reservedCarSpaceIds.size, carResCount);
      const totalOccupiedMoto = Math.max(occupiedSpacesByStateMoto, reservedMotoSpaceIds.size, motoResCount);
      const totalOccupiedTruck = Math.max(occupiedSpacesByStateTruck, reservedTruckSpaceIds.size, truckResCount);

      return this.formatParkingResponse(parking, {
        carCapacity: carCap,
        motorcycleCapacity: motoCap,
        truckCapacity: truckCap,
        availableCarSpaces: Math.max(0, carCap - totalOccupiedCar),
        availableMotorcycleSpaces: Math.max(0, motoCap - totalOccupiedMoto),
        availableTruckSpaces: Math.max(0, truckCap - totalOccupiedTruck),
      });
    } catch (err) {
      console.error('Error calculando disponibilidad en vivo de la cochera:', err);
      return this.formatParkingResponse(parking);
    }
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
        ? p.parkingpriceHistory.getItems().filter((price) => !price.expirationDate || price.expirationDate === null)
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

  async findByOwner(ownerId: string): Promise<any[]> {
    const parkings = await this.parkingRepository.findByOwner(ownerId);
    return await Promise.all(parkings.map((p) => this.enrichWithLiveAvailability(p)));
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
        vehicleType: 'MOTOCICLETA',
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

  async update(id: string, data: any): Promise<any | null> {
    if (data.carCapacity !== undefined) {
      const distinctReservedSpaces = await this.parkingRepository.countReservedSpaces(id, 'AUTO');
      if (Number(data.carCapacity) < distinctReservedSpaces) {
        throw new AppError(
          `La nueva capacidad de autos (${data.carCapacity}) no puede ser menor a las plazas con reservas activas o futuras (${distinctReservedSpaces})`,
          400
        );
      }
    }

    if (data.motorcycleCapacity !== undefined) {
      const distinctReservedSpaces = await this.parkingRepository.countReservedSpaces(id, 'MOTOCICLETA');
      if (Number(data.motorcycleCapacity) < distinctReservedSpaces) {
        throw new AppError(
          `La nueva capacidad de motos (${data.motorcycleCapacity}) no puede ser menor a las plazas con reservas activas o futuras (${distinctReservedSpaces})`,
          400
        );
      }
    }

    if (data.isActive === true) {
      const hasTariff = await this.parkingRepository.hasActivePrices(id);
      if (!hasTariff) {
        throw new AppError(
          'La cochera debe tener al menos una tarifa activa configurada para poder activarse',
          400
        );
      }
    }

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
    return await Promise.all(parkings.map((p) => this.enrichWithLiveAvailability(p)));
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

    const activeReservationsCount =
      (counts['EN CURSO'] || 0) + (counts['CONFIRMADA'] || 0);

    const totalCapacity = (parking.carCapacity || 0) + (parking.motorcycleCapacity || 0);
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
