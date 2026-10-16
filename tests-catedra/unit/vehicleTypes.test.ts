// Regla pura: tipo base de una descripción (catálogo del DNRPA y vehiculos.json) y prefijo del código de plaza (R-30). Sin base.
// Correr: npx tsx tests-catedra/unit/vehicleTypes.test.ts
import assert from 'node:assert/strict';
import { categorizeVehicleType, findBaseType, isBaseVehicleType, spacePrefix } from '../../src/Shared/utils/vehicleTypes.js';

// Cualquier forma de escribirlo cae en uno de los tres tipos base; lo desconocido es AUTO.
for (const [raw, base] of [
  ['Moto', 'MOTO'], ['MOTOCICLETA', 'MOTO'], ['motos', 'MOTO'], ['Cuatriciclo/Bicimoto', 'MOTO'],
  ['Camioneta', 'CAMIONETA'], ['PICK-UP', 'CAMIONETA'], ['SUV', 'CAMIONETA'], ['Utilitario', 'CAMIONETA'], ['FURGON VAN', 'CAMIONETA'],
  ['Sedán 4 puertas', 'AUTO'], ['', 'AUTO'], [undefined, 'AUTO'],
] as const) assert.equal(categorizeVehicleType(raw), base, String(raw));

// "Auto" y "AUTO" son el mismo tipo base; el que ya existe se reusa en vez de crear otro.
assert.ok(isBaseVehicleType('Auto') && isBaseVehicleType(' moto ') && !isBaseVehicleType('Utilitario'));
assert.equal(findBaseType([{ name: 'Moto' }, { name: 'Auto' }], 'AUTO')?.name, 'Auto');
assert.equal(findBaseType([{ name: 'Utilitario' }], 'CAMIONETA'), undefined);

// Prefijo del código de plaza: una letra para los base, las tres primeras sin tildes para el resto, 'P' si no queda nada.
assert.deepEqual(['AUTO', 'MOTO', 'CAMIONETA'].map(spacePrefix), ['A', 'M', 'C']);
assert.equal(spacePrefix('Utilitario'), 'UTI');
assert.equal(spacePrefix('Ómnibus'), 'OMN');
assert.equal(spacePrefix('---'), 'P');

console.log('✓ Tipos de vehículo: tipo base de una descripción, tipo base existente y prefijo del código de plaza');
