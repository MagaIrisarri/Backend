/**
 * Regex y constantes de validación compartidas.
 *
 * Reemplaza:
 *  - `TimeRegex` en EmployeeShift.Schema.ts L15
 *  - `TimeRegex` en Parking.Schema.ts L3
 */

/** Valida formato de hora HH:mm o HH:mm:ss (24h) */
export const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

