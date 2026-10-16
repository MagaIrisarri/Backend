// Regla pura de cobro (R-14): horas reservadas, mínimo de 1 hora, 10 minutos de gracia y horas extra al salir. Sin base.
// Correr: npx tsx tests-catedra/unit/billing.test.ts
import assert from 'node:assert/strict';
import { billHours } from '../../src/Reservation/billing.js';
import { CHECKOUT_GRACE_MINUTES } from '../../src/Shared/constants/schedule.js';

const start = new Date('2026-10-20T10:00:00');
const at = (minutes: number) => new Date(start.getTime() + minutes * 60_000);
const bill = (reservedMin: number, exitMin: number) => billHours(start, at(reservedMin), at(exitMin));

// Se retira antes o justo a tiempo: paga lo reservado, sin extra.
assert.deepEqual(bill(120, 30), { reserved: 2, extra: 0, total: 2 });
assert.deepEqual(bill(120, 120), { reserved: 2, extra: 0, total: 2 });

// Mínimo una hora, aunque la reserva o la estadía sean más cortas.
assert.deepEqual(bill(30, 10), { reserved: 1, extra: 0, total: 1 });
assert.deepEqual(bill(0, 0), { reserved: 1, extra: 0, total: 1 });

// Una reserva de horas no enteras se redondea para arriba.
assert.deepEqual(bill(90, 60), { reserved: 2, extra: 0, total: 2 });

// Gracia: hasta CHECKOUT_GRACE_MINUTES después del fin no hay hora extra; un minuto más, ya cuenta una entera.
assert.equal(CHECKOUT_GRACE_MINUTES, 10);
assert.deepEqual(bill(120, 120 + CHECKOUT_GRACE_MINUTES), { reserved: 2, extra: 0, total: 2 });
assert.deepEqual(bill(120, 121 + CHECKOUT_GRACE_MINUTES), { reserved: 2, extra: 1, total: 3 });

// Cada hora empezada (pasada la gracia) cuenta entera.
assert.deepEqual(bill(120, 190), { reserved: 2, extra: 1, total: 3 });
assert.deepEqual(bill(120, 191), { reserved: 2, extra: 2, total: 4 });
assert.deepEqual(bill(60, 6 * 60), { reserved: 1, extra: 5, total: 6 });

console.log('✓ Cobro de la salida (R-14): horas reservadas, mínimo 1, gracia de 10 min y horas extra');
