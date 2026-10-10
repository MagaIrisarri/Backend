
export type VehicleCategory = 'AUTO' | 'MOTO' | 'CAMIONETA';

export const VEHICLE_CATEGORIES: readonly VehicleCategory[] = ['AUTO', 'MOTO', 'CAMIONETA'] as const;


/**
 * Única regla para saber de qué categoría es un tipo de vehículo o de plaza, escrito como sea:
 * "Moto", "MOTOCICLETA", "motos" → MOTO; "Camioneta", "Utilitario", "SUV" → CAMIONETA; el resto → AUTO.
 * Las plazas se guardan ya con la categoría (hook de ParkingSpace), pero los tipos de vehículo los carga
 * el administrador con el nombre que quiera, así que para comparar se usa siempre esta función.
 */
export function categorizeVehicleType(raw?: string): VehicleCategory {
  const upper = (raw ?? '').trim().toUpperCase();
  if (upper === 'MOTO' || upper.includes('MOTO') || upper.includes('BICI')) return 'MOTO';
  if (upper === 'CAMIONETA' || upper.includes('CAMION') || upper.includes('PICK') || upper.includes('SUV') || upper.includes('VAN') || upper.includes('UTIL')) return 'CAMIONETA';
  return 'AUTO';
}

/**
 * Compara dos tipos de vehículo y retorna `true` si pertenecen a la misma categoría.
 */
export function matchesVehicleType(typeA?: string, typeB?: string): boolean {
  return categorizeVehicleType(typeA) === categorizeVehicleType(typeB);
}

export function groupSpacesByVehicleType<T extends { vehicleType?: string, isActive?: boolean }>(spaces: T[]) {
  const active = spaces.filter((s) => s.isActive);
  return {
    auto: active.filter((s) => categorizeVehicleType(s.vehicleType) === 'AUTO'),
    moto: active.filter((s) => categorizeVehicleType(s.vehicleType) === 'MOTO'),
    camioneta: active.filter((s) => categorizeVehicleType(s.vehicleType) === 'CAMIONETA'),
  };
}
