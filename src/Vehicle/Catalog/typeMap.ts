import { EntityManager } from '@mikro-orm/core';
import { DnrpaTypeMap } from './DnrpaTypeMap.Entity.js';
import { Model } from '../Model/Model.Entity.js';
import { VehicleType } from '../VehicleType/VehicleType.Entity.js';
import { descKey, nameKey } from '../../Shared/utils/names.js';
import { NOT_ADMITTED_DESCRIPTIONS, NOT_ADMITTED_HINT } from '../../Shared/constants/dnrpa.js';
import { categorizeVehicleType, findBaseType, isBaseVehicleType } from '../../Shared/utils/vehicleTypes.js';

// Tipo sugerido para una descripción del DNRPA que todavía no está en la tabla (RA-26): el tipo creado por el administrador
// cuyo nombre aparece en la descripción ("Pick-up" en "PICK-UP CABINA DOBLE"; si coinciden varios, el más largo) y,
// si no hay, el tipo base de su categoría. `exceptId` deja afuera un tipo (al quitarle una descripción).
export function suggestType(description: string, types: VehicleType[], exceptId?: string): VehicleType | undefined {
  const key = descKey(description);
  const own = types
    .filter((t) => t.isActive !== false && t.id !== exceptId && !isBaseVehicleType(t.name) && descKey(t.name).length >= 3 && key.includes(descKey(t.name)))
    .sort((a, b) => descKey(b.name).length - descKey(a.name).length)[0];
  return own ?? findBaseType(types.filter((t) => t.isActive !== false), categorizeVehicleType(description));
}

// Si a una descripción nueva se le sugiere "No admitir" (camión, remolque…). Es solo la sugerencia: decide el administrador.
export const suggestNotAdmitted = (description: string) => NOT_ADMITTED_HINT.test(nameKey(description));

// Siembra: las descripciones que no entran en una cochera, como no admitidas, salvo las que ya están en la tabla
// (con un tipo elegido o porque ya tienen modelos). Corre después de fillMissingRows.
export async function seedNotAdmitted(em: EntityManager): Promise<number> {
  const have = new Set((await em.find(DnrpaTypeMap, {})).map((r) => r.descriptionKey));
  let created = 0;
  for (const description of NOT_ADMITTED_DESCRIPTIONS) {
    const key = descKey(description);
    if (have.has(key)) continue;
    have.add(key);
    em.create(DnrpaTypeMap, { descriptionKey: key, description, vehicleType: null });
    created++;
  }
  return created;
}

// Crea la fila de cada descripción que ya tiene modelos y todavía no está en la tabla, con el tipo que ya tienen
// esos modelos (el más común). Así lo cargado no cambia de tipo sin que el administrador lo decida.
export async function fillMissingRows(em: EntityManager): Promise<number> {
  const have = new Set((await em.find(DnrpaTypeMap, {})).map((r) => r.descriptionKey));
  const models = await em.find(Model, { dnrpaDescription: { $ne: null } });
  const pending = new Map<string, { description: string; counts: Map<string, number> }>();
  for (const m of models) {
    const key = descKey(m.dnrpaDescription!);
    if (!key || have.has(key)) continue;
    const entry = pending.get(key) ?? { description: m.dnrpaDescription!, counts: new Map() };
    entry.counts.set(m.vehicleType.id, (entry.counts.get(m.vehicleType.id) ?? 0) + 1);
    pending.set(key, entry);
  }
  for (const [descriptionKey, { description, counts }] of pending) {
    const [typeId] = [...counts].sort((a, b) => b[1] - a[1])[0];
    em.create(DnrpaTypeMap, { descriptionKey, description, vehicleType: em.getReference(VehicleType, typeId) });
  }
  return pending.size;
}
