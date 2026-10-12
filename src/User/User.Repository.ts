import { EntityManager } from '@mikro-orm/core';
import { Repository } from '../Shared/base.Repository.js';
import { User } from './User.Entity.js';
import { Parking } from '../Parking/Parking.Entity.js';
import { Reservation } from '../Reservation/Reservation.Entity.js';
import { EmployeeShift } from '../EmployeeShift/EmployeeShift.Entity.js';
import { DayException } from '../EmployeeShift/DayException.Entity.js';
import { ACTIVE_RESERVATION_STATUSES } from '../Shared/constants/status.js';
import { isoDate } from '../Shared/utils/dateUtils.js';
import { likeWords } from '../Shared/utils/pagination.js';

export class UserRepository implements Repository<User> {
  constructor(private em: EntityManager) {}

  async findAll(): Promise<User[]> {
    return await this.em.find(User, {});
  }

  // Una página de usuarios con búsqueda (nombre, apellido, email o DNI), rol y estado.
  // `counts` rotula los filtros: por rol respeta el estado elegido y por estado respeta el rol, los dos con la búsqueda.
  async findPage(o: { page: number; limit: number; q?: string; role?: string; status?: string }) {
    const filters = likeWords(o.q).map((w) => ({ $or: [{ name: { $like: w } }, { last_name: { $like: w } }, { email: { $like: w } }, { dni: { $like: w } }] }));
    const base: any = filters.length ? { $and: filters } : {};
    const roles = ['CLIENTE', 'DUEÑO', 'EMPLEADO', 'ADMINISTRADOR'];
    const statuses = ['ACTIVO', 'BAJA'];
    const [[items, total], byRole, byStatus] = await Promise.all([
      this.em.findAndCount(User, { ...base, ...(o.role && { type: o.role }), ...(o.status && { status: o.status }) },
        { orderBy: { name: 'ASC', last_name: 'ASC' }, limit: o.limit, offset: (o.page - 1) * o.limit }),
      Promise.all(roles.map((type) => this.em.count(User, { ...base, ...(o.status && { status: o.status }), type }))),
      Promise.all(statuses.map((status) => this.em.count(User, { ...base, ...(o.role && { type: o.role }), status }))),
    ]);
    return {
      items, total,
      counts: { role: Object.fromEntries(roles.map((r, i) => [r, byRole[i]])), status: Object.fromEntries(statuses.map((s, i) => [s, byStatus[i]])) },
    };
  }

  async findOne(item: { id: string }): Promise<User | null> {
    return await this.em.findOne(User, { id: item.id });
  }

  async add(item: Partial<User>): Promise<User> {
    const user = this.em.create(User, item as any);
    await this.em.flush();
    return user;
  }

  async update(id: string, item: Partial<User>): Promise<User | null> {
    const user = await this.em.findOne(User, { id });
    if (!user) return null;

    // La columna `date` se lee como 'YYYY-MM-DD' (string) y MikroORM rechaza asignarle un Date: el esquema entrega Date.
    const { date_of_birth, ...rest } = item;
    this.em.assign(user, rest);
    if (date_of_birth) (user as any).date_of_birth = date_of_birth instanceof Date ? date_of_birth.toISOString().slice(0, 10) : date_of_birth;
    await this.em.flush();
    return user;
  }

  // Primer campo único (email, DNI o teléfono) que ya usa otro usuario.
  async findDuplicateField(data: Partial<User>, exceptId?: string): Promise<'email' | 'dni' | 'phone' | null> {
    const fields = (['email', 'dni', 'phone'] as const).filter((f) => data[f]);
    if (!fields.length) return null;
    const found = await this.em.findOne(User, { $or: fields.map((f) => ({ [f]: data[f] })), ...(exceptId && { id: { $ne: exceptId } }) } as any);
    return found ? (fields.find((f) => String(found[f]).toLowerCase() === String(data[f]).toLowerCase()) ?? fields[0]) : null;
  }

  async remove(item: { id: string }): Promise<boolean> {
    const user = await this.em.findOne(User, { id: item.id });
    if (!user) return false;


    user.status = "BAJA"
    await this.em.flush();
    return true;
  }

  async findOneForEmail (email: string): Promise<User | null>{
    return await this.em.findOne(User, { email });
  }

  // Para la baja (R-20): reservas activas de los vehículos de un cliente y sucursales activas de un dueño.
  async countActiveReservationsOfClient(clientId: string): Promise<number> {
    return await this.em.count(Reservation, { vehicle: { client: { id: clientId } }, status: { $in: [...ACTIVE_RESERVATION_STATUSES] } });
  }

  async countActiveParkingsOfOwner(ownerId: string): Promise<number> {
    return await this.em.count(Parking, { owner: { id: ownerId }, isActive: true });
  }

  // Para la baja de un empleado: turnos de la semana tipo, días especiales desde hoy y reservas activas que tiene asignados.
  async countPendingWorkOfEmployee(employee: User): Promise<{ shifts: number; reservations: number }> {
    const [template, exceptions, reservations] = await Promise.all([
      this.em.count(EmployeeShift, { employee: { id: employee.id }, isActive: true }),
      employee.parkingId ? this.em.find(DayException, { parking: { id: employee.parkingId }, date: { $gte: isoDate(new Date()) } }) : [],
      this.em.count(Reservation, { attendedBy: { id: employee.id }, status: { $in: [...ACTIVE_RESERVATION_STATUSES] } }),
    ]);
    const special = exceptions.filter((e) => e.shifts.some((s) => s.employeeId === employee.id)).length;
    return { shifts: template + special, reservations };
  }

  async ownsParking(ownerId: string, parkingId: string): Promise<boolean> {
    return (await this.em.count(Parking, { id: parkingId, owner: { id: ownerId } })) > 0;
  }

  async findByOwner(ownerId: string, status = 'ACTIVO'): Promise<User[]> {
      return await this.em.find(User, { type: 'EMPLEADO', ownerId, status });
    }
  }
