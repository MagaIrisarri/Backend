// Regla pura: cómo se comparan los nombres (marcas, modelos, tipos, descripciones del DNRPA) y cómo se arma la búsqueda
// de los listados paginados del administrador. Sin base.
// Correr: npx tsx tests-catedra/unit/search.test.ts
import assert from 'node:assert/strict';
import { cleanName, descKey, nameKey } from '../../src/Shared/utils/names.js';
import { likeWords, pageQuery } from '../../src/Shared/utils/pagination.js';
import { z } from 'zod';

// Se guardan sin espacios de más y se comparan sin mayúsculas ni tildes.
assert.equal(cleanName('  Fiat   Cronos '), 'Fiat Cronos');
assert.equal(nameKey(' Camión  utilitario'), nameKey('CAMION UTILITARIO'));
assert.notEqual(nameKey('Pick-up'), nameKey('PICKUP'));
// Las descripciones del DNRPA, además, sin guiones, puntos ni espacios.
assert.equal(descKey('Pick-up'), descKey('PICK UP'));
assert.equal(descKey('Sedán 4 Ptas.'), 'SEDAN4PTAS');

// Búsqueda: cada palabra es un patrón LIKE, con % y _ escapados para que se busquen tal cual.
assert.deepEqual(likeWords('  juan   perez '), ['%juan%', '%perez%']);
assert.deepEqual(likeWords('50%_off'), [String.raw`%50\%\_off%`]);
assert.deepEqual(likeWords(''), []);
assert.deepEqual(likeWords(undefined), []);

// Página: opcional (sin ella, todo); el límite tiene valor por defecto y un máximo.
const query = z.object(pageQuery);
assert.equal(query.parse({}).page, undefined);
assert.equal(query.parse({ page: '2', limit: '10' }).page, 2);
assert.ok(query.parse({}).limit > 0);
assert.ok(!query.safeParse({ page: '0' }).success);
assert.ok(!query.safeParse({ limit: '100000' }).success);

console.log('✓ Búsqueda: nombres sin mayúsculas, tildes ni espacios de más, descripciones del DNRPA y patrones LIKE escapados');
