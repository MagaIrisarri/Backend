// Autochequeo de las reglas puras (R-02, R-04, R-05, R-06, R-12, L-03). Correr: npx tsx tests-catedra/unit/Schedule.test.ts
import assert from 'node:assert/strict';
import { clipBefore, normalizeDay, sameDay, diffDay, subtract, union } from '../../src/EmployeeShift/Schedule.js';

const day = (shifts: [string, string, string][], closures: [string, string][] = []) => ({
  shifts: shifts.map(([employeeId, from, to]) => ({ employeeId, from, to })),
  closures: closures.map(([from, to]) => ({ from, to })),
});

// R-04: contiguos del mismo empleado se fusionan; de distinto empleado no.
assert.deepEqual(normalizeDay(day([['a', '07:00', '11:00'], ['a', '11:00', '15:00'], ['b', '15:00', '19:00']])).shifts,
  [{ employeeId: 'a', from: '07:00', to: '15:00' }, { employeeId: 'b', from: '15:00', to: '19:00' }]);

// R-02: solape rechazado, aunque sean empleados distintos.
assert.throws(() => normalizeDay(day([['a', '07:00', '12:00'], ['b', '11:00', '15:00']])), /solapan/);
assert.throws(() => normalizeDay(day([['a', '10:00', '09:00']])), /inválido/);

// R-12: copia idéntica a la plantilla (aunque llegue desordenada o sin fusionar).
assert.ok(sameDay(day([['a', '07:00', '15:00']]), day([['a', '11:00', '15:00'], ['a', '07:00', '11:00']])));
assert.ok(!sameDay(day([['a', '07:00', '15:00']]), day([['a', '07:00', '14:00']])));

// R-06: lo que pierde cada empleado.
const lose = diffDay(day([['a', '07:00', '15:00']]), day([['a', '09:00', '15:00'], ['b', '07:00', '09:00']]));
assert.deepEqual(lose.byEmployee.get('a'), [[420, 540]]);
assert.deepEqual(lose.uncovered, []); // b lo reemplaza: no queda sin cobertura

// R-01: horas que quedan sin ningún empleado.
assert.deepEqual(diffDay(day([['a', '07:00', '15:00']]), day([['a', '07:00', '12:00']])).uncovered, [[720, 900]]);

// R-05: cierre nuevo bloquea ese tramo; un cierre que ya existía no.
assert.deepEqual(diffDay(day([['a', '07:00', '15:00']]), day([['a', '07:00', '15:00']], [['13:00', '15:00']])).uncovered, [[780, 900]]);
assert.deepEqual(diffDay(day([], [['00:00', '06:00']]), day([], [['00:00', '06:00']])).uncovered, []);

assert.deepEqual(subtract([[0, 10]], [[3, 5]]), [[0, 3], [5, 10]]);
assert.deepEqual(union([[0, 5], [5, 8], [10, 12]]), [[0, 8], [10, 12]]);
console.log('Schedule: OK');

// L-03: a las 12:10 solo cuenta lo que ya pasó; cambiar la tarde no toca el pasado, recortar la mañana sí.
const morning = day([['a', '08:00', '14:00'], ['b', '14:00', '21:00']], [['13:00', '14:00']]);
assert.deepEqual(clipBefore(morning, 730), day([['a', '08:00', '12:10']]));
assert.ok(sameDay(clipBefore(morning, 730), clipBefore(day([['a', '08:00', '13:00'], ['c', '13:00', '21:00']]), 730)));
assert.ok(!sameDay(clipBefore(morning, 730), clipBefore(day([['a', '08:00', '12:00'], ['b', '12:00', '21:00']]), 730)));
