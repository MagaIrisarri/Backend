import { AppError } from '../Shared/utils/AppError.js';

// Un día de turnos: lo que guarda una excepción (copia completa, D-02) y lo que arma la semana tipo.
export interface DayShift { employeeId: string; from: string; to: string }
export interface DayClosure { from: string; to: string }
export interface DaySchedule { shifts: DayShift[]; closures: DayClosure[] }
export type Range = [number, number];

// shortcut: L-09, '23:59' hace de 24:00 y no hay turnos que crucen medianoche, guardar minutos o fecha de fin
export const toMin = (t: string): number => (t === '23:59' || t === '24:00' ? 1440 : +t.slice(0, 2) * 60 + +t.slice(3, 5));
export const hhmm = (m: number): string => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

const byStart = (a: Range, b: Range) => a[0] - b[0] || a[1] - b[1];

export function union(ranges: Range[]): Range[] {
  const out: Range[] = [];
  for (const r of [...ranges].sort(byStart)) {
    const last = out[out.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else out.push([r[0], r[1]]);
  }
  return out;
}

// a \ b
export function subtract(a: Range[], b: Range[]): Range[] {
  const cut = union(b);
  const out: Range[] = [];
  for (const [s, e] of union(a)) {
    let cur = s;
    for (const [bs, be] of cut) {
      if (be <= cur || bs >= e) continue;
      if (bs > cur) out.push([cur, bs]);
      cur = Math.max(cur, be);
    }
    if (cur < e) out.push([cur, e]);
  }
  return out;
}

export const overlaps = (a: Range, b: Range): boolean => a[0] < b[1] && b[0] < a[1];
export const covers = (ranges: Range[], r: Range): boolean => union(ranges).some(([s, e]) => s <= r[0] && r[1] <= e);

const shiftRange = (s: DayShift): Range => [toMin(s.from), toMin(s.to)];
const closureRange = (c: DayClosure): Range => [toMin(c.from), toMin(c.to)];

// R-02 (sin solapes en la sucursal) y R-04 (turnos contiguos del mismo empleado se fusionan).
// El frontend resuelve el recorte al arrastrar; acá se rechaza lo que llegue solapado.
export function normalizeDay(day: DaySchedule): DaySchedule {
  const shifts = day.shifts.map(s => ({ ...s, from: hhmm(toMin(s.from)), to: s.to === '23:59' || s.to === '24:00' ? '23:59' : hhmm(toMin(s.to)) }));
  for (const s of shifts) {
    if (toMin(s.from) >= toMin(s.to)) throw new AppError(`Turno inválido: ${s.from} - ${s.to}`, 400);
  }
  const sorted = [...shifts].sort((a, b) => toMin(a.from) - toMin(b.from) || toMin(a.to) - toMin(b.to));
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!, cur = sorted[i]!;
    if (toMin(cur.from) < toMin(prev.to)) {
      throw new AppError(`Los turnos se solapan (${prev.from}-${prev.to} y ${cur.from}-${cur.to})`, 400);
    }
  }
  const merged: DayShift[] = [];
  for (const s of sorted) {
    const last = merged[merged.length - 1];
    if (last && last.employeeId === s.employeeId && toMin(last.to) === toMin(s.from)) last.to = s.to;
    else merged.push({ ...s });
  }
  const closures = union(day.closures.map(closureRange)).map(([a, b]) => ({ from: hhmm(a), to: b === 1440 ? '23:59' : hhmm(b) }));
  for (const c of closures) {
    if (toMin(c.from) >= toMin(c.to)) throw new AppError(`Cierre inválido: ${c.from} - ${c.to}`, 400);
  }
  return { shifts: merged, closures };
}

// R-12: una excepción idéntica a la semana tipo se descarta sola.
export const sameDay = (a: DaySchedule, b: DaySchedule): boolean =>
  JSON.stringify(normalizeDay(a)) === JSON.stringify(normalizeDay(b));

export function employeeRanges(day: DaySchedule, employeeId: string): Range[] {
  return union(day.shifts.filter(s => s.employeeId === employeeId).map(shiftRange));
}

const coveredRanges = (day: DaySchedule): Range[] => union(day.shifts.map(shiftRange));

export interface DayLoss {
  // R-05: tramos que pasan a "cerrado" y R-01: tramos que quedan sin ningún empleado. Cualquier reserva activa los bloquea.
  uncovered: Range[];
  // R-06: tramos que pierde cada empleado.
  byEmployee: Map<string, Range[]>;
}

export function diffDay(before: DaySchedule, after: DaySchedule): DayLoss {
  const closedBefore = union(before.closures.map(closureRange));
  const closedAfter = union(after.closures.map(closureRange));
  const newlyClosed = subtract(closedAfter, closedBefore);
  const openCoveredBefore = subtract(coveredRanges(before), closedBefore);
  const noLongerCovered = subtract(subtract(openCoveredBefore, coveredRanges(after)), closedAfter);
  const byEmployee = new Map<string, Range[]>();
  const employees = new Set(before.shifts.map(s => s.employeeId));
  for (const id of employees) {
    const lost = subtract(employeeRanges(before, id), employeeRanges(after, id));
    if (lost.length) byEmployee.set(id, lost);
  }
  return { uncovered: union([...newlyClosed, ...noLongerCovered]), byEmployee };
}
