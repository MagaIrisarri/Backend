import { nameKey } from './names.js';

export type VehicleCategory = 'AUTO' | 'MOTO' | 'CAMIONETA';

// Los tipos base: el catálogo del DNRPA les asigna los modelos por nombre (Catalog.Repository).
export const VEHICLE_CATEGORIES: readonly VehicleCategory[] = ['AUTO', 'MOTO', 'CAMIONETA'] as const;

export const isBaseVehicleType = (name: string) => (VEHICLE_CATEGORIES as readonly string[]).includes(name);

/**
 * Tipo base que corresponde a una descripción escrita como sea:
 * "Moto", "MOTOCICLETA", "motos" → MOTO; "Camioneta", "Utilitario", "SUV" → CAMIONETA; el resto → AUTO.
 * Plazas y tarifas ya no la usan (R-30: van por el id del tipo). Queda para dos cosas: asignar un tipo base
 * a los modelos del CSV del DNRPA y del vehiculos.json, y pasar al tipo los datos guardados como texto (vehicleTypeRefs).
 */
export function categorizeVehicleType(raw?: string): VehicleCategory {
  const upper = (raw ?? '').trim().toUpperCase();
  if (upper === 'MOTO' || upper.includes('MOTO') || upper.includes('BICI')) return 'MOTO';
  if (upper === 'CAMIONETA' || upper.includes('CAMION') || upper.includes('PICK') || upper.includes('SUV') || upper.includes('VAN') || upper.includes('UTIL')) return 'CAMIONETA';
  return 'AUTO';
}

// Prefijo del código de plaza: A, M y C para los tipos base (A-01, M-01, C-01); los demás, sus tres primeras letras (UTI-01).
export function spacePrefix(typeName: string): string {
  if (isBaseVehicleType(typeName)) return typeName[0];
  return nameKey(typeName).replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'P';
}
