import { EntityManager } from '@mikro-orm/core';
import { Holiday } from '../../../Holiday/Holiday.Entity.js';

// Feriados nacionales 2026 y 2027 (D-08, origen oficial), copiados de api.argentinadatos.com/v1/feriados/{año}:
// la única fuente revisada que coincide con los decretos (feriados.io y date.nager.at calculan traslados propios).
// 2026 trae los puentes y la visita papal; 2027 trae las fechas nominales, sin traslados ni puentes hasta que se decreten.
// shortcut: L-12, la fuente (y esta lista de respaldo) es argentinadatos.com y no el Boletín Oficial, cambiar si hay una API oficial
const HOLIDAYS_2026: [string, string][] = [
  ['2026-01-01', 'Año Nuevo'],
  ['2026-02-16', 'Carnaval'],
  ['2026-02-17', 'Carnaval'],
  ['2026-03-23', 'Día no laborable con fines turísticos'],
  ['2026-03-24', 'Día Nacional de la Memoria por la Verdad y la Justicia'],
  ['2026-04-02', 'Día del Veterano y de los Caídos en la Guerra de Malvinas'],
  ['2026-04-03', 'Viernes Santo'],
  ['2026-05-01', 'Día del Trabajador'],
  ['2026-05-25', 'Día de la Revolución de Mayo'],
  ['2026-06-15', 'Paso a la Inmortalidad del General Martín Miguel de Güemes'],
  ['2026-06-20', 'Paso a la Inmortalidad del General Manuel Belgrano'],
  ['2026-07-09', 'Día de la Independencia'],
  ['2026-07-10', 'Día no laborable con fines turísticos'],
  ['2026-08-17', 'Paso a la Inmortalidad del General José de San Martín'],
  ['2026-10-12', 'Día del Respeto a la Diversidad Cultural'],
  ['2026-11-09', 'Visita del papa León XIV'],
  ['2026-11-23', 'Día de la Soberanía Nacional'],
  ['2026-12-07', 'Día no laborable con fines turísticos'],
  ['2026-12-08', 'Día de la Inmaculada Concepción de María'],
  ['2026-12-25', 'Navidad'],
];

const HOLIDAYS_2027: [string, string][] = [
  ['2027-01-01', 'Año Nuevo'],
  ['2027-02-08', 'Carnaval'],
  ['2027-02-09', 'Carnaval'],
  ['2027-03-24', 'Día Nacional de la Memoria por la Verdad y la Justicia'],
  ['2027-03-26', 'Viernes Santo'],
  ['2027-04-02', 'Día del Veterano y de los Caídos en la Guerra de Malvinas'],
  ['2027-05-01', 'Día del Trabajador'],
  ['2027-05-25', 'Día de la Revolución de Mayo'],
  ['2027-06-17', 'Paso a la Inmortalidad del General Martín Miguel de Güemes'],
  ['2027-06-20', 'Paso a la Inmortalidad del General Manuel Belgrano'],
  ['2027-07-09', 'Día de la Independencia'],
  ['2027-08-17', 'Paso a la Inmortalidad del General José de San Martín'],
  ['2027-10-12', 'Día del Respeto a la Diversidad Cultural'],
  ['2027-11-20', 'Día de la Soberanía Nacional'],
  ['2027-12-08', 'Día de la Inmaculada Concepción de María'],
  ['2027-12-25', 'Navidad'],
];

const NATIONAL_HOLIDAYS: [string, string][] = [...HOLIDAYS_2026, ...HOLIDAYS_2027];

// Idempotente. Solo carga un año sin ningún feriado nacional, para que una base vacía funcione sin internet: un feriado que
// el administrador quitó (p. ej. por un traslado) no vuelve en el próximo arranque. Las novedades llegan con
// HolidayService.syncOfficial.
export const seedHolidays = async (em: EntityManager) => {
  for (const year of new Set(NATIONAL_HOLIDAYS.map(([date]) => date.slice(0, 4)))) {
    if (await em.count(Holiday, { owner: null, date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` } })) continue;
    for (const [date, name] of NATIONAL_HOLIDAYS) {
      if (date.startsWith(year)) em.create(Holiday, { date, name, origin: 'oficial' }); // nacional
    }
  }
  await em.flush();
};
