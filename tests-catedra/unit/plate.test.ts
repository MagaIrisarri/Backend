// Regla pura: formatos argentinos de patente (PLATE_REGEX, el mismo que repite Frontend/src/utils/plate.ts) y rango del año (L-28). Sin base.
// Correr: npx tsx tests-catedra/unit/plate.test.ts
import assert from 'node:assert/strict';
import { PLATE_REGEX, MIN_VEHICLE_YEAR, createVehicleSchema } from '../../src/Vehicle/Vehicle.Schema.js';

for (const ok of ['AB123CD', 'ABC123', 'A123BCD', '123ABC']) assert.ok(PLATE_REGEX.test(ok), ok);
for (const bad of ['AB12CD', 'ABCD123', 'ab123cd', 'AB-123-CD', '1234ABC', '']) assert.ok(!PLATE_REGEX.test(bad), bad);

// El esquema normaliza antes de validar: minúsculas, espacios y guiones se aceptan.
const body = (extra: object) => ({ body: { brandId: crypto.randomUUID(), modelId: crypto.randomUUID(), ...extra } });
const parsed = createVehicleSchema.safeParse(body({ plate: 'ab 123-cd' }));
assert.ok(parsed.success, JSON.stringify(parsed.error?.issues));
assert.equal(parsed.data!.body.plate, 'AB123CD');
assert.ok(!createVehicleSchema.safeParse(body({ plate: 'XYZ' })).success);

// Año opcional, entre el piso fijo y el año próximo.
const next = new Date().getFullYear() + 1;
assert.ok(createVehicleSchema.safeParse(body({ plate: 'ABC123', year: MIN_VEHICLE_YEAR })).success);
assert.ok(createVehicleSchema.safeParse(body({ plate: 'ABC123', year: next })).success);
assert.ok(!createVehicleSchema.safeParse(body({ plate: 'ABC123', year: MIN_VEHICLE_YEAR - 1 })).success);
assert.ok(!createVehicleSchema.safeParse(body({ plate: 'ABC123', year: next + 1 })).success);

console.log('✓ Patente: formatos argentinos, normalización y rango del año');
