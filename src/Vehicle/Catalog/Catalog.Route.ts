import { Router } from 'express';
import { orm } from '../../Shared/db/orm.js';
import { validateSchema } from '../../Shared/middlewares/ValidateSchemas.js';
import { auth } from '../../Shared/middlewares/auth.js';
import { UserType } from '../../Shared/constants/status.js';
import { CatalogController } from './Catalog.Controller.js';
import { CatalogService } from './Catalog.Service.js';
import { CatalogRepository } from './Catalog.Repository.js';
import { importCatalogSchema } from './Catalog.Schema.js';

export const catalogRouter = Router();
const catalogController = new CatalogController(new CatalogService(new CatalogRepository(orm.em)));

// El límite de body de esta ruta se sube en index.ts, antes del express.json() global.
catalogRouter.post('/import', auth(UserType.ADMINISTRADOR), validateSchema(importCatalogSchema), catalogController.import);

export default catalogRouter;
