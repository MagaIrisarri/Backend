import { EntityManager } from '@mikro-orm/core';
import { Holiday } from './Holiday.Entity.js';
import { HolidayAdhesion } from './HolidayAdhesion.Entity.js';
import { User } from '../User/User.Entity.js';
import { AppError } from '../Shared/utils/AppError.js';
import { NotificationType, UserStatus, UserType } from '../Shared/constants/status.js';
import type { NotificationService } from '../Notification/Notification.Service.js';
import { fetchOfficialHolidays, type OfficialSource } from './officialHolidays.js';

type Actor = { id: string; type: string };
const isAdmin = (actor: Actor) => actor.type === UserType.ADMINISTRADOR;
// R-10: el administrador ve los nacionales; el dueño, los nacionales y los suyos.
const visibleTo = (actor: Actor) => (isAdmin(actor) ? { owner: null } : { $or: [{ owner: null }, { owner: actor.id }] });
const todayISO = () => new Date().toLocaleDateString('sv-SE'); // día local (TZ fijada en orm.ts)

export class HolidayService {
  constructor(private em: EntityManager, private notifications?: NotificationService, private source: OfficialSource = fetchOfficialHolidays) {}

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
      if (admin) return this.addNational(em, data.date, data.name, 'manual');
      const holiday = em.create(Holiday, { ...data, origin: 'manual', owner: em.getReference(User, actor.id) });
      await em.flush();
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

  // L-12: vista previa (dryRun) o confirmación de la importación del calendario oficial. Agrega todas las fechas nuevas y quita
  // las de `remove`, que tienen que estar entre las que ya no figuran: quitarlas abre las sucursales que cerraban ese día.
  async importOfficial(actor: Actor, dryRun: boolean, remove: string[] = []) {
    if (!isAdmin(actor)) throw new AppError('Solo el administrador importa el calendario oficial', 403);
    const diff = await this.officialDiff(this.em);
    if (dryRun) return diff;
    const missing = new Set(diff.missing.map(h => h.id));
    if (remove.some(id => !missing.has(id))) throw new AppError('El calendario cambió desde la vista previa: volvé a revisarla', 409);
    await this.em.transactional(async (em) => {
      for (const h of diff.toAdd) await this.addNational(em, h.date, h.name, 'oficial');
      if (remove.length) {
        await em.nativeDelete(HolidayAdhesion, { holiday: { $in: remove } });
        await em.nativeDelete(Holiday, { id: { $in: remove } });
      }
    });
    return { added: diff.toAdd.length, removed: remove.length };
  }

  // L-12: lo corre un timer al arrancar y cada HOLIDAYS_SYNC_HOURS (sin RequestContext, por eso el fork). Solo agrega fechas:
  // quitar una que ya no figura lo decide el administrador en la importación, porque abre las sucursales que cerraban.
  async syncOfficial(): Promise<number> {
    const em = this.em.fork();
    const { toAdd, missing } = await this.officialDiff(em);
    if (!toAdd.length) return 0;
    await em.transactional(async (tx) => { for (const h of toAdd) await this.addNational(tx, h.date, h.name, 'oficial'); });
    const admins = await em.find(User, { type: UserType.ADMINISTRADOR, status: UserStatus.ACTIVO }, { fields: ['id'] });
    const added = toAdd.map(h => `${h.date.split('-').reverse().join('/')} ${h.name}`).join('; ');
    await this.notifications?.notify(admins.map(a => a.id), {
      type: NotificationType.FERIADOS_ACTUALIZADOS,
      title: 'Calendario oficial actualizado',
      message: `Se ${toAdd.length === 1 ? 'cargó' : 'cargaron'} del calendario oficial: ${added}.`.slice(0, 400)
        + (missing.length ? ` ${missing.length === 1 ? 'Un feriado ya no figura' : `${missing.length} feriados ya no figuran`}: revisalos en Feriados › Importar.` : ''),
    });
    return toAdd.length;
  }

  // Diferencias con el calendario oficial de hoy a fin del año próximo, por fecha (un traslado aparece como una fecha nueva y
  // una que falta). Solo faltan los nacionales de origen oficial de un año publicado: los manuales del administrador no se tocan.
  private async officialDiff(em: EntityManager) {
    const from = todayISO();
    const years = [+from.slice(0, 4), +from.slice(0, 4) + 1];
    const lists = await Promise.all(years.map(y => this.source(y)));
    const published = new Set(years.filter((_, i) => lists[i]).map(String));
    const official = new Map(lists.flatMap(l => l ?? []).filter(h => h.date >= from).map(h => [h.date, h.name]));
    const national = await em.find(Holiday, { owner: null, date: { $gte: from, $lte: `${years[1]}-12-31` } }, { orderBy: { date: 'ASC' } });
    const taken = new Set(national.map(h => h.date));
    const missing = national.filter(h => h.origin === 'oficial' && published.has(h.date.slice(0, 4)) && !official.has(h.date));
    const closures = new Map<string, number>();
    if (missing.length) {
      for (const a of await em.find(HolidayAdhesion, { holiday: { $in: missing } })) closures.set(a.holiday.id, (closures.get(a.holiday.id) ?? 0) + 1);
    }
    return {
      toAdd: [...official].filter(([date]) => !taken.has(date)).map(([date, name]) => ({ date, name })).sort((a, b) => a.date.localeCompare(b.date)),
      missing: missing.map(h => ({ id: h.id, date: h.date, name: h.name, closures: closures.get(h.id) ?? 0 })),
    };
  }

  // Un solo feriado por fecha: los propios de ese día pasan al nacional y conservan qué sucursales cierran.
  private async addNational(em: EntityManager, date: string, name: string, origin: Holiday['origin']) {
    const holiday = em.create(Holiday, { date, name, origin, owner: null });
    await em.flush();
    const own = (await em.find(Holiday, { date, owner: { $ne: null } })).map(h => h.id);
    if (own.length) {
      await em.nativeUpdate(HolidayAdhesion, { holiday: { $in: own } }, { holiday: holiday.id });
      await em.nativeDelete(Holiday, { id: { $in: own } });
    }
    return holiday;
  }
}
