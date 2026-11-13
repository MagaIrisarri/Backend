import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { orm } from '../db/orm.js';
import { User } from '../../User/User.Entity.js';
import { Parking } from '../../Parking/Parking.Entity.js';
import { Vehicle } from '../../Vehicle/Vehicle.Entity.js';
import { Reservation } from '../../Reservation/Reservation.Entity.js';
import { Invoice } from '../../Invoice/Invoice.Entity.js';
import { AppError } from '../utils/AppError.js';
import { isStaffOf } from '../utils/staff.js';
import { UserStatus, UserType } from '../constants/status.js';
import { TOKEN_TTL } from '../constants/auth.js';

// Lo que viaja en el token: quién es y su rol. Lo demás del usuario (sucursal, estado) se lee de la base donde hace falta.
export type AuthUser = { id: string; type: UserType };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) throw new Error('Falta JWT_SECRET');
// Sin JWT_SECRET (desarrollo) la clave es aleatoria: nadie puede firmar tokens con una clave del repo. Las sesiones vencen al reiniciar.
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

export const signToken = (user: { id: string; type: string }) =>
  jwt.sign({ role: user.type }, JWT_SECRET, { subject: user.id, expiresIn: TOKEN_TTL });

const ROLES = Object.values(UserType) as string[];

// Sesión obligatoria y, si se pasan, uno de esos roles. El rol sale del token firmado, sin consultar la base.
// shortcut: L-46, una baja o un cambio de rol rigen recién cuando vence el token (TOKEN_TTL), revocar tokens si hiciera falta cortar antes.
export const auth = (...roles: UserType[]) => (req: Request, _res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new AppError('Iniciá sesión para continuar', 401);
  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
  } catch {
    throw new AppError('La sesión venció o no es válida: iniciá sesión de nuevo', 401);
  }
  if (!payload.sub || !ROLES.includes(payload.role)) throw new AppError('La sesión venció o no es válida: iniciá sesión de nuevo', 401);
  const user: AuthUser = { id: payload.sub, type: payload.role };
  if (roles.length && !roles.includes(user.type)) throw new AppError('No tenés permiso para esta acción', 403);
  req.user = user;
  next();
};

// El id del propio usuario en la ruta o en el body (clientId, ownerId...) tiene que ser el del token; el administrador puede pedir por otros.
export const self = (field: string) => (req: Request, _res: Response, next: NextFunction) => {
  const id = req.params[field] ?? req.body?.[field];
  if (req.user?.type !== UserType.ADMINISTRADOR && (!req.user || id !== req.user.id)) {
    throw new AppError('No tenés permiso para esta acción', 403);
  }
  next();
};

// Pertenencia (L-37): el recurso de la ruta tiene que ser del usuario. Va después de auth. Si el recurso no existe, sigue
// y responde el servicio (404 o 400). El administrador pasa: lo que puede hacer ya lo limita el rol de la ruta (RA-19).
const allow = (owns: (req: Request, user: AuthUser) => Promise<boolean | null | undefined>) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    if (req.user?.type !== UserType.ADMINISTRADOR && (await owns(req, req.user!)) === false) {
      throw new AppError('No tenés permiso para esta acción', 403);
    }
    next();
  };

// Personal: el empleado se lee de la base, porque su sucursal puede cambiar y no viaja en el token.
const staff = async (user: AuthUser, parking: Parking) =>
  isStaffOf(user.type === UserType.EMPLEADO ? await orm.em.findOne(User, { id: user.id, status: UserStatus.ACTIVO }) : user, parking);

// Cochera del dueño; con staff, también la sucursal del empleado (isStaffOf). El id sale de la ruta, del body o de parkingOf.
export const ownParking = (parkingId: (req: Request) => unknown, withStaff = false) => allow(async (req, user) => {
  const id = await parkingId(req);
  const parking = typeof id === 'string' ? await orm.em.findOne(Parking, { id }) : null;
  return parking && (withStaff ? staff(user, parking) : parking.owner.id === user.id);
});

// La cochera de la plaza, tarifa, precio de servicio, turno o cierre de la ruta (/:id).
export const parkingOf = <T extends { parking: { id: string } }>(entity: new (...args: any[]) => T) => async (req: Request) =>
  (await orm.em.findOne(entity, req.params.id as string))?.parking.id;

// Vehículo del cliente: el de la ruta o el de la reserva nueva (body.vehicleId).
export const ownVehicle = (vehicleId: (req: Request) => unknown) => allow(async (req, user) => {
  const id = vehicleId(req);
  const vehicle = typeof id === 'string' ? await orm.em.findOne(Vehicle, { id }) : null;
  return vehicle && vehicle.client.id === user.id;
});

// Una reserva la ven su cliente y el personal de la sucursal.
export const ownReservation = allow(async (req, user) => {
  const reservation = await orm.em.findOne(Reservation, { id: req.params.id as string }, { populate: ['parkingSpace.parking'] });
  return reservation && (reservation.vehicle.client.id === user.id || await staff(user, reservation.parkingSpace.parking));
});

// Una factura la cobra el personal de la sucursal de su reserva.
export const staffOfInvoice = allow(async (req, user) => {
  const invoice = await orm.em.findOne(Invoice, { id: req.params.id as string }, { populate: ['reservation.parkingSpace.parking'] });
  return invoice && staff(user, invoice.reservation.parkingSpace.parking);
});
