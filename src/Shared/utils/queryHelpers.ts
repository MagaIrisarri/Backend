/**
 * Genera la condición de solapamiento temporal para queries de MongoDB/MikroORM.
 *
 * Reemplaza el patrón repetido:
 *   $and: [{ startTime: { $lt: endTime } }, { endTime: { $gt: startTime } }]
 *
 * Aparece en:
 *  - Reservation.Repository.ts L106-108, L161-163, L188-190, L225-227, L242-244
 *  - EmployeeShift.Repository.ts L73-76
 */

/**
 * Retorna un filtro `$and` que detecta solapamiento entre dos rangos de tiempo.
 *
 * Un rango [A_start, A_end] se solapa con [B_start, B_end] cuando:
 *   A_start < B_end AND A_end > B_start
 *
 * @param startTime - Inicio del rango a comparar
 * @param endTime   - Fin del rango a comparar
 * @param startField - Nombre del campo de inicio en la entidad (default: 'startTime')
 * @param endField   - Nombre del campo de fin en la entidad (default: 'endTime')
 */
export function overlapFilter(
  startTime: Date,
  endTime: Date,
  startField: string = 'startTime',
  endField: string = 'endTime',
) {
  return {
    $and: [
      { [startField]: { $lt: endTime } },
      { [endField]: { $gt: startTime } },
    ],
  };
}

