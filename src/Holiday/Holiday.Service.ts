import { EntityManager } from '@mikro-orm/core';
import { Holiday } from './Holiday.Entity.js';
import { HolidayAdhesion } from './HolidayAdhesion.Entity.js';
import { User } from '../User/User.Entity.js';
import { AppError } from '../Shared/utils/AppError.js';
import { UserType } from '../Shared/constants/status.js';

type Actor = { id: string; type: string };
const isAdmin = (actor: Actor) => actor.type === UserType.ADMINISTRADOR;
// R-10: el administrador ve los nacionales; el dueño, los nacionales y los suyos.
const visibleTo = (actor: Actor) => (isAdmin(actor) ? { owner: null } : { $or: [{ owner: null }, { owner: actor.id }] });

export class HolidayService {
  constructor(private em: EntityManager) {}

  // Con parkingId, cada feriado trae open: la sucursal trabaja (por defecto) o se adhirió y cierra.
  async list(actor: Actor, year?: number, parkingId?: string) {
    const holidays = await this.em.find(Holiday, {
      ...visibleTo(actor),
      ...(year && { date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` } }),
    }, { orderBy: { date: 'ASC' } });
    const closed = parkingId
      ? new Set((await this.em.find(HolidayAdhesion, { parking: { id: parkingId }, holiday: { $in: holidays } })).map(a => a.holiday.id))
      : null;
    return holidays.map(h => ({
      id: h.id, date: h.date, name: h.name, origin: h.origin, scope: h.owner ? 'propio' : 'nacional',
      ...(closed && { open: !closed.has(h.id) }),
    }));
  }

  // El administrador carga uno nacional y el dueño uno propio. Cargar no cierra nada: cada sucursal trabaja hasta que se adhiere.
  async create(data: { date: string; name: string }, actor: Actor) {
    const admin = isAdmin(actor);
    if (await this.em.findOne(Holiday, { date: data.date, ...visibleTo(actor) })) {
      throw new AppError(admin ? 'Ya hay un feriado nacional en esa fecha' : 'Ya hay un feriado en esa fecha: elegí qué sucursales cierran', 409);
    }
    return this.em.transactional(async (em) => {
      const holiday = em.create(Holiday, { ...data, origin: 'manual', owner: admin ? null : em.getReference(User, actor.id) });
      await em.flush();
      if (admin) {
        // Un solo feriado por fecha: los propios de ese día pasan al nacional y conservan qué sucursales cierran.
        const own = (await em.find(Holiday, { date: data.date, owner: { $ne: null } })).map(h => h.id);
        if (own.length) {
          await em.nativeUpdate(HolidayAdhesion, { holiday: { $in: own } }, { holiday: holiday.id });
          await em.nativeDelete(Holiday, { id: { $in: own } });
        }
      }
      return holiday;
    });
  }

  // El administrador quita los nacionales y el dueño los suyos. Quitar abre las sucursales que cerraban: no choca con reservas.
  async remove(id: string, actor: Actor): Promise<boolean> {
    const holiday = await this.em.findOne(Holiday, { id, ...visibleTo(actor) });
    if (!holiday) return false;
    if (!isAdmin(actor) && !holiday.owner) throw new AppError('Los feriados nacionales los quita el administrador', 403);
    await this.em.nativeDelete(HolidayAdhesion, { holiday });
    this.em.remove(holiday);
    await this.em.flush();
    return true;
  }
}
