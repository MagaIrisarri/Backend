
export enum ReservationStatus {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADA = 'CONFIRMADA',
  EN_CURSO = 'EN CURSO',
  FINALIZADA = 'FINALIZADA',
  CANCELADA = 'CANCELADA',
}


export const ACTIVE_RESERVATION_STATUSES = [
  ReservationStatus.PENDIENTE,
  ReservationStatus.CONFIRMADA,
  ReservationStatus.EN_CURSO,
] as const;


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

