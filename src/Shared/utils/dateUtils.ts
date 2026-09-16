/**
 * Utilidades de fecha y hora compartidas.
 *
 * Reemplaza:
 *  - `getHHMM`   en Reservation.Service.ts L40-44
 *  - `formatTime` en Reservation.Repository.ts L114-118
 */

/**
 * Formatea un Date a string `HH:mm`.
 *
 * @example formatTimeHHMM(new Date('2026-01-01T09:05:00')) // '09:05'
 */
export function formatTimeHHMM(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

