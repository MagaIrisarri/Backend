import { Router } from 'express';
import { orm } from '../Shared/db/orm.js';
import { StatsController } from './Stats.Controller.js';
import { StatsRepository } from './Stats.Repository.js';
import { StatsService } from './Stats.Service.js';
import { statsSummarySchema } from './Stats.Schema.js';
import { validateSchema } from '../Shared/middlewares/ValidateSchemas.js';
import { auth } from '../Shared/middlewares/auth.js';
import { UserType } from '../Shared/constants/status.js';

// Panel del administrador, opcionalmente limitado a una localidad (?province=&locality=).
export const statsRouter = Router();

const statsController = new StatsController(new StatsService(new StatsRepository(orm.em)));

statsRouter.get('/summary', auth(UserType.ADMINISTRADOR), validateSchema(statsSummarySchema), statsController.summary);

export default statsRouter;
