import { VehicleTypeRepository, type VehicleTypeUsage } from './VehicleType.Repository.js';
import { VehicleType } from './VehicleType.Entity.js';
import { AppError } from '../../Shared/utils/AppError.js';
import { cleanName, descKey, nameKey } from '../../Shared/utils/names.js';
import { suggestNotAdmitted, suggestType } from '../Catalog/typeMap.js';
import { isBaseVehicleType } from '../../Shared/utils/vehicleTypes.js';

// AUTO, MOTO y CAMIONETA son la base: el catálogo del DNRPA les asigna los modelos nuevos por nombre (Catalog.Repository),
// así que no se renombran ni se dan de baja. Cada tipo tiene sus propias plazas y tarifas (R-30).
const isBase = (t: VehicleType) => isBaseVehicleType(t.name);

// Lo que devuelve la API. `parkings`: en cuántas cocheras tiene plazas activas; sin ninguna, sus vehículos no pueden reservar.
const view = (t: VehicleType, parkings = 0) => ({ id: t.id, name: t.name, isActive: t.isActive, isBase: isBase(t), parkings });

const usedBy = ({ models, vehicles, spaces, prices }: VehicleTypeUsage) =>
  [
    models && `${models} ${models === 1 ? 'modelo' : 'modelos'}`,
    vehicles && `${vehicles} ${vehicles === 1 ? 'vehículo' : 'vehículos'}`,
    spaces && `${spaces} ${spaces === 1 ? 'plaza' : 'plazas'}`,
    prices && `${prices} ${prices === 1 ? 'tarifa vigente' : 'tarifas vigentes'}`,
  ].filter(Boolean).join(', ');

export class VehicleTypeService {
  constructor(private readonly repository: VehicleTypeRepository) {}

  async findAll() {
    const [types, coverage] = await Promise.all([this.repository.findAll(), this.repository.parkingsWithSpaces()]);
    return types.map((t) => view(t, coverage.get(t.id) ?? 0));
  }

  async findOne(id: string) {
    const type = await this.repository.findOne({ id });
    return type && view(type, (await this.repository.parkingsWithSpaces()).get(type.id) ?? 0);
  }

  async create(data: { name: string }) {
    const name = cleanName(data.name);
    await this.assertUniqueName(name);
    return view(await this.repository.add({ name }));
  }

  // Renombrar no cambia nada más: plazas, tarifas, modelos y vehículos apuntan al tipo por su id (R-30).
  async update(id: string, data: { name?: string }) {
    const current = await this.repository.findOne({ id });
    if (!current) return null;
    if (data.name === undefined) return this.findOne(id);
    const name = cleanName(data.name);
    this.assertNotBase(current, 'cambiar de nombre');
    await this.assertUniqueName(name, id);
    await this.repository.update(id, { name });
    return this.findOne(id);
  }

  async remove(id: string): Promise<boolean> {
    const current = await this.repository.findOne({ id });
    if (!current) return false;
    this.assertNotBase(current, 'dar de baja');
    const used = await this.repository.usage(id);
    if (Object.values(used).some(Boolean)) throw new AppError(`No se puede dar de baja “${current.name}”: lo usan ${usedBy(used)}.`, 409);
    return await this.repository.remove({ id });
  }

  // RA-26: las descripciones del DNRPA de la tabla, con cuántos modelos tiene cada una, a qué tipo van hoy (null: no admitida),
  // si son de este tipo y si se le sugieren (su nombre aparece en la descripción). Primero las de este tipo y las sugeridas.
  // `id` null (L-33): el grupo de las no admitidas, con la sugerencia de no admitir (camión, remolque…).
  async descriptions(id: string | null) {
    if (id && !(await this.repository.findOne({ id }))) return null;
    const [rows, models, types] = await Promise.all([this.repository.descriptionRows(), this.repository.describedModels(), this.repository.findAll()]);
    const counts = new Map<string, number>();
    for (const m of models) { const k = descKey(m.dnrpaDescription!); counts.set(k, (counts.get(k) ?? 0) + 1); }
    const list = rows.map((r) => {
      const assigned = (r.vehicleType?.id ?? null) === id;
      return {
        description: r.description, key: r.descriptionKey, models: counts.get(r.descriptionKey) ?? 0,
        vehicleType: r.vehicleType && { id: r.vehicleType.id, name: r.vehicleType.name }, assigned,
        suggested: !assigned && (id ? suggestType(r.description, types)?.id === id : suggestNotAdmitted(r.description)),
      };
    });
    const rank = (d: { assigned: boolean; suggested: boolean }) => (d.assigned ? 0 : d.suggested ? 1 : 2);
    return list.sort((a, b) => rank(a) - rank(b) || b.models - a.models || a.description.localeCompare(b.description, 'es'));
  }

  // Deja en este tipo exactamente las descripciones pedidas (por su clave). Las que eran de este tipo y no vienen
  // vuelven a la sugerencia automática sin este tipo. Mueve modelos y vehículos (409 con reservas activas).
  // `id` null (L-33): deja exactamente esas como no admitidas. Sus modelos ya cargados no cambian (la importación nunca borra);
  // solo dejan de importarse nuevos. Las que se sacan de no admitidas vuelven a la sugerencia y mueven sus modelos.
  async setDescriptions(id: string | null, keys: string[], dryRun: boolean) {
    if (id && !(await this.repository.findOne({ id }))) return null;
    const [rows, types] = await Promise.all([this.repository.descriptionRows(), this.repository.findAll()]);
    const wanted = new Set(keys);
    const unknown = keys.filter((k) => !rows.some((r) => r.descriptionKey === k));
    if (unknown.length) throw new AppError(`Descripción del DNRPA desconocida: ${unknown.slice(0, 3).join(', ')}. Importá el CSV para cargarla.`, 400);
    const changes: { rowId: string; typeId: string | null }[] = [];
    for (const r of rows) {
      const current = r.vehicleType?.id ?? null;
      if (wanted.has(r.descriptionKey)) { if (current !== id) changes.push({ rowId: r.id, typeId: id }); }
      else if (current === id) {
        const back = suggestType(r.description, types, id ?? undefined);
        if (back) changes.push({ rowId: r.id, typeId: back.id });
      }
    }
    return await this.repository.reassignDescriptions(changes, dryRun);
  }

  private assertNotBase(type: VehicleType, action: string) {
    if (isBase(type)) throw new AppError(`“${type.name}” es un tipo base del sistema: no se puede ${action}.`, 409);
  }

  private async assertUniqueName(name: string, exceptId?: string) {
    const key = nameKey(name);
    const same = (await this.repository.findAll()).find((t) => t.id !== exceptId && nameKey(t.name) === key);
    if (same) throw new AppError(`Ya existe el tipo “${same.name}”.`, 409);
  }
}
