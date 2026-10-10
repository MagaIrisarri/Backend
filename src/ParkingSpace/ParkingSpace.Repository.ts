import { EntityManager } from "@mikro-orm/core";
import { ParkingSpace, SpaceState } from "./ParkingSpace.Entity.js";
import { Reservation } from "../Reservation/Reservation.Entity.js";
import { Repository } from "../Shared/base.Repository.js";
import { AppError } from "../Shared/utils/AppError.js";
import { ACTIVE_RESERVATION_STATUSES, ReservationStatus } from "../Shared/constants/status.js";
import { categorizeVehicleType, matchesVehicleType } from "../Shared/utils/vehicleTypes.js";

// Campo de capacidad de la sucursal que corresponde a cada categoría de plaza.
export const capacityField = (vehicleType: string) =>
  ({ AUTO: 'carCapacity', MOTO: 'motorcycleCapacity', CAMIONETA: 'truckCapacity' } as const)[categorizeVehicleType(vehicleType)];

// Reserva que se mueve de plaza al sacar la suya de servicio (va en details.conflicts del 409).
export interface Relocation {
  reservationId: string; code: string; plate: string; startTime: Date; endTime: Date;
  toSpaceId: string | null; toSpaceCode: string | null; // null: no hay plaza libre para esa reserva
}

export class ParkingSpaceRepository implements Repository<ParkingSpace> {
  constructor(private em: EntityManager) {}

  /**
   * R-18/R-19: pasa la plaza a mantenimiento o la da de baja. Si tiene reservas futuras (pendientes o confirmadas),
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
        reservationId: r.id, code: 'R-' + r.id.slice(0, 6).toUpperCase(), plate: r.vehicle?.plate ?? '',
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
      else {
        space.isActive = false;
        const field = capacityField(space.vehicleType);
        space.parking[field] = Math.max(0, Number(space.parking[field] ?? 0) - 1);
      }
      return { space, moved: conflicts };
    });
  }

  // Asigna en orden de inicio la primera plaza libre del mismo tipo sin choque, contando lo que ya se reasignó en esta pasada.
  private async planRelocation(tx: EntityManager, space: ParkingSpace) {
    const reservations = await tx.find(Reservation, {
      parkingSpace: space,
      status: { $in: [ReservationStatus.PENDIENTE, ReservationStatus.CONFIRMADA] },
      endTime: { $gt: new Date() },
    }, { populate: ['vehicle'] as any, orderBy: { startTime: 'ASC' } });
    if (!reservations.length) return [];

    const candidates = (await tx.find(ParkingSpace, {
      parking: space.parking, state: SpaceState.LIBRE, isActive: true, id: { $ne: space.id },
    }, { orderBy: { spaceCode: 'ASC' } })).filter(c => matchesVehicleType(c.vehicleType, space.vehicleType));

    const margin = space.parking.reservationMargin * 60 * 60 * 1000;
    const busy = new Map<string, [number, number][]>();
    const taken = await tx.find(Reservation, {
      parkingSpace: { $in: candidates.map(c => c.id) },
      status: { $in: ACTIVE_RESERVATION_STATUSES },
      $or: [{ status: ReservationStatus.EN_CURSO }, { endTime: { $gt: new Date(Date.now() - margin) } }],
    }, { populate: ['parkingSpace'] });
    for (const r of taken) {
      // Un vehículo adentro que se pasó de hora ocupa la plaza al menos hasta ahora.
      const end = r.status === ReservationStatus.EN_CURSO ? Math.max(r.endTime.getTime(), Date.now()) : r.endTime.getTime();
      busy.set(r.parkingSpace.id, [...(busy.get(r.parkingSpace.id) ?? []), [r.startTime.getTime(), end]]);
    }

    return reservations.map(reservation => {
      const from = reservation.startTime.getTime() - margin, to = reservation.endTime.getTime() + margin;
      const target = candidates.find(c => !(busy.get(c.id) ?? []).some(([a, b]) => a < to && b > from)) ?? null;
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

  async findAvailableByParking(parkingId: string, vehicleType?: string): Promise<ParkingSpace[]> {
    const filter: any = { parking: { id: parkingId }, state: SpaceState.LIBRE, isActive: true };
    if (vehicleType) filter.vehicleType = vehicleType;
    return await this.em.find(ParkingSpace, filter);
  }

  // Pasa a la categoría ('AUTO', 'MOTO', 'CAMIONETA') las plazas guardadas antes del hook de la entidad
  // ('MOTOCICLETA', 'Camioneta'…). Corre al arrancar; si ya está todo unificado, no cambia nada.
  async normalizeVehicleTypes(): Promise<number> {
    const em = this.em.fork();
    const rows: { vehicle_type: string }[] = await em.getConnection().execute('SELECT DISTINCT BINARY vehicle_type AS vehicle_type FROM parking_space');
    let changed = 0;
    for (const { vehicle_type } of rows) {
      const raw = String(vehicle_type);
      const category = categorizeVehicleType(raw);
      if (raw === category) continue;
      // BINARY: compara el texto exacto (la columna no distingue mayúsculas y 'Camioneta' coincidiría con 'CAMIONETA').
      changed += (await em.getConnection().execute('UPDATE parking_space SET vehicle_type = ? WHERE BINARY vehicle_type = ?', [category, raw], 'run')).affectedRows ?? 0;
    }
    return changed;
  }

  async createBulk(spaces: Partial<ParkingSpace>[]): Promise<void> {
    for (const spaceData of spaces) {
      const space = this.em.create(ParkingSpace, { ...spaceData, isActive: true } as any);
      this.em.persist(space);
    }
    await this.em.flush();
  }


}