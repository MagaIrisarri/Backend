# Pruebas automatizadas

Las pruebas que se entregan a la cátedra están en la carpeta `tests-catedra/` de cada repo y se versionan. Las demás, de desarrollo, viven en `tests/`, que es local y está en el `.gitignore`.

## Qué hay

| Repo | Tipo | Archivo | Qué prueba |
|---|---|---|---|
| Backend | Unitaria 1 | [`tests-catedra/unit/Schedule.test.ts`](../tests-catedra/unit/Schedule.test.ts) | Reglas puras de turnos: solapes (R-02), fusión de tramos contiguos (R-04), horas sin cobertura (R-01), cierres (R-05), lo que pierde cada empleado (R-06), excepción igual a la plantilla (R-12) y franjas ya pasadas de hoy (L-03) |
| Backend | Unitaria 2 | [`tests-catedra/unit/billing.test.ts`](../tests-catedra/unit/billing.test.ts) | Cobro de la salida (R-14): horas reservadas, mínimo de 1 hora, 10 minutos de gracia y horas extra |
| Backend | Unitaria 3 | [`tests-catedra/unit/vehicleTypes.test.ts`](../tests-catedra/unit/vehicleTypes.test.ts) | Tipo base de una descripción del DNRPA, tipo base existente y prefijo del código de plaza (R-30) |
| Backend | Unitaria 4 | [`tests-catedra/unit/plate.test.ts`](../tests-catedra/unit/plate.test.ts) | Formatos argentinos de patente, normalización y rango del año del vehículo |
| Backend | Unitaria extra | [`tests-catedra/unit/search.test.ts`](../tests-catedra/unit/search.test.ts) | Comparación de nombres sin mayúsculas ni tildes y búsqueda de los listados paginados |
| Backend | Integración | [`tests-catedra/integration/Reservation.db.test.ts`](../tests-catedra/integration/Reservation.db.test.ts) | Contra MySQL: reserva, ingreso (con cambio de plaza si sigue el anterior), extender, servicios, salida con factura, código, valoración y recordatorio |
| Frontend | Componente | [`tests-catedra/unit/Pager.test.tsx`](https://github.com/MagaIrisarri/Frontend/blob/master/tests-catedra/unit/Pager.test.tsx) | Paginador: rango visible, anterior y siguiente, bordes, estado ocupado y que no aparezca con una sola página (Vitest y Testing Library) |
| Frontend | End-to-end | [`tests-catedra/e2e/search.spec.ts`](https://github.com/MagaIrisarri/Frontend/blob/master/tests-catedra/e2e/search.spec.ts) | En el navegador (Playwright): búsqueda por ciudad, barrio o provincia, filtro del listado y encuadre del mapa, con la API simulada dentro de la spec |

## Cómo se corren

Requisitos: Node.js 22 o más nuevo y `pnpm install` en cada repo. La integración necesita MySQL con el usuario de `DB_USER` y `DB_PASSWORD` (por defecto `root` / `pass`).

| Repo | Comando | Qué corre |
|---|---|---|
| Backend | `pnpm test` | Las 5 unitarias, sin base (`node --test` con `tsx`) |
| Backend | `DB_NAME=parkingdb_checkout_test pnpm test:integration` | La de integración. Crea la base, la usa y **la borra al terminar**: se niega a correr si `DB_NAME` no termina en `_test` |
| Frontend | `pnpm test` | El test de componente (Vitest con jsdom) |
| Frontend | `pnpm test:e2e` | La e2e (Playwright, Chromium). Levanta sola el servidor de desarrollo en el puerto 5173 y no necesita el backend. La primera vez: `pnpm exec playwright install chromium` |

En Windows, la variable del comando de integración se pone así en PowerShell: `$env:DB_NAME='parkingdb_checkout_test'; pnpm test:integration`.

## Evidencia: salida de consola

Corridas del 16/10/2026, con Node.js v26.3.0, en Windows 10. Backend sobre el commit `22c9cc6` y Frontend sobre `efc1fba`, con los cambios de `tests-catedra/` sin commitear todavía.

### Backend — `pnpm test`

```text
$ node --import tsx --test "tests-catedra/unit/*.test.ts"
Schedule: OK
✔ tests-catedra\unit\Schedule.test.ts (305.5934ms)
✓ Cobro de la salida (R-14): horas reservadas, mínimo 1, gracia de 10 min y horas extra
✔ tests-catedra\unit\billing.test.ts (279.4682ms)
✓ Patente: formatos argentinos, normalización y rango del año
✔ tests-catedra\unit\plate.test.ts (359.7142ms)
✓ Búsqueda: nombres sin mayúsculas, tildes ni espacios de más, descripciones del DNRPA y patrones LIKE escapados
✔ tests-catedra\unit\search.test.ts (245.2154ms)
✓ Tipos de vehículo: tipo base de una descripción, tipo base existente y prefijo del código de plaza
✔ tests-catedra\unit\vehicleTypes.test.ts (257.7446ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 396.427
```

### Backend — `pnpm test:integration`

```text
$ node --import tsx --test tests-catedra/integration/Reservation.db.test.ts
✓ Ingreso (con cambio de plaza si sigue el anterior), salida, reservas con la cochera llena hoy, extender, servicios, monto real, código (R-26), valoración (R-27) y recordatorio (R-28)
✔ tests-catedra\integration\Reservation.db.test.ts (13633.9831ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 13641.2262
```

### Frontend — `pnpm test`

```text
Already up to date
Done in 45ms using pnpm v11.5.2
$ vitest run tests-catedra/unit

 RUN  v5.0.4 C:/Users/Valentino/Documents/2026/Frontend


 Test Files  1 passed (1)
      Tests  4 passed (4)
   Start at  00:58:32
   Duration  1.43s (environment 65%, import 22%, tests 12%, transform 2%)
```

### Frontend — `pnpm test:e2e`

```text
Already up to date
Done in 55ms using pnpm v11.5.2
$ playwright test tests-catedra/e2e

Running 9 tests using 1 worker

  ok 1 [chromium] › tests-catedra\e2e\search.spec.ts:58:3 › Búsqueda por zona › sin búsqueda, el mapa encuadra las dos ciudades (1.2s)
  ok 2 [chromium] › tests-catedra\e2e\search.spec.ts:67:3 › Búsqueda por zona › "San Nicolás" filtra el listado y encuadra el mapa sobre sus tres cocheras (2.6s)
  ok 3 [chromium] › tests-catedra\e2e\search.spec.ts:80:3 › Búsqueda por zona › ciudad y barrio juntos: "centro san nicolas" no trae el Centro de Rosario (1.1s)
  ok 4 [chromium] › tests-catedra\e2e\search.spec.ts:89:3 › Búsqueda por zona › volver de San Nicolás a Rosario mueve el mapa de nuevo (2.2s)
  ok 5 [chromium] › tests-catedra\e2e\search.spec.ts:97:3 › Búsqueda por zona › la provincia también se busca: "buenos aires" trae solo San Nicolás (834ms)
  ok 6 [chromium] › tests-catedra\e2e\search.spec.ts:122:3 › Buscar en esta zona › los encuadres automáticos (por texto) no ofrecen el botón (2.4s)
  ok 7 [chromium] › tests-catedra\e2e\search.spec.ts:129:3 › Buscar en esta zona › acercarse a Rosario y buscar en esa zona deja solo sus cocheras (5.1s)
  ok 8 [chromium] › tests-catedra\e2e\search.spec.ts:149:3 › Buscar en esta zona › abrir el listado fija la localidad que se ve, sin mover el mapa (3.0s)
  ok 9 [chromium] › tests-catedra\e2e\search.spec.ts:163:3 › Buscar en esta zona › escribir en el buscador descarta la zona: el texto manda y mueve el mapa (4.7s)

  9 passed (23.8s)
```
