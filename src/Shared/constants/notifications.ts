// L-31: la campana muestra los avisos de los últimos días, de a páginas, y el contador cuenta sobre la misma ventana.
export const NOTIFICATIONS_WINDOW_DAYS = 30;
export const NOTIFICATIONS_PAGE_SIZE = 30;
// Más viejos que esto se borran: el historial que importa son las reservas y las facturas, el aviso es efímero.
export const NOTIFICATIONS_RETENTION_DAYS = 90;
export const NOTIFICATIONS_PURGE_HOURS = 24;
