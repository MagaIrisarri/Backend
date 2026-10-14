import { z } from 'zod';

export const MAX_CATALOG_IMPORT_ITEMS = 5000;

// Los nombres cortos o vacíos no rechazan el pedido entero: el servicio los cuenta como omitidos.
export const importCatalogSchema = z.object({
  body: z.object({
    dryRun: z.boolean().default(false),
    items: z.array(z.object({
      brand: z.string().max(100),
      model: z.string().max(100),
      type: z.string().max(100).default(''),
    })).max(MAX_CATALOG_IMPORT_ITEMS, `Se pueden importar hasta ${MAX_CATALOG_IMPORT_ITEMS} modelos por vez`),
    // RA-26: tipo elegido en la vista previa para cada descripción nueva del DNRPA (descripción → id del tipo).
    typeMap: z.record(z.string().max(100), z.string().uuid('Tipo de vehículo inválido')).default({}),
  }),
});
