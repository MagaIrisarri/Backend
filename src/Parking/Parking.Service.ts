import { Parking } from './Parking.Entity.js';
import { ParkingRepository, type ParkingPageOptions } from './Parking.Repository.js';
import { ParkingSpace, SpaceState } from '../ParkingSpace/ParkingSpace.Entity.js';
import { ParkingSpaceRepository } from '../ParkingSpace/ParkingSpace.Repository.js';
import type { Reservation } from '../Reservation/Reservation.Entity.js';
import { CreateParkingInput } from './Parking.Schema.js';
import { AppError } from '../Shared/utils/AppError.js';
import { NotificationType, ReservationStatus } from '../Shared/constants/status.js';
import type { NotificationService } from '../Notification/Notification.Service.js';
import { VEHICLE_CATEGORIES, spacePrefix } from '../Shared/utils/vehicleTypes.js';

// Plazas vigentes: las dadas de baja (isActive = false) siguen en la colección pero no cuentan.
const activeSpaces = (parking: Parking): ParkingSpace[] =>
  parking.parkingSpaces?.isInitialized() ? parking.parkingSpaces.getItems().filter((s) => s.isActive !== false) : [];

// Orden de los tipos en la respuesta: los base como siempre (AUTO, MOTO, CAMIONETA) y después los demás por nombre.
const typeOrder = (a: { name: string }, b: { name: string }) => {
  const rank = (n: string) => { const i = (VEHICLE_CATEGORIES as readonly string[]).indexOf(n); return i < 0 ? VEHICLE_CATEGORIES.length : i; };
  return rank(a.name) - rank(b.name) || a.name.localeCompare(b.name, 'es');
};

// Capacidad, libres ahora y en mantenimiento de un tipo de plaza (R-30: la capacidad es la cantidad de plazas activas).
export interface SpaceTypeSummary { vehicleTypeId: string; name: string; capacity: number; available: number; maintenance: number }

const PAUSE_REASON = 'la sucursal se pausó y no atiende reservas por ahora';
const WALK_IN_ONLY_REASON = 'la sucursal dejó de tomar reservas online por ahora y atiende solo en el lugar';

export class ParkingService {
  constructor(
    private readonly parkingRepository: ParkingRepository,
    private readonly parkingSpaceRepository: ParkingSpaceRepository,
    private readonly notifications: NotificationService,
  ) {}

  // Disponibilidad "en vivo": vehículos adentro ahora (reservas EN CURSO) o plazas marcadas OCUPADO a mano, sin contar dos veces
  // la misma plaza. Las pendientes todavía no ocupan nada; las de mantenimiento no están libres ni ocupadas.
  private formatParkingResponse(parking: Parking, inProgress: Reservation[]) {
    const spaces = activeSpaces(parking);
    const byType = new Map<string, { name: string; list: ParkingSpace[] }>();
    for (const s of spaces) {
      const entry = byType.get(s.vehicleType.id) ?? { name: s.vehicleType.name, list: [] };
      entry.list.push(s);
      byType.set(s.vehicleType.id, entry);
    }
    const spaceTypes: SpaceTypeSummary[] = [...byType].map(([vehicleTypeId, { name, list }]) => {
      const ids = new Set(list.map((s) => s.id));
      const inside = inProgress.filter((r) => ids.has(r.parkingSpace.id));
      const occupied = Math.max(new Set([...list.filter((s) => s.state === SpaceState.OCUPADO).map((s) => s.id), ...inside.map((r) => r.parkingSpace.id)]).size, inside.length);
      const maintenance = list.filter((s) => s.state === SpaceState.MANTENIMIENTO).length;
      return { vehicleTypeId, name, capacity: list.length, available: Math.max(0, list.length - occupied - maintenance), maintenance };
    }).sort(typeOrder);

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

    // Tarifas vigentes, una por tipo de vehículo (R-30).
    let prices: Array<{ id: string; vehicleTypeId: string; vehicleType: string; price: number }> = [];
    if (parking.parkingpriceHistory?.isInitialized()) {
      const activePrices = parking.parkingpriceHistory
        .getItems()
        .filter((p) => !p.expirationDate || p.expirationDate === null);
      const byId = new Map<string, { id: string; vehicleTypeId: string; vehicleType: string; price: number }>();
      for (const p of activePrices) {
        byId.set(p.vehicleType.id, {
          id: p.id,
          vehicleTypeId: p.vehicleType.id,
          vehicleType: p.vehicleType.name,
          price: Number(p.price) || 0,
        });
      }
      prices = Array.from(byId.values()).sort((a, b) => typeOrder({ name: a.vehicleType }, { name: b.vehicleType }));
    }

    return {
      id: parking.id,
      province: parking.province ?? null,
      locality: parking.locality,
      neighborhood: parking.neighborhood ?? null,
      postalCode: parking.postalCode,
      address: parking.address,
      spaceTypes,
      totalCapacity: spaces.length,
      availableSpaces: spaceTypes.reduce((n, t) => n + t.available, 0),
      openingTime: parking.openingTime,
      closingTime: parking.closingTime,
      minReservationHours: parking.minReservationHours,
      maxReservationHours: parking.maxReservationHours,
      reservationMargin: parking.reservationMargin,
      isActive: parking.isActive,
      walkInOnly: parking.walkInOnly ?? false,
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

  // Listado paginado del administrador: la disponibilidad en vivo se calcula solo para la página pedida.
  async findPage(options: ParkingPageOptions) {
    const [{ items, total, counts }, localities] = await Promise.all([this.parkingRepository.findPage(options), this.parkingRepository.localities()]);
    return { data: await this.withLiveAvailability(items), meta: { page: options.page, limit: options.limit, total, counts, localities } };
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

    // R-30: las plazas iniciales van por tipo de vehículo, y cada tipo tiene que existir y estar activo.
    const { ownerId, spaces = [], ...parkingData } = data;
    const types = new Map((await this.parkingRepository.findVehicleTypes(spaces.map((s) => s.vehicleTypeId))).map((t) => [t.id, t]));
    if (spaces.some((s) => !types.has(s.vehicleTypeId))) throw new AppError("Tipo de vehículo no encontrado o dado de baja", 404);

    const finalImageUrl = (parkingData.imageUrl || (parkingData as any).image || '').trim() || undefined;
    const parking = await this.parkingRepository.add({
      ...parkingData,
      imageUrl: finalImageUrl,
      owner,
    });

    // Código correlativo por tipo: A-01, M-01, C-01 en los tipos base y las tres primeras letras en los demás (UTI-01).
    const spacesToCreate: Partial<ParkingSpace>[] = spaces.flatMap(({ vehicleTypeId, quantity }) => {
      const vehicleType = types.get(vehicleTypeId)!;
      const prefix = spacePrefix(vehicleType.name);
      return Array.from({ length: quantity }, (_, i) => ({
        spaceCode: `${prefix}-${String(i + 1).padStart(2, '0')}`,
        vehicleType,
        state: SpaceState.LIBRE,
        parking,
      }));
    });

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

  // L-42: pausar deja de aceptar reservas, cancela las pendientes con motivo y avisa a cada cliente (D-13): reservó sin
  // conocer la situación nueva. Las que están en curso siguen hasta su salida y el personal recibe el aviso.
  // L-44: walkInOnly deja la sucursal en el mapa (sin reservar online) y el mostrador sigue; sin él, se cierra del todo.
  async remove(id: string, actorId: string, walkInOnly = false): Promise<{ cancelled: number; inProgress: number } | null> {
    const reason = walkInOnly ? WALK_IN_ONLY_REASON : PAUSE_REASON;
    const paused = await this.parkingRepository.pause(id, reason, walkInOnly);
    if (!paused) return null;
    const { parking, cancelled, inProgress } = paused;
    for (const r of cancelled) {
      await this.notifications.notify([r.vehicle.client.id], {
        type: NotificationType.RESERVA_CANCELADA, title: 'Reserva cancelada', reservationId: r.id,
        message: `La sucursal canceló tu reserva. Motivo: ${reason}`,
      });
    }
    await this.notifications.notifyStaff(parking, {
      type: NotificationType.SUCURSAL_PAUSADA,
      title: walkInOnly ? `${parking.name}: solo atención en el lugar` : `${parking.name} pausada`,
      message: `${walkInOnly ? 'No acepta reservas online; el mostrador sigue atendiendo.' : 'No acepta reservas nuevas.'} Se cancelaron ${cancelled.length} pendiente(s); las ${inProgress} en curso siguen hasta su salida.`,
    }, actorId);
    return { cancelled: cancelled.length, inProgress };
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

    const updated = await this.parkingRepository.update(id, { isActive: true, walkInOnly: false });
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
    // las pendientes de otros días no ocupan nada todavía.
    const activeReservationsCount = counts[ReservationStatus.EN_CURSO] || 0;

    const totalCapacity = activeSpaces(parking).length; // R-30: la capacidad es la cantidad de plazas activas
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
