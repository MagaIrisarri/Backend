import { EntityManager } from "@mikro-orm/core";
import { ParkingSpace, SpaceState } from "./ParkingSpace.Entity.js";
import { Reservation, reservationCode } from "../Reservation/Reservation.Entity.js";
import { Repository } from "../Shared/base.Repository.js";
import { AppError } from "../Shared/utils/AppError.js";
import { ACTIVE_RESERVATION_STATUSES, ReservationStatus } from "../Shared/constants/status.js";
import { VehicleType } from "../Vehicle/VehicleType/VehicleType.Entity.js";

// Reserva que se mueve de plaza al sacar la suya de servicio (va en details.conflicts del 409).
export interface Relocation {
  reservationId: string; code: string; plate: string; startTime: Date; endTime: Date;
  toSpaceId: string | null; toSpaceCode: string | null; // null: no hay plaza libre para esa reserva
}

type Interval = [number, number];
const HOUR_MS = 60 * 60 * 1000;
const overlaps = (list: Interval[] = [], from: number, to: number) => list.some(([a, b]) => a < to && b > from);

// Horarios tomados en cada plaza por reservas activas. Un vehículo adentro que se pasó de hora la ocupa al menos hasta ahora (R-21).
async function busyIntervals(em: EntityManager, spaceIds: string[], exceptReservationId?: string): Promise<Map<string, Interval[]>> {
  const busy = new Map<string, Interval[]>();
  if (!spaceIds.length) return busy;
  const taken = await em.find(Reservation, {
    parkingSpace: { $in: spaceIds }, status: { $in: [...ACTIVE_RESERVATION_STATUSES] },
    ...(exceptReservationId ? { id: { $ne: exceptReservationId } } : {}),
  }, { populate: ['parkingSpace'] });
  for (const r of taken) {
    const end = r.status === ReservationStatus.EN_CURSO ? Math.max(r.endTime.getTime(), Date.now()) : r.endTime.getTime();
    busy.set(r.parkingSpace.id, [...(busy.get(r.parkingSpace.id) ?? []), [r.startTime.getTime(), end]]);
  }
  return busy;
}

// Plazas que pueden recibir reservas: activas, fuera de mantenimiento y del tipo del vehículo (R-30: el mismo tipo, por id).
const candidates = async (em: EntityManager, parkingId: string, vehicleTypeId: string, exceptSpaceId?: string) =>
  await em.find(ParkingSpace, {
    parking: parkingId, vehicleType: vehicleTypeId, isActive: true, state: { $ne: SpaceState.MANTENIMIENTO },
    ...(exceptSpaceId ? { id: { $ne: exceptSpaceId } } : {}),
  }, { orderBy: { spaceCode: 'ASC' } });

// Libre para [from, to]: sin choque con otra reserva y, si el horario ya empezó, libre ahora (sin un vehículo marcado adentro).
// Que hoy esté ocupada no importa para más tarde: una cochera llena ahora acepta reservas para otro horario.
const isFree = (s: ParkingSpace, busy: Map<string, Interval[]>, from: number, to: number) =>
  (from > Date.now() || s.state === SpaceState.LIBRE) && !overlaps(busy.get(s.id), from, to);

/**
 * Única regla para saber qué plazas están libres en un horario: alta de reserva (automática o elegida), cambio de plaza (R-15),
 * disponibilidad, reubicación (R-19) e ingreso con la plaza ocupada (R-21). Sin choque con otra reserva activa en
 * [inicio − margen, fin + margen] de la sucursal; ordenadas por código.
 */
export async function findFreeSpaces(
  em: EntityManager, parking: { id: string; reservationMargin: number }, vehicleTypeId: string,
  start: Date, end: Date, exceptReservationId?: string,
): Promise<ParkingSpace[]> {
  const margin = Number(parking.reservationMargin ?? 0) * HOUR_MS;
  const from = start.getTime() - margin, to = end.getTime() + margin;
  const spaces = await candidates(em, parking.id, vehicleTypeId);
  const busy = await busyIntervals(em, spaces.map((s) => s.id), exceptReservationId);
  return spaces.filter((s) => isFree(s, busy, from, to));
}

export class ParkingSpaceRepository implements Repository<ParkingSpace> {
  constructor(private em: EntityManager) {}

  freeSpaces(parking: { id: string; reservationMargin: number }, vehicleTypeId: string, start: Date, end: Date): Promise<ParkingSpace[]> {
    return findFreeSpaces(this.em, parking, vehicleTypeId, start, end);
  }

  findVehicleType(id: string): Promise<VehicleType | null> {
    return this.em.findOne(VehicleType, { id, isActive: true });
  }

  /**
   * R-18/R-19: pasa la plaza a mantenimiento o la da de baja. Si tiene reservas futuras (pendientes),
   * propone para cada una otra plaza libre del mismo tipo sin choque de horario (con el margen de la sucursal).
   * Sin `relocate`, o si alguna no tiene lugar, responde 409 con la propuesta en details.conflicts y no cambia nada.
   * Con `relocate`, mueve las reservas y saca la plaza de servicio en la misma transacción.
   */
  async takeOutOfService(spaceId: string, action: 'MANTENIMIENTO' | 'BAJA', relocate: boolean): Promise<{ space: ParkingSpace; moved: Relocation[] }> {
    return await this.em.transactional(async (tx) => {
      const space = await tx.findOne(ParkingSpace, { id: spaceId, isActive: true }, { populate: ['parking'] });
      if (!space) throw new AppError("Plaza no encontrada", 404);
      const verb = action === 'MANTENIMIENTO' ? 'pasar a mantenimiento' : 'dar de baja';

      const inside = space.state === SpaceState.OCUPADO
        || await tx.count(Reservation, { parkingSpace: space, status: ReservationStatus.EN_CURSO });
      if (inside) throw new AppError(`No se puede ${verb} la plaza ${space.spaceCode}: tiene un vehículo adentro`, 400);

      const plan = await this.planRelocation(tx, space);
      const conflicts: Relocation[] = plan.map(({ reservation: r, target }) => ({
        reservationId: r.id, code: r.code ?? reservationCode(r.id), plate: r.vehicle?.plate ?? '',
        startTime: r.startTime, endTime: r.endTime, toSpaceId: target?.id ?? null, toSpaceCode: target?.spaceCode ?? null,
      }));
      const stuck = conflicts.filter(c => !c.toSpaceId).length;
      if (conflicts.length && (!relocate || stuck)) {
        const msg = stuck
          ? `No se puede ${verb} la plaza ${space.spaceCode}: ${stuck} de sus ${conflicts.length} reservas futuras no tienen otra plaza libre en su horario`
          : `La plaza ${space.spaceCode} tiene ${conflicts.length} reserva(s) futura(s): confirmá para pasarlas a otras plazas libres`;
        throw new AppError(msg, 409, { conflicts });
      }

      plan.forEach(({ reservation, target }) => { reservation.parkingSpace = target!; });
      if (action === 'MANTENIMIENTO') space.state = SpaceState.MANTENIMIENTO;
      else space.isActive = false; // la capacidad del tipo baja sola: es la cantidad de plazas activas (R-30)
      return { space, moved: conflicts };
    });
  }

  // Asigna en orden de inicio la primera plaza libre del mismo tipo sin choque, contando lo que ya se reasignó en esta pasada.
  private async planRelocation(tx: EntityManager, space: ParkingSpace) {
    const reservations = await tx.find(Reservation, {
      parkingSpace: space,
      status: ReservationStatus.PENDIENTE,
      endTime: { $gt: new Date() },
    }, { populate: ['vehicle'] as any, orderBy: { startTime: 'ASC' } });
    if (!reservations.length) return [];

    const spaces = await candidates(tx, space.parking.id, space.vehicleType.id, space.id);
    const margin = Number(space.parking.reservationMargin ?? 0) * HOUR_MS;
    const busy = await busyIntervals(tx, spaces.map(c => c.id));

    return reservations.map(reservation => {
      const from = reservation.startTime.getTime() - margin, to = reservation.endTime.getTime() + margin;
      const target = spaces.find(c => isFree(c, busy, from, to)) ?? null;
      if (target) busy.set(target.id, [...(busy.get(target.id) ?? []), [reservation.startTime.getTime(), reservation.endTime.getTime()]]);
      return { reservation, target };
    });
  }

  async findAll(): Promise<ParkingSpace[]> {
    return await this.em.find(ParkingSpace, { isActive: true });
  }

  async findOne(item: { id: string }): Promise<ParkingSpace | null> {
    return await this.em.findOne(ParkingSpace, { id: item.id, isActive: true });
  }

  async add(data: any): Promise<ParkingSpace> {
    const space = this.em.create(ParkingSpace, { ...data, isActive: true });
    await this.em.flush();
    return space;
  }

  async update(id: string, data: any): Promise<ParkingSpace | null> {
    const space = await this.findOne({ id });
    if (!space) return null;

    this.em.assign(space, data);
    await this.em.flush();
    return space;
  }

  async remove(item: { id: string }): Promise<boolean> {
    const space = await this.findOne({ id: item.id });
    if (!space) return false;

    space.isActive = false;
    await this.em.flush();
    return true;
  }


  async findByParking(parkingId: string): Promise<ParkingSpace[]> {
    return await this.em.find(
      ParkingSpace,
      { parking: { id: parkingId }, isActive: true },
      { orderBy: { spaceCode: 'ASC' } }
    );
  }

  async createBulk(spaces: Partial<ParkingSpace>[]): Promise<void> {
    for (const spaceData of spaces) {
      const space = this.em.create(ParkingSpace, { ...spaceData, isActive: true } as any);
      this.em.persist(space);
    }
    await this.em.flush();
  }


}