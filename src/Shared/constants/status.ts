
export enum ReservationStatus {
  PENDIENTE = 'PENDIENTE',
  EN_CURSO = 'EN CURSO',
  FINALIZADA = 'FINALIZADA',
  CANCELADA = 'CANCELADA',
}


export const ACTIVE_RESERVATION_STATUSES = [
  ReservationStatus.PENDIENTE,
  ReservationStatus.EN_CURSO,
] as const;


export enum NotificationType {
  RESERVA_NUEVA = 'RESERVA_NUEVA',
  RESERVA_CANCELADA = 'RESERVA_CANCELADA',
  RESERVA_VENCIDA = 'RESERVA_VENCIDA',
  RESERVA_EXTENDIDA = 'RESERVA_EXTENDIDA',
  PLAZA_CAMBIADA = 'PLAZA_CAMBIADA',
  SALIDA = 'SALIDA',
  RECORDATORIO = 'RECORDATORIO',
  INGRESO = 'INGRESO',
  RESERVA_TRANSFERIDA = 'RESERVA_TRANSFERIDA',
  SUCURSAL_LLENA = 'SUCURSAL_LLENA',
  SUCURSAL_PAUSADA = 'SUCURSAL_PAUSADA',
}

// Avisos que el usuario puede apagar desde su perfil (User.mutedNotifications). Cancelaciones, salidas, vencidas y cambios
// de plaza no se apagan: tocan el lugar o la plata del cliente.
export const MUTABLE_NOTIFICATIONS = [NotificationType.RESERVA_NUEVA, NotificationType.SUCURSAL_LLENA] as const;

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

