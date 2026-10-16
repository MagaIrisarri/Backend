// D-06 (confirmado, 6 meses): cuánto se planifica hacia adelante. Única fuente en el backend; se expone en GET /api/shifts/config. El calendario del frontend usa 26 semanas fijas (L-24).
export const PLANNING_HORIZON_MONTHS = 6;

// R-17: cada cuánto se cancelan las reservas pendientes sin ingreso pasada la tolerancia de llegada.
export const EXPIRED_RESERVATIONS_CHECK_MINUTES = 5;

// R-16/R-17: minutos de tolerancia alrededor del inicio reservado. El ingreso se registra desde ese tiempo antes
// (sin pasar el margen de la sucursal, que es lo que garantiza la plaza libre) y hasta ese tiempo después; si no llegó, se cancela.
// El cobro sigue contando desde el inicio reservado.
export const ARRIVAL_TOLERANCE_MINUTES = 15;

// R-22: margen por defecto entre dos reservas de la misma plaza, en minutos. Cubre la gracia de la salida (10) más la llegada
// temprana del siguiente (15); si alguien se queda más, R-21 reubica a quien llega.
export const DEFAULT_RESERVATION_MARGIN_MINUTES = 30;
export const MAX_RESERVATION_MARGIN_MINUTES = 240;

// R-14: minutos de gracia después del fin reservado antes de cobrar una hora extra (salir del lugar o hacer la fila de pago).
// Pasada la gracia, la hora extra se cuenta desde el fin reservado, igual que sin gracia.
export const CHECKOUT_GRACE_MINUTES = 10;

// R-28: con cuántas horas de anticipación se manda el recordatorio, y cada cuánto se buscan reservas para recordar.
export const REMINDER_HOURS_BEFORE = 2;
export const REMINDER_CHECK_MINUTES = 5;
