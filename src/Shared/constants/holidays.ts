// L-12: calendario oficial de api.argentinadatos.com (toma los datos de La Nación; sin autenticación ni límites publicados).
export const OFFICIAL_HOLIDAYS_URL = 'https://api.argentinadatos.com/v1/feriados';
export const OFFICIAL_HOLIDAYS_TIMEOUT_MS = 10_000;
// Se consulta al arrancar y una vez por día: agrega las fechas nuevas y avisa al administrador de las que ya no figuran.
export const HOLIDAYS_SYNC_HOURS = 24;
