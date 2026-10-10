import { EntityManager } from '@mikro-orm/core';
import { Repository } from '../Shared/base.Repository.js';
import { User } from './User.Entity.js';
import { Parking } from '../Parking/Parking.Entity.js';
import { Reservation } from '../Reservation/Reservation.Entity.js';
import { ACTIVE_RESERVATION_STATUSES } from '../Shared/constants/status.js';

export class UserRepository implements Repository<User> {
  constructor(private em: EntityManager) {}

  async findAll(): Promise<User[]> {
    return await this.em.find(User, {});
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

  async ownsParking(ownerId: string, parkingId: string): Promise<boolean> {
    return (await this.em.count(Parking, { id: parkingId, owner: { id: ownerId } })) > 0;
  }

  async findByOwner(ownerId: string, status = 'ACTIVO'): Promise<User[]> {
      return await this.em.find(User, { type: 'EMPLEADO', ownerId, status });
    }
  }
