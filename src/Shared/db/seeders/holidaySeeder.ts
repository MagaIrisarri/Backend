import { EntityManager } from '@mikro-orm/core';
import { Holiday } from '../../../Holiday/Holiday.Entity.js';

// Feriados nacionales 2026 (D-08, origen oficial). Fuente: date.nager.at/api/v3/PublicHolidays/2026/AR,
// contrastada con api.argentinadatos.com. No incluye días no laborables con fines turísticos ni la visita papal
// del 09/11: el dueño puede cargarlos a mano. Verificar contra el Boletín Oficial.
// shortcut: L-12, lista de un solo año cargada a mano, cargar desde la fuente oficial cada año
const HOLIDAYS_2026: [string, string][] = [
  ['2026-01-01', 'Año Nuevo'],
  ['2026-02-16', 'Carnaval'],
  ['2026-02-17', 'Carnaval'],
  ['2026-03-24', 'Día Nacional de la Memoria por la Verdad y la Justicia'],
  ['2026-04-02', 'Día del Veterano y de los Caídos en la Guerra de Malvinas'],
  ['2026-04-03', 'Viernes Santo'],
  ['2026-05-01', 'Día del Trabajador'],
  ['2026-05-25', 'Día de la Revolución de Mayo'],
  ['2026-06-15', 'Paso a la Inmortalidad del General Martín Miguel de Güemes'],
  ['2026-06-20', 'Paso a la Inmortalidad del General Manuel Belgrano'],
  ['2026-07-09', 'Día de la Independencia'],
  ['2026-08-17', 'Paso a la Inmortalidad del General José de San Martín'],
  ['2026-10-12', 'Día del Respeto a la Diversidad Cultural'],
  ['2026-11-23', 'Día de la Soberanía Nacional'],
  ['2026-12-08', 'Día de la Inmaculada Concepción de María'],
  ['2026-12-25', 'Navidad'],
];

// Idempotente: no depende de que la base esté vacía.
export const seedHolidays = async (em: EntityManager) => {
  for (const [date, name] of HOLIDAYS_2026) {
    if (!(await em.findOne(Holiday, { date, owner: null }))) em.create(Holiday, { date, name, origin: 'oficial' }); // nacional
  }
  await em.flush();
};
