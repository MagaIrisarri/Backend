// D-06 (confirmado, 6 meses): cuánto se planifica hacia adelante. Única fuente en el backend; se expone en GET /api/shifts/config. El calendario del frontend usa 26 semanas fijas (L-24).
export const PLANNING_HORIZON_MONTHS = 6;

// R-17: cada cuánto se cancelan las reservas pendientes o confirmadas cuyo horario terminó sin ingreso.
export const EXPIRED_RESERVATIONS_CHECK_MINUTES = 5;

// R-28: con cuántas horas de anticipación se manda el recordatorio por email, y cada cuánto se buscan reservas para recordar.
export const REMINDER_HOURS_BEFORE = 2;
export const REMINDER_CHECK_MINUTES = 5;
