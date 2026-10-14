import { EntityManager } from '@mikro-orm/core';
import { VehicleType } from './VehicleType.Entity.js';
import { Model } from '../Model/Model.Entity.js';
import { Vehicle } from '../Vehicle.Entity.js';
import { ParkingSpace } from '../../ParkingSpace/ParkingSpace.Entity.js';
import { ParkingPrice } from '../../ParkingPrice/ParkingPrice.Entity.js';
import { Repository } from '../../Shared/base.Repository.js';
import { DnrpaTypeMap } from '../Catalog/DnrpaTypeMap.Entity.js';
import { Reservation, reservationCode } from '../../Reservation/Reservation.Entity.js';
import { ACTIVE_RESERVATION_STATUSES } from '../../Shared/constants/status.js';
import { AppError } from '../../Shared/utils/AppError.js';
import { descKey } from '../../Shared/utils/names.js';

export interface VehicleTypeUsage { models: number; vehicles: number; spaces: number; prices: number }

// Lo que cambia (o cambiaría, con dryRun) al asignar descripciones del DNRPA a un tipo.
export interface DescriptionChange {
  descriptions: number; models: number; vehicles: number;
  reservations: { code: string; plate: string; status: string; startTime: Date; parking: string }[];
}

export class VehicleTypeRepository implements Repository<VehicleType> {
  constructor(private readonly em: EntityManager) {}

  async findAll(): Promise<VehicleType[]> {
    return await this.em.find(VehicleType, { isActive: true });
  }

  async findOne(item: { id: string }): Promise<VehicleType | null> {
    return await this.em.findOne(VehicleType, { id: item.id, isActive: true });
  }

  async add(data: any): Promise<VehicleType> {
    const vehicleType = this.em.create(VehicleType, data);
    await this.em.flush();
    return vehicleType;
  }

  async update(id: string, data: any): Promise<VehicleType | null> {
    const vehicleType = await this.findOne({ id });
    if (!vehicleType) return null;

    this.em.assign(vehicleType, data);
    await this.em.flush();
    return vehicleType;
  }

  async remove(item: { id: string }): Promise<boolean> {
    const vehicleType = await this.findOne({ id: item.id });
    if (!vehicleType) return false;

    vehicleType.isActive = false;
    // RA-26: sus descripciones del DNRPA salen de la tabla y vuelven a la sugerencia automática.
    await this.em.nativeDelete(DnrpaTypeMap, { vehicleType: item.id });
    await this.em.flush();
    return true;
  }

  descriptionRows(): Promise<DnrpaTypeMap[]> {
    return this.em.find(DnrpaTypeMap, {}, { orderBy: { description: 'ASC' } });
  }

  describedModels(): Promise<Model[]> {
    return this.em.find(Model, { dnrpaDescription: { $ne: null }, isActive: true });
  }

  /**
   * RA-26: pasa cada fila de la tabla a su tipo nuevo y, con ella, los modelos de esa descripción y la copia del tipo
   * en sus vehículos, en una transacción. No se hace mientras alguno de esos vehículos tenga una reserva pendiente o en curso:
   * su plaza es del tipo viejo y la salida se cobraría con la tarifa del nuevo (como R-25). Responde 409 con esas reservas.
   * Con dryRun solo cuenta lo que cambiaría.
   */
  async reassignDescriptions(changes: { rowId: string; typeId: string }[], dryRun: boolean): Promise<DescriptionChange> {
    return await this.em.transactional(async (tx) => {
      const target = new Map(changes.map((c) => [c.rowId, c.typeId]));
      const rows = changes.length ? await tx.find(DnrpaTypeMap, { id: { $in: [...target.keys()] } }) : [];
      const typeByKey = new Map(rows.map((r) => [r.descriptionKey, target.get(r.id)!]));
      const models = (await tx.find(Model, { dnrpaDescription: { $ne: null } }))
        .filter((m) => { const t = typeByKey.get(descKey(m.dnrpaDescription!)); return t && t !== m.vehicleType.id; });
      const modelType = new Map(models.map((m) => [m.id, typeByKey.get(descKey(m.dnrpaDescription!))!]));
      const vehicles = models.length
        ? (await tx.find(Vehicle, { model: { $in: models.map((m) => m.id) } })).filter((v) => v.vehicleType.id !== modelType.get(v.model.id))
        : [];
      const active = vehicles.length
        ? await tx.find(Reservation, { vehicle: { $in: vehicles.map((v) => v.id) }, status: { $in: [...ACTIVE_RESERVATION_STATUSES] } },
          { populate: ['parkingSpace', 'parkingSpace.parking'] as any, orderBy: { startTime: 'ASC' } })
        : [];
      const result: DescriptionChange = {
        descriptions: rows.length, models: models.length, vehicles: vehicles.filter((v) => v.isActive).length,
        reservations: active.map((r) => ({
          code: r.code ?? reservationCode(r.id), plate: r.vehicle.plate, status: r.status ?? '', startTime: r.startTime, parking: r.parkingSpace?.parking?.name ?? '',
        })),
      };
      if (dryRun) return result;
      if (active.length) {
        throw new AppError(`No se puede cambiar el tipo: ${result.reservations.length === 1 ? 'hay 1 reserva activa' : `hay ${result.reservations.length} reservas activas`} de vehículos de esos modelos. Reintentá cuando terminen o se cancelen.`, 409, { reservations: result.reservations });
      }
      for (const r of rows) r.vehicleType = tx.getReference(VehicleType, target.get(r.id)!);
      for (const m of models) m.vehicleType = tx.getReference(VehicleType, modelType.get(m.id)!);
      for (const v of vehicles) v.vehicleType = tx.getReference(VehicleType, modelType.get(v.model.id)!);
      return result;
    });
  }

  // Lo que usa el tipo: con algo de esto activo, no se da de baja (409).
  async usage(id: string): Promise<VehicleTypeUsage> {
    const [models, vehicles, spaces, prices] = await Promise.all([
      this.em.count(Model, { vehicleType: id, isActive: true }),
      this.em.count(Vehicle, { vehicleType: id, isActive: true }),
      this.em.count(ParkingSpace, { vehicleType: id, isActive: true }),
      this.em.count(ParkingPrice, { vehicleType: id, expirationDate: null }),
    ]);
    return { models, vehicles, spaces, prices };
  }

  // Por tipo, en cuántas cocheras tiene plazas activas (R-30).
  async parkingsWithSpaces(): Promise<Map<string, number>> {
    const rows: { type: string; n: number }[] = await this.em.getConnection().execute(
      'SELECT vehicle_type_id AS type, COUNT(DISTINCT parking_id) AS n FROM parking_space WHERE is_active = 1 GROUP BY vehicle_type_id');
    return new Map(rows.map((r) => [r.type, Number(r.n)]));
  }
}