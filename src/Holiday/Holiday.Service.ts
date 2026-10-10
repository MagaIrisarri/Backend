import { EntityManager } from '@mikro-orm/core';
import { Holiday } from './Holiday.Entity.js';
import { HolidayParking } from './HolidayParking.Entity.js';
import { AppError } from '../Shared/utils/AppError.js';

export class HolidayService {
  constructor(private em: EntityManager) {}

  // Con parkingId cada feriado trae si esa sucursal lo abre (por defecto cierra, R-10).
  async list(year?: number, parkingId?: string) {
    const where = year ? { date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` } } : {};
    const holidays = await this.em.find(Holiday, where, { orderBy: { date: 'ASC' } });
    const opened = parkingId
      ? new Set((await this.em.find(HolidayParking, { parking: { id: parkingId }, holiday: { $in: holidays } })).map(h => h.holiday.id))
      : null;
    return holidays.map(h => ({ id: h.id, date: h.date, name: h.name, origin: h.origin, ...(opened && { open: opened.has(h.id) }) }));
  }

  async create(data: { date: string; name: string }) {
    if (await this.em.findOne(Holiday, { date: data.date })) throw new AppError('Ya hay un feriado en esa fecha', 409);
    const holiday = this.em.create(Holiday, { ...data, origin: 'manual' });
    await this.em.flush();
    return holiday;
  }

  async remove(id: string): Promise<boolean> {
    const holiday = await this.em.findOne(Holiday, { id });
    if (!holiday) return false;
    // shortcut: R-10, quitar un feriado ya abierto no revisa excepciones cargadas ese día, que quedan como día modificado
    await this.em.nativeDelete(HolidayParking, { holiday });
    this.em.remove(holiday);
    await this.em.flush();
    return true;
  }
}
