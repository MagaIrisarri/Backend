/**
 * Constantes de estados de reserva.
 *
 * Reemplaza los ~20+ strings mágicos de estados dispersos en:
 *  - Reservation.Repository.ts (12 ocurrencias)
 *  - Reservation.Service.ts (8 ocurrencias)
 *  - ParkingSpace.Service.ts (2 ocurrencias)
 *  - Parking.Repository.ts (4 ocurrencias)
 *  - Parking.Service.ts (2 ocurrencias)
 */

export enum ReservationStatus {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADA = 'CONFIRMADA',
  EN_CURSO = 'EN CURSO',
  FINALIZADA = 'FINALIZADA',
  CANCELADA = 'CANCELADA',
}

/**
 * Estados que representan una reserva "activa" (no finalizada ni cancelada).
 * Para usar en queries: `{ status: { $in: ACTIVE_RESERVATION_STATUSES } }`
 */
export const ACTIVE_RESERVATION_STATUSES = [
  ReservationStatus.PENDIENTE,
  ReservationStatus.CONFIRMADA,
  ReservationStatus.EN_CURSO,
] as const;

/**
 * Constantes de estados de usuario.
 */
export enum UserStatus {
  ACTIVO = 'ACTIVO',
  BAJA = 'BAJA',
}

export enum UserType {
  CLIENTE = 'CLIENTE',
  DUENO = 'DUEÑO',
  EMPLEADO = 'EMPLEADO',
  ADMINISTRADOR = 'ADMINISTRADOR',
}

